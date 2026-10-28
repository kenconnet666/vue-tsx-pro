/**
 * 试运行（ROADMAP 14.6）：在内存库与假时钟上按步骤走一遍流程，返回走过的路、停在哪、等谁处理。
 * 设计器的“试运行”经接口调用它（与真实引擎同一套规则），单元测试也直接用。出错不抛出，放在结果里给人看。
 *
 *   const run = await simulate(purchase, {
 *     variables: { amount: '12000' },
 *     steps: [{ node: 'review', outcome: 'pass' }, { wait: { hours: 4 } }],
 *   });
 *   run.status; run.path.map((e) => e.node); run.open; run.error
 */
import type { Duration, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { FlowCandidate, FlowWorkItem } from './entities.ts';
import { FlowError } from './errors.ts';
import { createTestEngine } from './testing.ts';
import type { Actor, FlowEngineOptions, FlowEventView, InstanceSummary } from './types.ts';

/** 试运行的一步 */
export type SimulationStep =
  /** 处理某个节点上开着的待办（以它的处理人或管理员的身份） */
  | {
      readonly node: string;
      readonly outcome: string;
      readonly variables?: Readonly<Record<string, unknown>>;
      readonly comment?: string;
      readonly returnTo?: string;
    }
  /** 时间往后拨，执行到点的作业（定时、时限、提醒、异步动作） */
  | { readonly wait: Duration }
  /** 外部事件 */
  | {
      readonly signal: string;
      readonly outcome?: string;
      readonly data?: Readonly<Record<string, unknown>>;
    };

/** 试运行的输入 */
export interface SimulationInput {
  /** 发起时的流程变量 */
  readonly variables?: Readonly<Record<string, unknown>>;
  /** 发起人；不写时是 'initiator' */
  readonly initiator?: Actor;
  readonly steps?: readonly SimulationStep[];
  /** 扩展、组织：试运行时多半给假的实现 */
  readonly options?: Omit<FlowEngineOptions, 'adapter' | 'clock'>;
}

/** 停在某个节点上等谁 */
export interface OpenItem {
  readonly node: string;
  readonly nodeName: string;
  readonly assignee: string | null;
  /** 收件箱的候选（角色、部门写成“种类:编号”） */
  readonly candidates: readonly string[];
  readonly dueAt: Date | null;
}

/** 试运行的结果 */
export interface SimulationResult {
  readonly status: InstanceSummary['status'] | 'not-started';
  readonly result: string | null;
  readonly current: InstanceSummary['current'];
  readonly variables: Readonly<Record<string, unknown>>;
  /** 走过的路：全部流转记录 */
  readonly path: readonly FlowEventView[];
  /** 还开着的待办 */
  readonly open: readonly OpenItem[];
  /** 哪一步出了错（发起是第 0 步，之后按 steps 从 1 数）；没出错时没有 */
  readonly error?: { readonly step: number; readonly code: string; readonly message: string };
}

/** 按步骤试运行一个流程定义（不用先发布到真实的库） */
export async function simulate(
  definition: ProcessDefinition,
  input: SimulationInput = {},
): Promise<SimulationResult> {
  const { engine, clock } = await createTestEngine({ admins: ['admin'], ...input.options });
  const initiator = input.initiator ?? { id: 'initiator' };
  const admin: Actor = { id: 'admin', admin: true };
  let instanceId: number | undefined;
  let error: SimulationResult['error'];

  const fail = (step: number, cause: unknown) => {
    error = {
      step,
      code: cause instanceof FlowError ? cause.code : 'error',
      message: cause instanceof Error ? cause.message : String(cause),
    };
  };

  try {
    await engine.publish(definition);
    const started = await engine.run(
      { type: 'start', process: definition.key, variables: input.variables ?? {} },
      initiator,
    );
    instanceId = started.instance.id;
  } catch (cause) {
    fail(0, cause);
  }

  for (const [index, step] of (input.steps ?? []).entries()) {
    if (error || instanceId === undefined) break;
    try {
      if ('wait' in step) {
        clock.advance({
          days:
            'days' in step.wait ? step.wait.days : 'workdays' in step.wait ? step.wait.workdays : 0,
          hours: 'hours' in step.wait ? step.wait.hours : 0,
          minutes: 'minutes' in step.wait ? step.wait.minutes : 0,
        });
        // 作业可能排出新的、同样到点的作业（提醒接超时）：做到没有为止
        while ((await engine.jobs.runDue()) > 0);
      } else if ('signal' in step) {
        await engine.signal(
          {
            event: step.signal,
            instance: instanceId,
            ...(step.outcome !== undefined ? { outcome: step.outcome } : {}),
            ...(step.data !== undefined ? { data: step.data } : {}),
          },
          admin,
        );
      } else {
        const item = await engine.db
          .queryable(FlowWorkItem)
          .where((w) => [w.instanceId.eq(instanceId!), w.node.eq(step.node), w.state.eq('open')])
          .orderBy((w) => w.id)
          .first();
        if (!item) throw new FlowError('not-found', `节点 ${step.node} 上没有开着的待办`);
        // 以能处理它的人的身份：落到的人，或收件箱里候选的角色、部门的成员
        const pool = await engine.db
          .queryable(FlowCandidate)
          .where((c) => c.workItemId.eq(item.id))
          .toList();
        const of = (kind: string) => pool.filter((c) => c.kind === kind).map((c) => c.value);
        const actor: Actor = {
          id: item.assignee ?? of('user')[0] ?? 'simulator',
          roles: of('role'),
          departments: of('department'),
          groups: of('group'),
        };
        await engine.run(
          {
            type: 'complete',
            workItem: item.id,
            outcome: step.outcome,
            ...(step.variables ? { variables: step.variables } : {}),
            ...(step.comment !== undefined ? { comment: step.comment } : {}),
            ...(step.returnTo !== undefined ? { returnTo: step.returnTo } : {}),
          },
          actor,
        );
      }
    } catch (cause) {
      fail(index + 1, cause);
    }
  }

  if (instanceId === undefined) {
    return {
      status: 'not-started',
      result: null,
      current: [],
      variables: {},
      path: [],
      open: [],
      ...(error ? { error } : {}),
    };
  }
  const detail = await engine.query.instance(instanceId);
  const items = await engine.db
    .queryable(FlowWorkItem)
    .where((w) => [w.instanceId.eq(instanceId!), w.state.eq('open')])
    .orderBy((w) => w.id)
    .toList();
  const candidates = items.length
    ? await engine.db
        .queryable(FlowCandidate)
        .where((c) => c.workItemId.in(items.map((i) => i.id)))
        .toList()
    : [];
  return {
    status: detail.instance.status,
    result: detail.instance.result,
    current: detail.current,
    variables: detail.instance.variables,
    path: detail.events,
    open: items.map((item) => ({
      node: item.node,
      nodeName: item.nodeName,
      assignee: item.assignee,
      candidates: candidates
        .filter((c) => c.workItemId === item.id)
        .map((c) => (c.kind === 'user' ? c.value : `${c.kind}:${c.value}`)),
      dueAt: item.dueAt,
    })),
    ...(error ? { error } : {}),
  };
}

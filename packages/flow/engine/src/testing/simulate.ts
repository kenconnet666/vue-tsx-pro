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
import type { FlowProject, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { parseCandidate } from '../runtime/assignees.ts';
import { FlowWorkItem } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { createTestEngine } from './testing.ts';
import type { Actor, FlowEngineOptions, FlowEventView, InstanceSummary } from '../types.ts';
import type { SimulationStep } from '../extensions.ts';

export type { SimulationStep };

/** 试运行的输入 */
export interface SimulationInput {
  /** 发起时的流程变量 */
  readonly variables?: Readonly<Record<string, unknown>>;
  /** 发起人；不写时是 'initiator' */
  readonly initiator?: Actor;
  readonly steps?: readonly SimulationStep[];
  /** 扩展、组织：试运行时多半给假的实现 */
  readonly options?: Omit<FlowEngineOptions, 'adapter' | 'clock'>;
  /** 先发布的别的流程（试运行的流程调用它们时要有） */
  readonly processes?: readonly (ProcessDefinition | FlowProject)[];
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

/** 试运行共用一个测试库，一次只跑一个 */
let queue: Promise<unknown> = Promise.resolve();

/** 按步骤试运行一个流程定义或流程工程（不用先发布到真实的库）；同时调用时排队 */
export function simulate(
  definition: ProcessDefinition | FlowProject,
  input: SimulationInput = {},
): Promise<SimulationResult> {
  const run = queue.then(() => simulateNow(definition, input));
  queue = run.catch(() => undefined);
  return run;
}

async function simulateNow(
  definition: ProcessDefinition | FlowProject,
  input: SimulationInput,
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
    for (const other of input.processes ?? []) await engine.publish(other);
    const { key } = await engine.publish(definition);
    const started = await engine.run(
      { type: 'start', process: key, variables: input.variables ?? {} },
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
        const pool = item.candidates.map(parseCandidate);
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
      candidates: item.candidates.map((token) =>
        token.startsWith('user:') ? token.slice(5) : token,
      ),
      dueAt: item.dueAt,
    })),
    ...(error ? { error } : {}),
  };
}

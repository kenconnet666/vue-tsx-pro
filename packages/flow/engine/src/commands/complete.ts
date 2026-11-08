/**
 * 处理待办：选结果、收单据的值、守卫；一份待办处理完后会签判断、加签交回、按结果往下走（退回、终止、提级）。
 */
import {
  fieldStates,
  gatewayPairs,
  formManifest,
  type Outcome,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import { decideCountersign } from '../runtime/countersign.ts';
import { FlowWorkItem, type FlowDb } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { Execution, type WorkItemRow } from '../runtime/execution.ts';
import type { Actor, FlowCommand, RunResult } from '../types.ts';
import type { EngineCore } from '../core/context.ts';
import { submit, throwFormErrors } from './submission.ts';
import { checkPicks, picksOf, stepsAfter } from '../runtime/next-steps.ts';

/** 这份待办能选的结果：加签的人不能退回（退回由原来的处理人决定） */
export function outcomesFor(node: TaskNode, item: WorkItemRow): readonly Outcome[] {
  return item.parentItemId === null
    ? node.outcomes
    : node.outcomes.filter((o) => (o.kind ?? 'approve') !== 'return');
}

/**
 * 退回时能选的节点：沿前进的连线往上游找、走到过的人工节点；已经汇合了的并行区域里的节点不算（那些分支已经结束）
 */
export function returnTargets(
  { definition, graph, state }: Pick<Execution, 'definition' | 'graph' | 'state'>,
  from: string,
): string[] {
  const pairs = gatewayPairs(definition);
  const ancestors = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of graph.incoming(id)) {
      if (edge.kind === 'return' || edge.kind === 'escalate' || ancestors.has(edge.from)) continue;
      ancestors.add(edge.from);
      queue.push(edge.from);
    }
  }
  const closed = (id: string) =>
    definition.nodes.some((n) => {
      const join = pairs.joinOf(n.id);
      return join !== undefined && ancestors.has(join) && pairs.region(n.id).has(id);
    });
  // 按定义里的先后（流程的顺序）：最近的上游在最后
  return definition.nodes
    .map((node) => node.id)
    .filter(
      (id) =>
        ancestors.has(id) && graph.node(id)?.type === 'task' && state.rounds[id] && !closed(id),
    );
}

/** 处理待办：装进引擎核心（core.tasks），别的模块经它调用 */
export function createTasks(core: EngineCore) {
  const { options, withInstance, instanceOfItem, openItem, isCandidate } = core;

  async function complete(
    command: Extract<FlowCommand, { type: 'complete' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(
      await instanceOfItem(command.workItem),
      actor,
      async (exec, tx) => {
        const item = await openItem(exec, tx, command.workItem);
        if (!isCandidate(item, actor)) {
          throw new FlowError('forbidden', `${actor.id} 不能处理待办 ${item.id}`);
        }
        const node = exec.node(item.node) as TaskNode;
        const outcome = outcomesFor(node, item).find((o) => o.key === command.outcome);
        if (!outcome) {
          throw new FlowError('invalid-input', `节点 ${node.name} 没有结果 ${command.outcome}`, {
            field: 'outcome',
          });
        }
        if (outcome.comment === 'required' && !command.comment?.trim()) {
          throw new FlowError('invalid-input', `“${outcome.label}”要写意见`, { field: 'comment' });
        }
        // 这一步改了哪些值、原来是什么：撤回这一步时恢复
        const before = Object.fromEntries(
          Object.keys(command.variables ?? {}).map((key) => [key, exec.variables[key] ?? null]),
        );
        applySubmission(exec, node, command.variables);
        for (const name of outcome.guards ?? []) {
          const guard = exec.extension('guards', name);
          if (!guard) throw new FlowError('invalid-definition', `没有注册守卫 ${name}`);
          const verdict = await guard({
            ...exec.context(),
            node: node.id,
            outcome: outcome.key,
            actor,
          });
          if (verdict !== true) throw new FlowError('guard-rejected', verdict, { guard: name });
        }
        exec.state.picks = {
          ...exec.state.picks,
          ...checkPicks(
            picksOf(await stepsAfter(options, exec, node, outcome, actor.id)),
            command.picks,
          ),
        };
        await finishItem(exec, tx, item, node, outcome.key, {
          actor: actor.id,
          comment: command.comment ?? null,
          returnTo: command.returnTo,
          before,
        });
      },
      command,
    );
  }

  /**
   * 一份待办处理完：带状态条件写成 done、记事件，会签判断这一组结束了没有，结束了按结果往下走。
   * 人处理（complete）与超时自动处理（overdue 作业，actor 为 null）共用
   */
  async function finishItem(
    exec: Execution,
    tx: FlowDb,
    item: WorkItemRow,
    node: TaskNode,
    outcomeKey: string,
    by: {
      actor: string | null;
      comment: string | null;
      returnTo?: string | undefined;
      /** 这一步改过的单据值原来是什么（记进事件，撤回这一步时恢复） */
      before?: Readonly<Record<string, unknown>>;
    },
  ): Promise<void> {
    // 后加签：结果先挂着，打开排队的加签待办，等他们办完（signerDone）再生效
    const after = (w: any) => [
      w.parentItemId.eq(item.id),
      w.state.eq('waiting'),
      w.arrival.eq('addSign.after'),
    ];
    if (
      (await tx
        .queryable(FlowWorkItem)
        .where(after as never)
        .count()) > 0
    ) {
      await tx
        .update(FlowWorkItem)
        .set({ state: 'waiting', pendingOutcome: outcomeKey, comment: by.comment })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
        .execute();
      await tx
        .update(FlowWorkItem)
        .set({ state: 'open' })
        .where(after as never)
        .execute();
      return;
    }
    await tx
      .update(FlowWorkItem)
      .set({
        draft: null,
        state: 'done',
        outcome: outcomeKey,
        comment: by.comment,
        completedAt: exec.now,
        completedBy: by.actor,
        assignee: by.actor ?? item.assignee,
      })
      .where((w) => [w.id.eq(item.id), w.state.eq('open')])
      .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
      .execute();
    exec.addEvent('workItem.completed', {
      workItemId: item.id,
      node: node.id,
      outcome: outcomeKey,
      comment: by.comment,
      actor: by.actor,
      data: {
        outcomeLabel: node.outcomes.find((o) => o.key === outcomeKey)?.label ?? outcomeKey,
        ...(by.before && Object.keys(by.before).length > 0 ? { before: by.before } : {}),
      },
    });
    if (item.parentItemId !== null) return signerDone(exec, tx, item, node);
    if (by.actor) {
      exec.state.handledBy[node.id] = by.actor;
      exec.lastHandler = by.actor;
    }

    let decided = outcomeKey;
    if (node.multi && item.signGroup) {
      const group = item.signGroup;
      // 会签组的键只在实例里唯一
      const votes = await tx
        .queryable(FlowWorkItem)
        .where((w) => [w.instanceId.eq(item.instanceId), w.signGroup.eq(group)])
        .toList();
      const queue = exec.state.queues[group] ?? [];
      const rule =
        exec.logic?.countersign?.[node.multi.complete] ??
        options.extensions?.countersign?.[node.multi.complete];
      const result = decideCountersign(
        node.multi,
        node.outcomes,
        votes,
        queue.length,
        rule && { rule, node: node.id, chosen: outcomeKey },
      );
      if (result === undefined) {
        const [next, ...rest] = queue;
        if (node.multi.complete === 'sequential' && next !== undefined) {
          exec.state.queues[group] = rest;
          if (rest.length === 0) delete exec.state.queues[group];
          await exec.insertItem(node, item.round, 'forward', {
            assignee: next,
            assignment: 'direct',
            state: 'open',
            signGroup: group,
            signSeq: (item.signSeq ?? 0) + 1,
          });
        }
        return;
      }
      delete exec.state.queues[group];
      await exec.cancelWhere((w) => [w.signGroup.eq(group)]);
      exec.addEvent('countersign.decided', { node: node.id, outcome: result });
      decided = result;
    }
    exec.current.delete(node.id);
    await advanceFromTask(exec, node, decided, by.returnTo);
  }

  /**
   * 加签（委托）的人办完一份：同一份待办下的都办完了，前加签与委托回到原来的处理人，后加签让挂着的结果生效——
   * 加签的人里有选了非通过结果的，按第一个这样的结果走
   */
  function signerDone(exec: Execution, tx: FlowDb, signer: WorkItemRow, node: TaskNode) {
    return settleParent(exec, tx, signer.parentItemId!, node);
  }

  /** 原来那份待办下的加签都办完（或减掉）了：恢复它 */
  async function settleParent(exec: Execution, tx: FlowDb, parentId: number, node: TaskNode) {
    const siblings = await tx
      .queryable(FlowWorkItem)
      .where((w) => w.parentItemId.eq(parentId))
      .orderBy((w) => w.id)
      .toList();
    if (siblings.some((w) => w.state === 'open' || w.state === 'waiting')) return;
    const parent = await tx.queryable(FlowWorkItem).findOrThrow(parentId);
    if (parent.state !== 'waiting') return;
    await tx
      .update(FlowWorkItem)
      .set({ state: 'open', pendingOutcome: null })
      .where((w) => w.id.eq(parent.id))
      .execute();
    const reopened = { ...parent, state: 'open' as const, pendingOutcome: null };
    if (parent.pendingOutcome === null) {
      exec.addEvent('workItem.resumed', { workItemId: parent.id, node: node.id });
      return;
    }
    const kindOf = (key: string | null) =>
      node.outcomes.find((o) => o.key === key)?.kind ?? 'approve';
    const objection = siblings.find((w) => w.state === 'done' && kindOf(w.outcome) !== 'approve');
    await finishItem(exec, tx, reopened, node, objection?.outcome ?? parent.pendingOutcome, {
      actor: parent.assignee,
      comment: parent.comment,
    });
  }

  /**
   * 处理时提交的变量：流程声明了变量时按环节的表单权限合并（只收能改的，必填的要有值，其余用存着的；0004 的 4.5），
   * 没声明的变量照旧直接写进去
   */
  function applySubmission(
    exec: Execution,
    node: TaskNode,
    submitted: Readonly<Record<string, unknown>> = {},
  ): void {
    const manifest = formManifest(exec.definition);
    const declared = Object.keys(manifest);
    const others = Object.fromEntries(
      Object.entries(submitted).filter(([name]) => !declared.includes(name)),
    );
    if (declared.length > 0) {
      const states = fieldStates(manifest, { access: node.form, read: exec.read });
      const { values, errors } = submit(
        manifest,
        states,
        exec.variables,
        submitted,
        options.extensions?.fieldTypes,
      );
      throwFormErrors(manifest, errors);
      exec.setVariables(values);
    }
    if (Object.keys(others).length > 0) exec.setVariables(others);
  }

  async function advanceFromTask(
    exec: Execution,
    node: TaskNode,
    key: string,
    returnTo?: string,
  ): Promise<void> {
    const outcome = node.outcomes.find((o) => o.key === key)!;
    const kind = outcome.kind ?? 'approve';
    if (kind === 'terminate') return exec.finish('terminated', outcome.result ?? key);
    if (kind === 'return' && outcome.target === 'choose') {
      if (!returnTo) {
        throw new FlowError('invalid-input', '退回要选退回到哪个节点', {
          field: 'returnTo',
          code: 'required',
        });
      }
      if (!returnTargets(exec, node.id).includes(returnTo)) {
        throw new FlowError('invalid-input', `${returnTo} 不是上游走到过的人工节点`, {
          field: 'returnTo',
          code: 'not-upstream',
        });
      }
      const target = exec.graph.node(returnTo);
      if (
        !target ||
        target.type !== 'task' ||
        !exec.state.rounds[target.id] ||
        target.id === node.id
      ) {
        throw new FlowError(
          'invalid-input',
          `退回的目标 ${returnTo ?? '（没写）'} 不是走过的人工节点`,
          {
            field: 'returnTo',
          },
        );
      }
      exec.state.returnedFrom[target.id] = node.id;
      exec.addEvent('node.left', { node: node.id, outcome: key, data: { returnTo: target.id } });
      await exec.leaveRegions(node.id, target.id);
      return exec.enter(target.id, 'return');
    }
    // 被退回后重新提交：退回它的节点写了 returnTo: 'resubmit' 时直接回到那里，不再从头走
    const returnedFrom = exec.state.returnedFrom[node.id];
    delete exec.state.returnedFrom[node.id];
    const returner = returnedFrom ? exec.graph.node(returnedFrom) : undefined;
    if (kind === 'approve' && returner?.type === 'task' && returner.returnTo === 'resubmit') {
      exec.addEvent('node.left', {
        node: node.id,
        outcome: key,
        data: { resubmitTo: returner.id },
      });
      return exec.enter(returner.id, 'resubmit');
    }
    return exec.leave(node.id, key);
  }

  return { complete, finishItem, signerDone, settleParent, applySubmission, advanceFromTask };
}

/** createTasks 给出的函数 */
export type Tasks = ReturnType<typeof createTasks>;

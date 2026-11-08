/**
 * 调用流程（call 节点）：发起子实例、子实例结束后回到父实例、forEach 与异步的等待与汇总；每个命令写回之后由 afterFlush 接着处理。
 */
import { isRef, type CallNode } from '@zerodep-dev/flow-ts-model';
import { FlowInstance, type FlowDb } from '../core/entities.ts';
import { Execution } from './execution.ts';
import type { EngineCore } from '../core/context.ts';
import { variableName } from '../commands/start.ts';

/** forEach 的列表：不是数组时当没有 */
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** 调用流程（call 节点）：装进引擎核心（core.calls），别的模块经它调用 */
export function createCalls(core: EngineCore) {
  const { definitionOf, execution, latestDefinition } = core;

  /**
   * 调用流程（同步、单个）：在同一个事务里发起子实例；子实例当场就结束时直接按它的结果往下走，否则父实例在这个节点等，
   * 子实例结束时 afterFlush 回到父实例。input 的键是子流程的变量，值是父流程这边的值（引用或直接写）
   */
  async function startChild(parent: Execution, node: CallNode): Promise<void> {
    const definition = await latestDefinition(parent.tx, node.process);
    const round = parent.bumpRound(node.id);
    const sync = node.mode === 'sync';
    // forEach：列表里每一项一个子实例，input 里 `as.字段` 引用那一项
    const items: unknown[] = node.forEach ? listOf(parent.read(node.forEach.ref)) : [undefined];
    const valueOf = (value: unknown, item: unknown) => {
      if (!isRef(value)) return value;
      const as = node.as;
      if (as && (value.ref === as || value.ref.startsWith(`${as}.`))) {
        return value.ref
          .slice(as.length)
          .split('.')
          .filter(Boolean)
          .reduce<unknown>((at, key) => (at as Record<string, unknown> | null)?.[key], item);
      }
      return parent.read(value.ref);
    };
    if (sync) {
      parent.state.calls[node.id] = items.length;
      parent.current.add(node.id);
    }
    const finished: Execution[] = [];
    for (const item of items) {
      const input = Object.fromEntries(
        Object.entries(node.input ?? {}).map(([name, value]) => [
          variableName(name),
          valueOf(value, item),
        ]),
      );
      const child = await core.starts.launch(
        parent.tx,
        definition,
        input,
        { id: parent.instance.startedBy },
        {
          businessKey: parent.instance.businessKey,
          title: null,
          parentId: parent.instance.id,
          parentNode: node.id,
          parentRound: round,
        },
      );
      const { instance } = await child.flush();
      // 子实例开出的待办也算这个命令的结果（同 Java 版）
      parent.created.push(...child.created);
      parent.addEvent('call.started', {
        node: node.id,
        data: { child: instance.id, process: node.process, title: instance.title },
      });
      if (child.finished) finished.push(child);
    }
    // 异步：发起就往下走；同步：这一轮全在同一个命令里结束了（或列表是空的）就直接回来
    if (!sync) return parent.leave(node.id, null);
    for (const child of finished) await childReturned(parent, node, child);
    if (items.length === 0) await callsSettled(parent, node, []);
  }

  /** 同步调用的一个子实例结束了：少等一个；这一轮都结束了收 output、往下走 */
  async function childReturned(parent: Execution, node: CallNode, child: Execution) {
    const left = (parent.state.calls[node.id] ?? 1) - 1;
    parent.state.calls[node.id] = left;
    if (left > 0) return;
    await callsSettled(parent, node, [child]);
  }

  /**
   * 这一轮的子实例都结束了：output 收进父实例（forEach 时按发起的先后收成列表），几个子实例的结果都一样才按它，
   * 否则走没写结果的出边。justEnded 是这个命令里刚结束、还没从库里读到的
   */
  async function callsSettled(parent: Execution, node: CallNode, justEnded: readonly Execution[]) {
    const round = parent.state.rounds[node.id] ?? 1;
    const rows = await parent.tx
      .queryable(FlowInstance)
      .where((i) => [
        i.parentId.eq(parent.instance.id),
        i.parentNode.eq(node.id),
        i.parentRound.eq(round),
      ])
      .orderBy((i) => i.id)
      .toList();
    const children = rows.map((row) => {
      const live = justEnded.find((c) => c.instance.id === row.id);
      return {
        id: row.id,
        status: live?.status ?? row.status,
        result: live ? live.result : row.result,
        read: (name: string) => (live ? live.read(name) : row.variables[variableName(name)]),
      };
    });
    for (const [variable, name] of Object.entries(node.output ?? {})) {
      const values = children.map((c) => c.read(name) ?? null);
      parent.setVariables({
        [variableName(variable)]: node.forEach ? values : (values[0] ?? null),
      });
    }
    delete parent.state.calls[node.id];
    parent.current.delete(node.id);
    const first = children[0];
    const same =
      first && children.every((c) => c.status === 'completed' && c.result === first.result);
    const outcome = same ? first.result : null;
    parent.addEvent('call.finished', {
      node: node.id,
      outcome,
      data: { children: children.map((c) => c.id) },
    });
    await parent.leave(node.id, outcome);
  }

  /** 父实例恢复时：暂停期间这一轮的子实例都结束了的同步调用节点，补上往下走 */
  async function resumeWaitingCalls(parent: Execution) {
    for (const nodeId of Object.keys(parent.state.calls)) {
      const node = parent.graph.node(nodeId);
      if (node?.type !== 'call') continue;
      const round = parent.state.rounds[nodeId] ?? 1;
      const open = await parent.tx
        .queryable(FlowInstance)
        .where((i) => [
          i.parentId.eq(parent.instance.id),
          i.parentNode.eq(nodeId),
          i.parentRound.eq(round),
          i.status.in(['active', 'suspended']),
        ])
        .count();
      if (open === 0) await callsSettled(parent, node, []);
    }
  }

  /**
   * 命令写回之后：子实例结束了就锁住父实例、回到它（父实例在等这个调用节点时）；
   * 实例被终止、撤回时，还在进行的子实例一起终止
   */
  async function afterFlush(tx: FlowDb, exec: Execution): Promise<void> {
    if (exec.finished && exec.instance.parentId !== null && exec.instance.parentNode !== null) {
      const parentId = exec.instance.parentId;
      if (await tx.lock(FlowInstance, parentId)) {
        const row = await tx.queryable(FlowInstance).findOrThrow(parentId);
        const parent = await execution(tx, await definitionOf(tx, row.definitionId), row, null);
        const node = parent.graph.node(exec.instance.parentNode);
        // 暂停的父实例不推进（恢复时 resumeWaitingCalls 补上）；旧一轮的子实例不算
        if (
          parent.status === 'active' &&
          node?.type === 'call' &&
          node.mode === 'sync' &&
          parent.current.has(node.id) &&
          exec.instance.parentRound === (parent.state.rounds[node.id] ?? 1)
        ) {
          await childReturned(parent, node, exec);
          await parent.flush();
          // 父实例往下走开出的待办也算这个命令的结果
          exec.created.push(...parent.created);
          await afterFlush(tx, parent);
        }
      }
    }
    if (exec.status === 'terminated' || exec.status === 'withdrawn') {
      const children = await tx
        .queryable(FlowInstance)
        .where((i) => [i.parentId.eq(exec.instance.id), i.status.in(['active', 'suspended'])])
        .toList();
      for (const row of children) {
        await tx.lock(FlowInstance, row.id);
        const child = await execution(tx, await definitionOf(tx, row.definitionId), row, null);
        await child.finish('terminated', 'parent-terminated', exec.endComment);
        await child.flush();
        await afterFlush(tx, child);
      }
    }
  }

  return { startChild, childReturned, callsSettled, resumeWaitingCalls, afterFlush };
}

/** createCalls 给出的函数 */
export type Calls = ReturnType<typeof createCalls>;

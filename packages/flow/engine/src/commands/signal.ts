/**
 * 外部消息：等消息的节点（receive）按名字与关联键收到后往下走。
 */
import { FlowInstance } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { type CustomNodeDef } from '../runtime/execution.ts';
import type { Actor, RunResult, SignalInput } from '../types.ts';
import type { EngineCore } from '../core/context.ts';

/** 外部消息：装进引擎核心（core.signals），别的模块经它调用 */
export function createSignals(core: EngineCore) {
  const { db, withInstance } = core;

  /** 外部事件：在等它的实例往下走，返回这些实例的结果；不在等的只记一条 signal.ignored */
  async function signal(command: SignalInput, actor: Actor): Promise<RunResult[]> {
    const ids =
      command.instance !== undefined
        ? [command.instance]
        : (
            await db
              .queryable(FlowInstance)
              .where((i) => [i.businessKey.eq(command.businessKey ?? ''), i.status.eq('active')])
              .select((i) => ({ id: i.id }))
              .toList()
          ).map((row) => row.id);
    const results: RunResult[] = [];
    for (const id of ids) {
      let received = false;
      const result = await withInstance(id, actor, async (exec) => {
        const waiting = [...exec.current].find((nodeId) => {
          const node = exec.graph.node(nodeId);
          return (
            (node?.type === 'receive' && node.event === command.event) ||
            exec.state.events[nodeId] === command.event
          );
        });
        const node = waiting ? exec.node(waiting) : undefined;
        // 自定义节点在等这个事件：交给它的 received（不写时按事件带的结果往下走）
        if (node && exec.status === 'active' && exec.state.events[node.id] === command.event) {
          const custom = node as unknown as CustomNodeDef;
          delete exec.state.events[node.id];
          exec.current.delete(node.id);
          exec.addEvent('signal.received', {
            node: node.id,
            outcome: command.outcome ?? null,
            data: { event: command.event, data: command.data ?? null },
          });
          received = true;
          const handler = exec.customNode(custom.type);
          const event = { outcome: command.outcome ?? null, data: command.data ?? {} };
          await exec.applyCustom(
            custom,
            handler?.received
              ? await handler.received(exec.customContext(custom), event)
              : { outcome: event.outcome },
          );
          return;
        }
        if (!node || node.type !== 'receive' || exec.status !== 'active') {
          exec.addEvent('signal.ignored', {
            outcome: command.outcome ?? null,
            data: { event: command.event },
          });
          return;
        }
        if (command.outcome !== undefined && !(node.outcomes ?? []).includes(command.outcome)) {
          throw new FlowError(
            'invalid-input',
            `事件 ${command.event} 没有结果 ${command.outcome}`,
            { field: 'outcome' },
          );
        }
        for (const [variable, name] of Object.entries(node.output ?? {})) {
          const target = variable.startsWith('form.') ? variable.slice(5) : variable;
          exec.setVariables({ [target]: command.data?.[name] });
        }
        exec.current.delete(node.id);
        exec.addEvent('signal.received', {
          node: node.id,
          outcome: command.outcome ?? null,
          data: { event: command.event, data: command.data ?? null },
        });
        received = true;
        await exec.leave(node.id, command.outcome ?? null);
      });
      // 按实例送的事件：没在等也给出这个实例的结果（只记了一笔）；按业务编号送的只给往下走了的
      if (received || command.instance !== undefined) results.push(result);
    }
    return results;
  }

  return { signal };
}

/** createSignals 给出的函数 */
export type Signals = ReturnType<typeof createSignals>;

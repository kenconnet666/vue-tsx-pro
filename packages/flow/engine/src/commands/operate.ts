/**
 * 待办上的动作（operations.ts 的插件）：认领、转办、委托、加签……经 operate 命令执行，暂存与结束交回给处理。
 */
import { fieldStates, formManifest, type TaskNode } from '@zerodep-dev/flow-ts-model';
import { FlowWorkItem } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { Execution, type WorkItemRow } from '../runtime/execution.ts';
import { type OperationScope } from './operations.ts';
import type { Actor, FlowCommand, RunResult } from '../types.ts';
import type { EngineCore } from '../core/context.ts';
import { submit, throwFormErrors } from './submission.ts';

/** 待办上的动作（operations.ts 的插件）：装进引擎核心（core.ops），别的模块经它调用 */
export function createOps(core: EngineCore) {
  const { options, operations, withInstance, instanceOfItem, isCandidate, itemsOf } = core;

  /** 动作：重读待办、按 available 判断，再交给动作的 run（实例已锁住） */
  async function operate(
    command: Extract<FlowCommand, { type: 'operate' }>,
    actor: Actor,
    original: FlowCommand = command,
  ): Promise<RunResult> {
    const operation = operations.find((o) => o.name === command.operation);
    if (!operation) {
      throw new FlowError('invalid-input', `没有动作 ${command.operation}`, { field: 'operation' });
    }
    return withInstance(
      await instanceOfItem(command.workItem),
      actor,
      async (exec, tx) => {
        const item = await tx.queryable(FlowWorkItem).findOrThrow(command.workItem);
        const scope = scopeOf(exec, item, actor, await itemsOf(tx, item.instanceId));
        if (!operation.available(scope)) {
          const code =
            operation.refusal?.(scope) ??
            (exec.status !== 'active'
              ? 'instance-not-active'
              : item.state !== 'open'
                ? 'already-handled'
                : 'forbidden');
          throw new FlowError(code, `${actor.id} 现在不能对待办 ${item.id} ${operation.label}`);
        }
        await operation.run(
          {
            ...scope,
            exec,
            tx,
            cancel: async (comment) => {
              await tx
                .update(FlowWorkItem)
                .set({ state: 'canceled', completedAt: exec.now, completedBy: actor.id, comment })
                .where((w) => [w.id.eq(item.id), w.state.eq('open')])
                .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
                .execute();
            },
            finish: (outcome, comment) =>
              core.tasks.finishItem(exec, tx, item, scope.node, outcome, {
                actor: actor.id,
                comment,
              }),
            settle: () => core.tasks.settleParent(exec, tx, item.id, scope.node),
            draftValues: (submitted) => {
              const manifest = formManifest(exec.definition);
              const states = fieldStates(manifest, { access: scope.node.form, read: exec.read });
              const editable = Object.fromEntries(
                Object.entries(submitted).filter(([name]) => states.get(name)?.editable),
              );
              const { errors } = submit(
                manifest,
                states,
                exec.variables,
                editable,
                options.extensions?.fieldTypes,
              );
              throwFormErrors(
                manifest,
                errors.filter((e) => e.code !== 'required'),
              );
              return editable;
            },
          },
          command.input ?? {},
        );
      },
      original,
    );
  }

  /** 判断动作能不能做时看的：实例的样子取推进现场的（锁住后的） */
  function scopeOf(
    exec: Execution,
    item: WorkItemRow,
    actor: Actor,
    items: readonly WorkItemRow[],
  ): OperationScope {
    return {
      item,
      node: exec.node(item.node) as TaskNode,
      instance: { ...exec.instance, status: exec.status },
      actor,
      candidate: isCandidate(item, actor),
      items,
    };
  }

  return { operate, scopeOf };
}

/** createOps 给出的函数 */
export type Ops = ReturnType<typeof createOps>;

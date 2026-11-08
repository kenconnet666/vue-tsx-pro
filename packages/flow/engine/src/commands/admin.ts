/**
 * 实例上的操作：撤回、终止、跳转、暂停与恢复、催办、改单据数据、迁移到另一个版本。
 */
import { or } from '@zerodep-dev/easy-query-ts';
import { processGraph, type ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { FlowDefinition, FlowInstance, FlowJob, FlowWorkItem } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { renameNodes } from '../runtime/state.ts';
import type { Actor, FlowCommand, RunResult } from '../types.ts';
import type { EngineCore } from '../core/context.ts';

/** 手动催办的间隔：同一份待办一小时内只催一次 */
const REMIND_INTERVAL_MS = 3_600_000;

/**
 * 发起人此刻能不能撤回：按流程的 withdraw 设置（默认没人处理过之前），别人处理过、或设成 beforeClaim 时有人认领了就不行。
 * 撤回命令与实例详情的 actions 共用
 */
export function withdrawable(
  definition: ProcessDefinition,
  items: readonly {
    readonly state: string;
    readonly completedBy: string | null;
    readonly assignment: string;
  }[],
  startedBy: string,
): boolean {
  const mode = definition.settings?.withdraw ?? 'beforeAction';
  if (mode === 'never') return false;
  if (items.some((w) => w.state === 'done' && w.completedBy !== startedBy)) return false;
  return !(mode === 'beforeClaim' && items.some((w) => w.assignment === 'claimed'));
}

/** 节点允许催办（环节上写了 allow.remind: false 的不行） */
export function remindable(definition: ProcessDefinition, node: string): boolean {
  const found = definition.nodes.find((n) => n.id === node);
  return found?.type !== 'task' || found.allow?.remind !== false;
}

/** 实例上的操作：装进引擎核心（core.admin），别的模块经它调用 */
export function createAdmin(core: EngineCore) {
  const { withInstance } = core;

  async function withdraw(
    command: Extract<FlowCommand, { type: 'withdraw' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(
      command.instance,
      actor,
      async (exec, tx) => {
        if (exec.status !== 'active')
          throw new FlowError('instance-not-active', `实例 ${command.instance} 不在进行中`);
        if (exec.instance.startedBy !== actor.id)
          throw new FlowError('forbidden', '只有发起人能撤回');
        const items = await tx
          .queryable(FlowWorkItem)
          .where((w) => w.instanceId.eq(command.instance))
          .toList();
        if (!withdrawable(exec.definition, items, actor.id))
          throw new FlowError('forbidden', '已经有人处理了，不能撤回');
        await exec.finish('withdrawn', 'withdrawn', command.comment ?? null);
      },
      command,
    );
  }

  async function terminate(
    command: Extract<FlowCommand, { type: 'terminate' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能终止');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
        if (exec.finished)
          throw new FlowError('instance-not-active', `实例 ${command.instance} 已经结束`);
        await exec.finish('terminated', command.result ?? 'terminated', command.comment ?? null);
      },
      command,
    );
  }

  /** 管理员跳转：取消所有开着的待办、清掉等待状态，从指定节点重新走 */
  async function jump(
    command: Extract<FlowCommand, { type: 'jump' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能跳转');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
        if (exec.status !== 'active') {
          throw new FlowError('instance-not-active', `实例 ${command.instance} 不在进行中`);
        }
        const target = exec.graph.node(command.node);
        if (!target || target.type === 'start') {
          throw new FlowError('invalid-input', `不能跳到 ${command.node}`, { field: 'node' });
        }
        await exec.cancelWhere(() => []);
        exec.current.clear();
        exec.state.waiting = {};
        exec.state.queues = {};
        exec.addEvent('instance.jumped', {
          comment: command.comment ?? null,
          data: { to: command.node },
        });
        await exec.enter(command.node, 'jump');
      },
      command,
    );
  }

  async function suspendOrResume(
    command: Extract<FlowCommand, { type: 'suspend' | 'resume' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能暂停、恢复');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
        const from = command.type === 'suspend' ? 'active' : 'suspended';
        if (exec.status !== from) {
          throw new FlowError(
            'instance-not-active',
            `实例 ${command.instance} 不是${from === 'active' ? '进行中' : '暂停'}的`,
          );
        }
        exec.status = command.type === 'suspend' ? 'suspended' : 'active';
        exec.addEvent(command.type === 'suspend' ? 'instance.suspended' : 'instance.resumed', {
          comment: command.type === 'suspend' ? (command.comment ?? null) : null,
        });
        if (command.type === 'resume') await core.calls.resumeWaitingCalls(exec);
      },
      command,
    );
  }

  async function remind(
    command: Extract<FlowCommand, { type: 'remind' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(
      command.instance,
      actor,
      async (exec, tx) => {
        if (exec.status !== 'active')
          throw new FlowError('instance-not-active', `实例 ${command.instance} 不在进行中`);
        if (exec.instance.startedBy !== actor.id && !actor.admin) {
          throw new FlowError('forbidden', '只有发起人或管理员能催办');
        }
        const items = await tx
          .queryable(FlowWorkItem)
          .where((w) => [
            w.instanceId.eq(command.instance),
            w.state.eq('open'),
            ...(command.workItem !== undefined ? [w.id.eq(command.workItem)] : []),
          ])
          .toList();
        // 环节关掉了催办（allow.remind: false）：点名催它时报错，催全部时跳过它
        if (
          command.workItem !== undefined &&
          items[0] &&
          !remindable(exec.definition, items[0].node)
        )
          throw new FlowError('forbidden', `节点 ${items[0].nodeName} 不允许催办`);
        // 同一份待办一小时内只催一次（同 Java 版）：带条件地记下催办的时刻，没记上的不催
        const notBefore = new Date(exec.now.getTime() - REMIND_INTERVAL_MS);
        for (const item of items.filter((i) => remindable(exec.definition, i.node))) {
          const marked = await tx
            .update(FlowWorkItem)
            .set({ remindedAt: exec.now })
            .where((w) => [w.id.eq(item.id), or(w.remindedAt.isNull(), w.remindedAt.lt(notBefore))])
            .execute();
          if (marked === 0) continue;
          exec.addEvent('workItem.reminded', {
            workItemId: item.id,
            node: item.node,
            comment: command.message ?? null,
            data: { reason: 'manual' },
          });
        }
      },
      command,
    );
  }

  /** 管理员改单据数据：只记真的变了的字段，改前、改后各一份 */
  async function changeData(
    command: Extract<FlowCommand, { type: 'changeData' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能改单据数据');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
        const changes: Record<string, { before: unknown; after: unknown }> = {};
        for (const [name, after] of Object.entries(command.variables)) {
          const before = exec.variables[name] ?? null;
          if (JSON.stringify(before) !== JSON.stringify(after)) changes[name] = { before, after };
        }
        if (Object.keys(changes).length === 0) return;
        exec.setVariables(command.variables);
        exec.addEvent('instance.dataChanged', {
          comment: command.comment ?? null,
          data: { form: changes },
        });
      },
      command,
    );
  }

  /** 管理员迁移版本（同 Java 版）：先核对正在用的节点在新版本里都有、类型相同，再换版本、改待办与作业 */
  async function migrate(
    command: Extract<FlowCommand, { type: 'migrate' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能迁移版本');
    if (!command.comment?.trim()) {
      throw new FlowError('invalid-input', '迁移要写原因', { field: 'comment', code: 'required' });
    }
    return withInstance(
      command.instance,
      actor,
      async (exec, tx) => {
        if (exec.finished)
          throw new FlowError('instance-not-active', `实例 ${command.instance} 已经结束`);
        const target = await tx
          .queryable(FlowDefinition)
          .where((d) => [d.processKey.eq(exec.instance.processKey), d.version.eq(command.version)])
          .first();
        if (!target) {
          throw new FlowError(
            'not-found',
            `没有 ${exec.instance.processKey} 的第 ${command.version} 版`,
          );
        }
        const to = processGraph(target.model);
        const live = await tx
          .queryable(FlowWorkItem)
          .where((w) => [w.instanceId.eq(exec.instance.id), w.state.in(['open', 'waiting'])])
          .toList();
        const inUse = new Set([...exec.current, ...live.map((w) => w.node)]);
        const mapping: Record<string, string> = {};
        for (const node of inUse) {
          const next = command.nodes?.[node] ?? node;
          const before = exec.graph.node(node);
          const after = to.node(next);
          if (!before || !after || before.type !== after.type) {
            throw new FlowError(
              'invalid-input',
              `节点 ${node} 在第 ${command.version} 版里没有对应的节点`,
              {
                field: `nodes.${node}`,
                code: 'no-matching-node',
              },
            );
          }
          mapping[node] = next;
        }
        const renamed = Object.entries(mapping).filter(([from, next]) => from !== next);
        for (const [from, next] of renamed) {
          await tx
            .update(FlowWorkItem)
            .set({ node: next, nodeName: to.node(next)!.name })
            .where((w) => [w.instanceId.eq(exec.instance.id), w.node.eq(from)])
            .execute();
          await tx
            .update(FlowJob)
            .set({ node: next })
            .where((j) => [j.instanceId.eq(exec.instance.id), j.node.eq(from)])
            .execute();
        }
        for (const item of live.filter((w) => w.signGroup && mapping[w.node] !== w.node)) {
          const round = item.signGroup!.slice(item.signGroup!.lastIndexOf('#'));
          await tx
            .update(FlowWorkItem)
            .set({ signGroup: `${mapping[item.node]}${round}` })
            .where((w) => w.id.eq(item.id))
            .execute();
        }
        Object.assign(exec.state, renameNodes(exec.state, mapping));
        const current = [...exec.current].map((node) => mapping[node] ?? node);
        exec.current.clear();
        for (const node of current) exec.current.add(node);
        await tx
          .update(FlowInstance)
          .set({ definitionId: target.id, version: target.version })
          .where((i) => i.id.eq(exec.instance.id))
          .execute();
        exec.addEvent('instance.migrated', {
          comment: command.comment,
          data: { fromVersion: exec.instance.version, toVersion: target.version, nodes: mapping },
        });
      },
      command,
    );
  }

  return { withdraw, terminate, jump, suspendOrResume, remind, changeData, migrate };
}

/** createAdmin 给出的函数 */
export type Admin = ReturnType<typeof createAdmin>;

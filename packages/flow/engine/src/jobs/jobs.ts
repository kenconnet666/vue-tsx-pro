/**
 * 作业：定时与超时、异步的自动节点；领取（SKIP LOCKED）、重试、失败记成异常、手动重试与跳过。
 */
import { or, type Row } from '@zerodep-dev/easy-query-ts';
import { type ProcessDefinition, type TaskNode } from '@zerodep-dev/flow-ts-model';
import { parseCandidate } from '../runtime/assignees.ts';
import { FlowInstance, FlowJob, FlowWorkItem } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { dueAt, Execution } from '../runtime/execution.ts';
import type { Actor, FlowCommand, RunResult } from '../types.ts';
import type { EngineCore } from '../core/context.ts';
import type { Incident } from '../views.ts';

/** 作业最多试几次（第一次加两次重试） */
const MAX_ATTEMPTS = 3;

/** 领到的作业锁多久：进程死掉后别的进程过了这段时间能接手 */
const LEASE_MS = 5 * 60_000;

/** 跳过失败的自动节点时能选的结果：它的出边上写的结果 */
function skipOutcomes(definition: ProcessDefinition, node: string | null): string[] {
  if (!node) return [];
  const outcomes = definition.edges
    .filter((e) => e.from === node && e.outcome)
    .map((e) => e.outcome!);
  return [...new Set(outcomes)];
}

/** 时刻写成 ISO 文字，整秒时不带毫秒（同线上的写法） */
const isoSeconds = (at: Date): string => at.toISOString().replace('.000Z', 'Z');

/** 作业：装进引擎核心（core.jobs），别的模块经它调用 */
export function createJobs(core: EngineCore) {
  const { options, db, now, definitionOf, withInstance, execution } = core;

  /** 这个引擎的作业租约名：多个进程、多个标签页各不相同 */
  const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;

  async function runDue({ limit = 50, worker = workerId } = {}): Promise<number> {
    const at = now();
    // 一次抢一批：别人锁着的行跳过（SKIP LOCKED），各拿各的；租约写在行上，进程中途退出时租约过期后别人再抢
    const due = await db.transaction(async (tx) => {
      const rows = await tx
        .queryable(FlowJob)
        .where((j) => [
          j.state.eq('pending'),
          j.dueAt.le(at),
          or(j.lockedUntil.isNull(), j.lockedUntil.lt(at)),
        ])
        .orderBy((j) => j.dueAt)
        .limit(limit)
        .forUpdateSkipLocked()
        .toList();
      if (rows.length > 0) {
        await tx
          .update(FlowJob)
          .set({ lockedBy: worker, lockedUntil: new Date(at.getTime() + LEASE_MS) })
          .where((j) => j.id.in(rows.map((row) => row.id)))
          .execute();
      }
      return rows;
    });
    // 发件箱里没送到的通知：每次跑作业顺带再试
    await core.notifications.deliverPending();
    let ran = 0;
    for (const job of due) {
      try {
        await withInstance(job.instanceId, null, async (exec, tx) => {
          // 暂停的实例：作业往后推一小时，恢复后再做
          if (exec.status === 'suspended') {
            await tx
              .update(FlowJob)
              .set({ dueAt: new Date(at.getTime() + 3_600_000), lockedBy: null, lockedUntil: null })
              .where((j) => j.id.eq(job.id))
              .execute();
            return;
          }
          await tx
            .delete(FlowJob)
            .where((j) => j.id.eq(job.id))
            .execute();
          await runJob(exec, job);
        });
      } catch (error) {
        await jobFailed(job, error, at);
      }
      ran++;
    }
    return ran;
  }

  /** 一个作业：节点还在等、轮次没变才做 */
  async function runJob(exec: Execution, job: Row<typeof FlowJob>) {
    const node = job.node;
    if (exec.status !== 'active' || !node || !exec.current.has(node)) return;
    if (job.round !== null && exec.state.rounds[node] !== job.round) return;
    if (job.kind === 'timer') {
      exec.current.delete(node);
      return exec.leave(node);
    }
    if (job.kind === 'action') {
      const result = await exec.callAction(node);
      exec.current.delete(node);
      return exec.leave(node, result?.outcome ?? null);
    }
    if (job.kind === 'receiveTimeout') {
      const waiting = exec.node(node);
      if (waiting.type !== 'receive') return;
      exec.addEvent('node.overdue', { node, actor: null, data: { dueAt: isoSeconds(job.dueAt) } });
      if (waiting.overdue?.action === 'complete') {
        exec.current.delete(node);
        return exec.leave(node, waiting.overdue.outcome);
      }
      return;
    }
    if (job.kind === 'overdue' || job.kind === 'remind' || job.kind === 'unclaimed') {
      return runDeadline(exec, job);
    }
    throw new FlowError('invalid-definition', `不认识的作业 ${job.kind}`);
  }

  /** 时限与提醒：待办还开着才做；超时按节点的 overdue 记一笔或自动处理 */
  async function runDeadline(exec: Execution, job: Row<typeof FlowJob>) {
    const item =
      job.workItemId === null
        ? undefined
        : await exec.tx.queryable(FlowWorkItem).find(job.workItemId);
    if (!item || item.state !== 'open') return;
    const node = exec.node(item.node) as TaskNode;
    const fields = { workItemId: item.id, node: node.id, actor: null };
    if (job.kind === 'remind') {
      exec.addEvent('workItem.reminded', {
        ...fields,
        data: { auto: true, reason: job.payload['reason'] },
      });
      return;
    }
    if (job.kind === 'unclaimed') {
      if (item.assignee) return;
      if (node.unclaimed?.action === 'assignByManager') {
        // 转收件箱的负责人指定：记下负责人，进他的“待我指定”（不知道负责人时只记一笔）
        const inbox = item.candidates
          .filter((token) => !token.startsWith('-'))
          .map(parseCandidate)
          .find((c) => c.kind !== 'user');
        const manager =
          inbox && options.org?.inboxManager
            ? await options.org.inboxManager(
                inbox as Parameters<typeof options.org.inboxManager>[0],
              )
            : undefined;
        await exec.tx
          .update(FlowWorkItem)
          .set({ designator: manager ?? null, awaitingDesignation: manager !== undefined })
          .where((w) => [w.id.eq(item.id), w.state.eq('open'), w.assignee.isNull()])
          .execute();
        exec.addEvent('workItem.unclaimed', {
          ...fields,
          data: manager ? { designator: manager } : null,
        });
        return;
      }
      exec.addEvent('workItem.reminded', { ...fields, data: { auto: true, reason: 'unclaimed' } });
      return;
    }
    exec.addEvent('workItem.overdue', {
      ...fields,
      data: { dueAt: item.dueAt ? isoSeconds(item.dueAt) : null },
    });
    if (node.overdue?.action === 'complete') {
      await core.tasks.finishItem(exec, exec.tx, item, node, node.overdue.outcome, {
        actor: null,
        comment: null,
      });
    }
  }

  /** 作业失败：回滚了它的事务，这里记次数与错误，按 n² 分钟重试，用完标失败 */
  /**
   * 作业失败：它的事务已经回滚，这里另开事务记次数与错误。异步的自动节点按 retry.times 重试（间隔 retry.backoff，
   * 不写时 n² 分钟），其余作业试 MAX_ATTEMPTS 次；用完标 failed、记 job.failed（data 里有作业编号），
   * 自动节点写了 onFailure: 'error' 时同时暂停实例
   */
  async function jobFailed(job: Row<typeof FlowJob>, error: unknown, at: Date) {
    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : String(error);
    await db.transaction(async (tx) => {
      const instance = await tx.queryable(FlowInstance).find(job.instanceId);
      const definition = instance ? await definitionOf(tx, instance.definitionId) : undefined;
      const node = job.node ? definition?.nodes.find((n) => n.id === job.node) : undefined;
      const service = job.kind === 'action' && node?.type === 'service' ? node : undefined;
      const maxAttempts = service ? (service.retry?.times ?? 0) + 1 : MAX_ATTEMPTS;
      const gaveUp = attempts >= maxAttempts;
      const backoff = service?.retry?.backoff;
      const delay = backoff
        ? dueAt(backoff, at, () => undefined, options).getTime() - at.getTime()
        : attempts * attempts * 60_000;
      await tx
        .update(FlowJob)
        .set({
          attempts,
          lastError: message.slice(0, 2000),
          lockedBy: null,
          lockedUntil: null,
          state: gaveUp ? 'failed' : 'pending',
          dueAt: new Date(at.getTime() + delay),
        })
        .where((j) => j.id.eq(job.id))
        .execute();
      if (!gaveUp || !instance || !definition) return;
      await tx.lock(FlowInstance, instance.id);
      const row = await tx.queryable(FlowInstance).findOrThrow(instance.id);
      const exec = await execution(tx, definition, row, null);
      exec.addEvent('job.failed', {
        node: job.node,
        actor: null,
        data: { jobId: job.id, kind: job.kind, error: message.slice(0, 500) },
      });
      if (service?.onFailure === 'error' && exec.status === 'active') {
        exec.status = 'suspended';
        exec.addEvent('instance.suspended', { actor: null, data: { reason: 'job.failed' } });
      }
      await exec.flush();
    });
  }

  /** 失败的作业（异常）：带节点、能不能跳过、能选的结果 */
  async function incidents(instance?: number): Promise<Incident[]> {
    const jobs = await db
      .queryable(FlowJob)
      .where((j) => [
        j.state.eq('failed'),
        ...(instance !== undefined ? [j.instanceId.eq(instance)] : []),
      ])
      .orderBy((j) => j.id)
      .toList();
    const rows: Incident[] = [];
    for (const job of jobs) {
      const row = await db.queryable(FlowInstance).findOrThrow(job.instanceId);
      const definition = await definitionOf(db, row.definitionId);
      const node = job.node ? definition.nodes.find((n) => n.id === job.node) : undefined;
      rows.push({
        jobId: job.id,
        instanceId: job.instanceId,
        instanceTitle: row.title,
        kind: job.kind,
        node: job.node,
        nodeName: node?.name ?? null,
        attempts: job.attempts,
        error: job.lastError,
        skippable: job.kind === 'action',
        outcomes: skipOutcomes(definition, job.node),
      });
    }
    return rows;
  }

  /** 重试失败的作业：回到待执行，马上到点（谁能重试由接入方在接口层或 intercept 里管） */
  async function retryJob(id: number, _actor: Actor): Promise<boolean> {
    const revived = await db
      .update(FlowJob)
      .set({ state: 'pending', attempts: 0, dueAt: now(), lockedBy: null, lockedUntil: null })
      .where((j) => [j.id.eq(id), j.state.eq('failed')])
      .execute();
    if (revived === 0) throw new FlowError('not-found', `没有失败的作业 ${id}`);
    return true;
  }

  /** 管理员跳过失败的异步动作：按指定的结果往下走（结果要是这个节点出边上写的） */
  async function skipJob(
    command: Extract<FlowCommand, { type: 'skipJob' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能跳过作业');
    const job = await db.queryable(FlowJob).find(command.job);
    if (!job || job.state !== 'failed' || job.kind !== 'action' || !job.node) {
      throw new FlowError('not-found', `没有能跳过的失败作业 ${command.job}`);
    }
    const node = job.node;
    return withInstance(
      job.instanceId,
      actor,
      async (exec, tx) => {
        if (exec.status !== 'active') {
          throw new FlowError('instance-not-active', `实例 ${job.instanceId} 不在进行中`);
        }
        const outcomes = skipOutcomes(exec.definition, node);
        if (!command.outcome && outcomes.length > 0) {
          throw new FlowError('invalid-input', '跳过要选结果', {
            field: 'outcome',
            code: 'required',
          });
        }
        if (command.outcome && !outcomes.includes(command.outcome)) {
          throw new FlowError('invalid-input', `${node} 的出边上没有结果 ${command.outcome}`, {
            field: 'outcome',
            code: 'unknown-outcome',
          });
        }
        await tx
          .delete(FlowJob)
          .where((j) => j.id.eq(job.id))
          .execute();
        exec.current.delete(node);
        exec.addEvent('job.skipped', {
          node,
          outcome: command.outcome ?? null,
          comment: command.reason ?? null,
        });
        await exec.leave(node, command.outcome ?? null);
      },
      command,
    );
  }

  return { runDue, runJob, runDeadline, jobFailed, incidents, retryJob, skipJob };
}

/** createJobs 给出的函数 */
export type Jobs = ReturnType<typeof createJobs>;

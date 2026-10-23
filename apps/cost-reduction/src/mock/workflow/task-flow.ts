/**
 * 任务卡与任务池流程的衔接（假后端）：每张任务卡一个 `task` 流程实例，计划调整各是一个 `task-change` 实例。
 * - 节点处理完：按 applyTaskCompletion 改任务卡，状态按 taskStatusOf 重新算；
 * - 计划调整：发起时任务卡记下审批中的申请，同意时写回并记变更记录，任务池流程的主办跟着换；
 * - 降 DMC 实施审批链：建卡后发起，节点通过时回填实施节点的完成日期，跟着任务暂停、恢复、终止；
 * - 演示的“推进到下一状态”：替当前处理人依次处理到目标状态（必填的意见、附件、字段用占位内容），
 *   正式页面里每个节点由各自的岗位处理；
 * - 种子数据：按里程碑的日期把每张任务回放一遍，流转记录是真实的先后
 */
import { shiftIsoDate } from '@vue-tsx-pro/ui';
import { type ProcessInstance, type WorkflowEvent } from '@vue-tsx-pro/ui/workflow';
import { TODAY } from '../../domain/clock';
import { latestEstimate, milestoneDone } from '../../domain/task/benefit';
import { reached } from '../../domain/task/status';
import { applyPlanChange } from '../../domain/task/plan-change';
import type { CostTask, PlanChange, TaskStatus } from '../../domain/task/types';
import { applyTaskCompletion } from '../../domain/task/workflow';
import { taskProcess, taskStatusOf } from '../../domain/workflow/task';
import { dmcProcess } from '../../domain/workflow/dmc';
import { taskChangeProcess } from '../../domain/workflow/task-change';
import { WorkflowError, type WorkflowEngine } from './engine';

/** 任务卡的流程实例；没有时为 undefined */
export const taskInstance = (engine: WorkflowEngine, code: string) =>
  engine.instanceFor(code, taskProcess.key);

/** 任务卡现在的状态（按流程） */
export function taskStatusIn(engine: WorkflowEngine, code: string): TaskStatus | null {
  const instance = taskInstance(engine, code);
  if (!instance) return null;
  const open = engine.itemsOf(instance.id).filter((item) => item.state === 'open');
  return taskStatusOf(instance, open);
}

/** 按新的流转记录改任务卡：任务池处理过的节点改字段，计划调整的申请、同意写回；状态按流程重新算；返回改过的任务卡 */
export function applyTaskEvents(
  engine: WorkflowEngine,
  events: readonly WorkflowEvent[],
  tasks: readonly CostTask[],
): CostTask[] {
  const changed = new Map<string, CostTask>();
  for (const event of events) {
    const instance = engine.instance(event.instanceId);
    const apply = eventAppliers[instance.key];
    if (!apply) continue;
    let task =
      changed.get(instance.businessKey) ?? tasks.find((item) => item.code === instance.businessKey);
    if (!task) continue;
    task = apply(task, event, instance);
    changed.set(task.code, task);
  }
  return [...changed.values()].map((task) => ({
    ...task,
    status: taskStatusIn(engine, task.code) ?? task.status,
  }));
}

/** 降 DMC 实施审批：节点通过时把完成日期回填到对应的实施节点（还没填的） */
function applyDmcChainEvent(task: CostTask, event: WorkflowEvent, instance: ProcessInstance) {
  if (event.type !== 'completed' || event.outcome !== 'approve' || !event.node) return task;
  const node = dmcProcess.nodes.find((item) => item.id === event.node);
  const form = node?.meta?.dmcForm;
  if (typeof form !== 'string' || instance.status === 'terminated') return task;
  return {
    ...task,
    dmcNodes: task.dmcNodes.map((item) =>
      item.form === form && !item.done ? { ...item, done: event.at.slice(0, 10) } : item,
    ),
  };
}

/** 各流程的流转记录怎么改任务卡 */
const eventAppliers: Record<
  string,
  ((task: CostTask, event: WorkflowEvent, instance: ProcessInstance) => CostTask) | undefined
> = {
  [taskProcess.key]: applyTaskFlowEvent,
  [taskChangeProcess.key]: applyPlanChangeEvent,
  [dmcProcess.key]: applyDmcChainEvent,
};

/** 任务池：处理过的节点按 applyTaskCompletion 改字段 */
function applyTaskFlowEvent(task: CostTask, event: WorkflowEvent, instance: ProcessInstance) {
  if (
    (event.type !== 'completed' && event.type !== 'auto-completed') ||
    !event.node ||
    !event.outcome
  )
    return task;
  return applyTaskCompletion(task, {
    node: event.node,
    outcome: event.outcome,
    on: event.at.slice(0, 10),
    attachments: event.attachments,
    variables: instance.variables,
  });
}

/** 计划调整：发起时记下审批中的申请，同意时写回并记变更记录，不同意、撤回时清掉 */
function applyPlanChangeEvent(task: CostTask, event: WorkflowEvent, instance: ProcessInstance) {
  const change = instance.variables as unknown as PlanChange;
  switch (event.type) {
    case 'started':
      return {
        ...task,
        pendingChange: {
          due: change.due,
          owner: change.owner,
          reason: change.reason,
          by: event.actor,
          at: event.at.slice(0, 10),
        },
      };
    case 'completed':
      if (event.outcome === 'agree' && task.pendingChange)
        return applyPlanChange(task, task.pendingChange, {
          at: event.at.slice(0, 10),
          approvedBy: event.actor,
        });
      return { ...task, pendingChange: null };
    case 'terminated':
      return { ...task, pendingChange: null };
    default:
      return task;
  }
}

/** 联动时要查的主数据：供应商的主账号（DMC 审批链里会签的人） */
export interface FollowContext {
  /** 供应商的主账号 */
  supplierAccounts: (supplier: string) => string[];
}

/**
 * 流转记录引起的别的流程的变化（后端在同一个事务里做；假后端在 db.run 回写任务卡之后调用）：
 * - 计划调整同意：任务池流程变量里的主办、计划完成换成新的，原主办手上的环节转给新主办；
 * - 降 DMC 任务建卡（进入方案设计）：发起实施审批链；
 * - 任务池暂停、恢复、终止：实施审批链跟着暂停、恢复、终止
 */
export function followTaskEvents(
  engine: WorkflowEngine,
  events: readonly WorkflowEvent[],
  tasks: readonly CostTask[],
  context: FollowContext,
): void {
  for (const event of events) {
    const instance = engine.instance(event.instanceId);
    const task = tasks.find((item) => item.code === instance.businessKey);
    if (!task) continue;
    if (instance.key === taskChangeProcess.key) {
      if (event.type === 'completed' && event.outcome === 'agree')
        handOver(engine, task, event.actor);
      continue;
    }
    if (instance.key !== taskProcess.key || task.kind !== 'dmc') continue;
    const chain = engine.instanceFor(task.code, dmcProcess.key);
    const chainActive = chain?.status === 'active' || chain?.status === 'suspended';
    if (event.type === 'completed' && event.node === 'create' && !chain)
      startDmcChain(engine, task, event.actor, context);
    else if (event.type === 'suspended' && chain?.status === 'active')
      engine.suspend(chain.id, event.actor, event.comment || '任务暂停');
    else if (event.type === 'resumed' && chain?.status === 'suspended')
      engine.resume(chain.id, event.actor);
    else if (event.type === 'terminated' && chainActive)
      engine.terminate(chain.id, event.actor, event.comment || '任务终止');
  }
}

/** 计划调整同意之后：任务池流程的主办、计划完成换成新的，原主办手上的环节转给新主办 */
function handOver(engine: WorkflowEngine, task: CostTask, actor: string) {
  const record = task.changes[0];
  const instance = taskInstance(engine, task.code);
  if (!record || !instance || instance.status === 'completed' || instance.status === 'terminated')
    return;
  engine.handover(instance.id, actor, {
    variables: { owner: task.owner, verifyDue: task.due },
    from: record.owner?.before,
    to: record.owner?.after,
  });
}

/** 发起降 DMC 实施审批链：涉及供应商的主账号会签 */
function startDmcChain(
  engine: WorkflowEngine,
  task: CostTask,
  actor: string,
  context: FollowContext,
) {
  return engine.start({
    key: dmcProcess.key,
    businessKey: task.code,
    title: `${task.name}：实施审批`,
    actor,
    variables: { supplierAccounts: context.supplierAccounts(task.supplier) },
  });
}

/** 替处理人填的占位内容：必填的附件、字段 */
function placeholderInput(task: CostTask, node: string): Record<string, unknown> {
  const a = task.a ?? latestEstimate(task);
  return {
    owner: task.owner,
    verifyWindow: `${shiftIsoDate(TODAY, { days: -30 })} ~ ${shiftIsoDate(TODAY, { days: -2 })}`,
    verdict: '达标',
    a: node === 'confirm' ? a.toString() : undefined,
    b: node === 'negotiate' ? a.times(0.98).toDecimalPlaces(2).toString() : undefined,
    contractNo: `HT-${task.code}`,
    terms: '按年度框架协议执行',
    gapReason: '商务条件置换',
  };
}

/** 处理当前节点：选第一个“往前走”的结果（不是退回、否决、终止），附件与字段用占位内容 */
function completeCurrent(engine: WorkflowEngine, task: CostTask, actor: string): void {
  const instance = taskInstance(engine, task.code);
  const item = instance && engine.itemsOf(instance.id).find((entry) => entry.state === 'open');
  if (!item) throw new WorkflowError('conflict', `${task.code} 没有待处理的节点`);
  const node = engine
    .definitionOf(instance.key, instance.version)
    .nodes.find((entry) => entry.id === item.node);
  const outcome =
    node?.type === 'task'
      ? node.outcomes.find((entry) => !entry.kind || entry.kind === 'approve')
      : undefined;
  if (!outcome) throw new WorkflowError('conflict', `“${item.name}”没有可以往前走的结果`);
  engine.complete(
    item.id,
    actor,
    {
      outcome: outcome.key,
      comment: outcome.comment === 'required' ? '演示：直接推进' : '',
      attachments: outcome.attachments ? [`${outcome.label}证据.pdf`] : [],
      variables: Object.fromEntries(
        Object.entries(placeholderInput(task, item.node)).filter(([key]) =>
          outcome.fields?.includes(key),
        ),
      ),
    },
    true,
  );
}

/** 演示的推进：替处理人依次处理，直到任务到了 next（最多走几步，防止定义改了以后死循环） */
export function advanceTaskTo(
  engine: WorkflowEngine,
  task: CostTask,
  next: TaskStatus,
  actor: string,
): void {
  for (let step = 0; step < 6; step++) {
    if (taskStatusIn(engine, task.code) === next) return;
    completeCurrent(engine, task, actor);
  }
  if (taskStatusIn(engine, task.code) !== next)
    throw new WorkflowError('conflict', `${task.code} 推进不到这个状态`);
}

/** 种子：按任务卡现在的状态与里程碑日期，把流程回放一遍 */
export function replayTask(
  engine: WorkflowEngine,
  task: CostTask,
  setClock: (iso: string) => void,
  actors: { pemo: string; cost: string; business: string },
): void {
  let last = '';
  /** 按日期走时钟：同一天的几步依次加一分钟，不会倒着走，也不超过今天 */
  const at = (date: string) => {
    const day = date > TODAY ? TODAY : date;
    const next = day > last.slice(0, 10) ? `${day}T09:00:00` : nextMinute(last);
    last = next;
    setClock(next);
  };
  const nextMinute = (iso: string) => {
    const minutes = Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)) + 7;
    return `${iso.slice(0, 10)}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
  };
  const step = (
    node: string,
    actor: string,
    outcome: string,
    input: Record<string, unknown> = {},
  ) => {
    const instance = taskInstance(engine, task.code)!;
    const item = engine
      .itemsOf(instance.id)
      .find((entry) => entry.node === node && entry.state === 'open');
    if (!item) throw new Error(`回放 ${task.code}：${node} 没有待办`);
    if (item.assignment === 'pool') engine.claim(item.id, actor);
    engine.complete(item.id, item.assignee ?? actor, { outcome, ...input });
  };
  const status = task.status;
  const designed = milestoneDone(task, '方案确定');
  const verified = milestoneDone(task, '验证完成');
  const confirmed = milestoneDone(task, '收益确认');
  const start = shiftIsoDate(designed ?? shiftIsoDate(TODAY, { days: -10 }), { days: -21 });
  const reachedStep = (target: TaskStatus) => {
    const order: TaskStatus[] = [
      'pending',
      'designing',
      'verifying',
      'awaiting',
      'confirmed',
      'negotiating',
      'realized',
      'closed',
    ];
    const current =
      status === 'paused' || status === 'terminated'
        ? 'designing'
        : status === 'unpriced'
          ? 'awaiting'
          : status;
    return order.indexOf(current) >= order.indexOf(target);
  };

  at(start);
  engine.start({
    key: taskProcess.key,
    businessKey: task.code,
    title: task.name,
    actor: actors.pemo,
    variables: {
      owner: task.owner,
      kind: task.kind,
      designDue: shiftIsoDate(start, { days: 45 }),
      verifyDue: task.due,
    },
  });
  if (!reachedStep('designing')) return;
  at(shiftIsoDate(start, { days: 2 }));
  step('create', actors.pemo, 'create', { variables: { owner: task.owner } });
  if (reachedStep('verifying')) {
    at(designed ?? start);
    step('design', task.owner, 'done', { attachments: ['方案评审纪要.pdf'] });
  }
  if (reachedStep('awaiting')) {
    at(verified ?? start);
    step('verify', task.owner, 'done', { attachments: ['验证报告.pdf'] });
    at(shiftIsoDate(verified ?? start, { days: 1 }));
    step('conclusion', actors.cost, 'issue', {
      attachments: ['验证窗结论.pdf'],
      variables: { verifyWindow: `${designed} ~ ${verified}`, verdict: '达标' },
    });
    at(shiftIsoDate(verified ?? start, { days: 2 }));
    step('judge', actors.pemo, 'pass');
  }
  if (status === 'unpriced') {
    at(shiftIsoDate(verified ?? start, { days: 5 }));
    step('confirm', actors.cost, 'unpriced', { comment: '第二货源合同未签，缺定价依据' });
    return;
  }
  if (reachedStep('confirmed')) {
    at(confirmed ?? start);
    step('confirm', actors.cost, 'lock', {
      attachments: ['收益认定意见.pdf'],
      variables: { a: (task.a ?? latestEstimate(task)).toString() },
    });
  }
  if (reachedStep('negotiating')) {
    at(shiftIsoDate(confirmed ?? start, { days: 1 }));
    const instance = taskInstance(engine, task.code)!;
    const item = engine
      .itemsOf(instance.id)
      .find((entry) => entry.node === 'negotiate' && entry.state === 'open')!;
    engine.claim(item.id, actors.business);
  }
  if (reachedStep('realized')) {
    at(shiftIsoDate(confirmed ?? start, { days: 10 }));
    step('negotiate', actors.business, 'record', {
      attachments: ['商务谈定记录.pdf'],
      variables: {
        b: (task.b ?? task.a ?? task.expected).toString(),
        contractNo: `HT-${task.code}`,
        terms: '按年度框架协议执行',
        gapReason: task.gapReason,
      },
    });
    at(shiftIsoDate(confirmed ?? start, { days: 11 }));
    step('judgeDeal', actors.pemo, 'settled');
  }
  if (status === 'closed') {
    at(shiftIsoDate(confirmed ?? start, { days: 12 }));
    step('close', actors.pemo, 'close');
  }
  const instance = taskInstance(engine, task.code)!;
  if (status === 'paused') engine.suspend(instance.id, actors.pemo, '等新材料到货后恢复');
  if (status === 'terminated')
    engine.terminate(instance.id, actors.pemo, '供应商退出，事项回流储备库');
}

/**
 * 种子：几项计划调整走一遍流程——两项 PEMO 同意过（延期，有变更记录），一项在审批中（换主办并延期）。
 * 在任务池回放之后调用；之后要按新的流转记录回写任务卡
 */
export function replayPlanChanges(
  engine: WorkflowEngine,
  tasks: readonly CostTask[],
  setClock: (iso: string) => void,
  actors: { pemo: string; successorOf: (task: CostTask) => string },
): void {
  const { pemo } = actors;
  const running = tasks.filter(
    (task) => task.status === 'designing' || task.status === 'verifying',
  );
  const submit = (task: CostTask, change: PlanChange, day: string) => {
    setClock(`${day}T10:00:00`);
    return engine.start({
      key: taskChangeProcess.key,
      businessKey: task.code,
      title: `${task.name}：计划调整`,
      actor: task.owner,
      variables: { ...change },
    });
  };
  for (const task of running.slice(0, 2)) {
    const instance = submit(
      task,
      {
        due: shiftIsoDate(task.due, { months: 2 }),
        owner: task.owner,
        reason: '供应商工装交付推迟，验证顺延两个月',
      },
      shiftIsoDate(TODAY, { days: -20 }),
    );
    setClock(`${shiftIsoDate(TODAY, { days: -19 })}T09:30:00`);
    const item = engine.itemsOf(instance.id).find((entry) => entry.state === 'open')!;
    engine.claim(item.id, pemo);
    engine.complete(item.id, pemo, { outcome: 'agree', comment: '同意，按新计划跟踪' });
  }
  const pending = running[2];
  if (pending)
    submit(
      pending,
      {
        due: shiftIsoDate(pending.due, { months: 1 }),
        owner: actors.successorOf(pending),
        reason: '原主办调岗，工作移交并顺延一个月',
      },
      shiftIsoDate(TODAY, { days: -1 }),
    );
}

/**
 * 种子：降 DMC 任务的实施审批链。建卡后发起；策划在 ECP 之前通过，ECP、MI 按实施节点的完成日期通过，
 * 到了待认定整条链走完；暂停、终止的跟着任务。在这张任务的任务池回放之后调用
 */
export function replayDmcChain(
  engine: WorkflowEngine,
  task: CostTask,
  setClock: (iso: string) => void,
  context: FollowContext & { memberOf: (group: string) => string },
): void {
  const flow = taskInstance(engine, task.code);
  const created =
    flow &&
    engine.eventsOf(flow.id).find((event) => event.type === 'completed' && event.node === 'create');
  if (task.kind !== 'dmc' || !flow || !created) return;
  let day = created.at.slice(0, 10);
  const tick = (date?: string | null) => {
    const next = shiftIsoDate(day, { days: 1 });
    day = date && date > next ? date : next;
    if (day > TODAY) day = TODAY;
    setClock(`${day}T11:00:00`);
  };
  setClock(created.at);
  const chain = startDmcChain(engine, task, created.actor, context);
  const doneOf = (form: string) => task.dmcNodes.find((node) => node.form === form)?.done;
  const steps: { node: string; reached: boolean; on?: string | null }[] = [
    // 策划在 ECP 之前：ECP 已经批准的，策划一定通过了
    { node: 'planning', reached: reached(task.status, 'verifying') || doneOf('ECP 批准') != null },
    { node: 'ecp', reached: doneOf('ECP 批准') != null, on: doneOf('ECP 批准') },
    { node: 'mi', reached: doneOf('MI 批准') != null, on: doneOf('MI 批准') },
    ...['impact', 'suppliers', 'audit', 'finance'].map((node) => ({
      node,
      reached: reached(task.status, 'awaiting'),
    })),
  ];
  for (const step of steps) {
    if (!step.reached) break;
    tick(step.on);
    for (const item of engine.itemsOf(chain.id).filter((entry) => entry.state === 'open')) {
      const actor = item.assignee ?? context.memberOf(item.pool ?? '');
      if (item.assignment === 'pool') engine.claim(item.id, actor);
      engine.complete(item.id, actor, { outcome: 'approve' });
    }
  }
  if (task.status === 'paused') engine.suspend(chain.id, created.actor, '任务暂停');
  if (task.status === 'terminated') engine.terminate(chain.id, created.actor, '任务终止');
}

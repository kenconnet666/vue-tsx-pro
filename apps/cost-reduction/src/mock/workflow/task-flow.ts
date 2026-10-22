/**
 * 任务卡与任务池流程的衔接（假后端）：每张任务卡一个 `task` 流程实例。
 * - 节点处理完：按 applyTaskCompletion 改任务卡，状态按 taskStatusOf 重新算；
 * - 演示的“推进到下一状态”：替当前处理人依次处理到目标状态（必填的意见、附件、字段用占位内容），
 *   正式页面里每个节点由各自的岗位处理；
 * - 种子数据：按里程碑的日期把每张任务回放一遍，流转记录是真实的先后
 */
import { shiftIsoDate, type WorkflowEvent } from '@vue-tsx-pro/ui';
import { TODAY } from '../../domain/clock';
import { latestEstimate, milestoneDone } from '../../domain/task/benefit';
import type { CostTask, TaskStatus } from '../../domain/task/types';
import { applyTaskCompletion } from '../../domain/task/workflow';
import { taskProcess, taskStatusOf } from '../../domain/workflow/task';
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

/** 按新的流转记录改任务卡：处理过的节点改字段，状态按流程重新算；返回改过的任务卡 */
export function applyTaskEvents(
  engine: WorkflowEngine,
  events: readonly WorkflowEvent[],
  tasks: readonly CostTask[],
): CostTask[] {
  const changed = new Map<string, CostTask>();
  for (const event of events) {
    const instance = engine.instance(event.instanceId);
    if (instance.key !== taskProcess.key) continue;
    let task =
      changed.get(instance.businessKey) ?? tasks.find((item) => item.code === instance.businessKey);
    if (!task) continue;
    if (
      (event.type === 'completed' || event.type === 'auto-completed') &&
      event.node &&
      event.outcome
    )
      task = applyTaskCompletion(task, {
        node: event.node,
        outcome: event.outcome,
        on: event.at.slice(0, 10),
        attachments: event.attachments,
        variables: instance.variables,
      });
    changed.set(task.code, task);
  }
  return [...changed.values()].map((task) => ({
    ...task,
    status: taskStatusIn(engine, task.code) ?? task.status,
  }));
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

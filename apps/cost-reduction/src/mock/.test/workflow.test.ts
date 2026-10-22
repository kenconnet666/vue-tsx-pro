// 流转模拟：五个流程定义校验通过；渠道一走完一遍（并行、汇合、派到产品团队、协商三轮后提级）；
// 收件箱规则（认领、退回收件箱后不能再认领、负责人指定、申请改派、退回落到原处理人）；超时视为无异议；
// 没人认领转负责人；会签与否决；暂停与终止；卡的状态由节点决定
import { createWorkCalendar, validateProcess } from '@vue-tsx-pro/ui';
import { beforeEach, describe, expect, it } from 'vitest';
import { processDefinitions, statusOfInstance, suggestionProcess } from '../../domain/workflow';
import { createDatabase } from '../db';
import { masterSeed } from '../seed/master';
import { taskStatusIn } from '../workflow/task-flow';
import { createDirectory } from '../workflow/directory';
import {
  createWorkflowEngine,
  emptyWorkflowState,
  WorkflowError,
  type WorkflowEngine,
} from '../workflow/engine';

// 演示身份：成本团队王晴（负责人）、唐可；PEMO 许悠；复材团队林小满；供应商甲主账号
const COST = 'E50913';
const COST2 = 'E50377';
const PEMO = 'E40287';
const FC = 'E10732';
const SUPPLIER = 'S01-ZL';

let clock = '2026-10-21T09:00:00';
let engine: WorkflowEngine;

beforeEach(() => {
  clock = '2026-10-21T09:00:00';
  engine = createWorkflowEngine(emptyWorkflowState(), {
    definitions: processDefinitions,
    directory: createDirectory(masterSeed),
    calendar: createWorkCalendar(),
    now: () => clock,
  });
});

/** 实例在这个节点上开着的待办 */
const openAt = (instanceId: string, node: string) =>
  engine.itemsOf(instanceId).filter((item) => item.node === node && item.state === 'open');
const one = (instanceId: string, node: string) => {
  const items = openAt(instanceId, node);
  expect(items, `${node} 的待办`).toHaveLength(1);
  return items[0]!;
};
const status = (instanceId: string) => {
  const instance = engine.instance(instanceId);
  return statusOfInstance(engine.definitionOf(instance.key), instance);
};

/** 发起一条建议，走到协商（齐全、派到复材团队、可行、出测算） */
function toReview() {
  const instance = engine.start({
    key: 'suggestion',
    businessKey: 'JY-2026-0001',
    title: '整流罩支架材料替代',
    actor: SUPPLIER,
    variables: { supplierAccount: SUPPLIER },
  });
  const check = one(instance.id, 'check');
  engine.claim(check.id, COST);
  engine.complete(check.id, COST, { outcome: 'pass' });
  const dispatch = one(instance.id, 'dispatch');
  engine.claim(dispatch.id, PEMO);
  engine.complete(dispatch.id, PEMO, {
    outcome: 'dispatch',
    variables: { productGroup: 'product:FC' },
  });
  const evaluate = one(instance.id, 'evaluate');
  expect(evaluate.pool).toBe('product:FC');
  engine.claim(evaluate.id, FC);
  engine.complete(evaluate.id, FC, { outcome: 'feasible' });
  // 汇合还在等收益测算
  expect(openAt(instance.id, 'review')).toHaveLength(0);
  const estimate = one(instance.id, 'estimate');
  engine.claim(estimate.id, COST2);
  engine.complete(estimate.id, COST2, { outcome: 'done' });
  return instance;
}

describe('流程定义', () => {
  it('五个流程都通过结构校验', () => {
    for (const definition of processDefinitions)
      expect(validateProcess(definition), definition.key).toEqual([]);
  });
});

describe('渠道一', () => {
  it('齐全后技术评估与收益测算并行，两路都到了才进协商；协商落到供应商主账号', () => {
    const instance = toReview();
    const review = one(instance.id, 'review');
    expect(review).toMatchObject({ assignee: SUPPLIER, assignment: 'direct', arrival: 'forward' });
    expect(status(instance.id)).toBe('negotiating');
  });

  it('提出异议要附新依据；再测算落到上一版的测算人；第 3 次异议后提级 PEMO', () => {
    const instance = toReview();
    for (let round = 1; round <= 3; round++) {
      const review = one(instance.id, 'review');
      expect(() =>
        engine.complete(review.id, SUPPLIER, { outcome: 'object', comment: '单价偏高' }),
      ).toThrow(/附件/);
      engine.complete(review.id, SUPPLIER, {
        outcome: 'object',
        comment: '单价偏高',
        attachments: ['报价单.pdf'],
      });
      if (round < 3) {
        const reestimate = one(instance.id, 'reestimate');
        expect(reestimate.assignee).toBe(COST2);
        engine.complete(reestimate.id, COST2, { outcome: 'done', comment: '采纳单价，工时不变' });
      }
    }
    const arbitrate = one(instance.id, 'arbitrate');
    expect(arbitrate).toMatchObject({ pool: 'pemo', arrival: 'escalate' });
    engine.claim(arbitrate.id, PEMO);
    engine.complete(arbitrate.id, PEMO, { outcome: 'decide', comment: '按 V3 定' });
    const lock = one(instance.id, 'lock');
    engine.complete(lock.id, COST2, { outcome: 'lock' });
    expect(engine.instance(instance.id)).toMatchObject({ status: 'completed', result: 'approved' });
    expect(status(instance.id)).toBe('approved');
  });

  it('技术评估不可行：要填否决原因与复活条件；终止结束取消收益测算那一路', () => {
    const instance = engine.start({
      key: 'suggestion',
      businessKey: 'JY-2026-0002',
      title: '舱门密封件国产化',
      actor: SUPPLIER,
      variables: { supplierAccount: SUPPLIER },
    });
    const check = one(instance.id, 'check');
    engine.claim(check.id, COST);
    engine.complete(check.id, COST, { outcome: 'pass' });
    const dispatch = one(instance.id, 'dispatch');
    engine.claim(dispatch.id, PEMO);
    engine.complete(dispatch.id, PEMO, {
      outcome: 'dispatch',
      variables: { productGroup: 'product:FC' },
    });
    const evaluate = one(instance.id, 'evaluate');
    engine.claim(evaluate.id, FC);
    expect(() =>
      engine.complete(evaluate.id, FC, { outcome: 'infeasible', comment: '强度不够' }),
    ).toThrow(/rejectReason/);
    engine.complete(evaluate.id, FC, {
      outcome: 'infeasible',
      comment: '强度不够',
      variables: { rejectReason: '强度要求', reviveCondition: '若材料强度等级提高一档则可实施' },
    });
    expect(engine.instance(instance.id)).toMatchObject({ status: 'completed', result: 'shelved' });
    expect(openAt(instance.id, 'estimate')).toHaveLength(0);
    expect(status(instance.id)).toBe('shelved');
  });

  it('退单退回 PEMO：落到原来派单的人，不进岗位收件箱', () => {
    const instance = toReview();
    // 重新派一次：从技术评估退单
    const other = engine.start({
      key: 'suggestion',
      businessKey: 'JY-2026-0003',
      title: '线束支架合并',
      actor: SUPPLIER,
      variables: { supplierAccount: SUPPLIER },
    });
    expect(instance.id).not.toBe(other.id);
    const check = one(other.id, 'check');
    engine.claim(check.id, COST);
    engine.complete(check.id, COST, { outcome: 'pass' });
    const dispatch = one(other.id, 'dispatch');
    engine.claim(dispatch.id, PEMO);
    engine.complete(dispatch.id, PEMO, {
      outcome: 'dispatch',
      variables: { productGroup: 'product:FC' },
    });
    const evaluate = one(other.id, 'evaluate');
    engine.claim(evaluate.id, FC);
    engine.complete(evaluate.id, FC, { outcome: 'decline', comment: '不归复材团队' });
    expect(one(other.id, 'dispatch')).toMatchObject({
      assignee: PEMO,
      assignment: 'direct',
      arrival: 'return',
      from: { node: 'evaluate', user: FC },
    });
  });
});

describe('收件箱', () => {
  const started = () =>
    engine.start({
      key: 'suggestion',
      businessKey: 'JY-2026-0009',
      title: '内饰连接件',
      actor: SUPPLIER,
      variables: { supplierAccount: SUPPLIER },
    });

  it('认领先点先得；不在岗位的不能认领；没认领不能处理', () => {
    const check = one(started().id, 'check');
    expect(() => engine.complete(check.id, COST, { outcome: 'pass' })).toThrow(/认领/);
    expect(() => engine.claim(check.id, FC)).toThrow(WorkflowError);
    engine.claim(check.id, COST2);
    expect(() => engine.claim(check.id, COST)).toThrow(/已经有人认领/);
  });

  it('退回收件箱要写原因；退回过的人不能再认领，别人可以', () => {
    const check = one(started().id, 'check');
    engine.claim(check.id, COST2);
    expect(() => engine.release(check.id, COST2, ' ')).toThrow(/原因/);
    engine.release(check.id, COST2, '这周出差');
    expect(() => engine.claim(check.id, COST2)).toThrow(/二次认领/);
    expect(engine.claim(check.id, COST).assignee).toBe(COST);
  });

  it('超过 3 个工作日没人认领：转负责人指定；指定即生效，被指定的人只能申请改派', () => {
    const check = one(started().id, 'check');
    clock = '2026-10-27T09:00:00';
    engine.tick();
    expect(engine.item(check.id).needsDesignation).toBe(true);
    expect(() => engine.designate(check.id, COST2, COST2)).toThrow(/负责人/);
    engine.designate(check.id, COST, COST2);
    expect(engine.item(check.id)).toMatchObject({ assignee: COST2, assignment: 'designated' });
    expect(() => engine.release(check.id, COST2, '不想做')).toThrow();
    engine.requestReassign(check.id, COST2, '对这家供应商不熟');
    expect(engine.item(check.id).reassignRequest?.reason).toBe('对这家供应商不熟');
  });

  it('协商超时视为无异议：自动认可，进锁定 A', () => {
    const instance = toReview();
    clock = '2026-11-20T09:00:00';
    engine.tick();
    expect(one(instance.id, 'lock')).toBeTruthy();
    const events = engine.eventsOf(instance.id);
    expect(events.find((event) => event.type === 'auto-completed')).toMatchObject({
      node: 'review',
      outcome: 'accept',
      comment: '超过时限，视为无异议',
    });
  });
});

describe('会签、暂停与终止、迁移', () => {
  it('DMC 审批链的供应商会签：都同意才往下；一家驳回就退回上一节点的原处理人', () => {
    const instance = engine.start({
      key: 'dmc-implementation',
      businessKey: 'DMC-2026-QY-2',
      title: '前起落架线缆支架',
      actor: PEMO,
      variables: { supplierAccounts: [SUPPLIER, 'S02-XX'] },
      at: ['suppliers'],
    });
    const [first, second] = openAt(instance.id, 'suppliers');
    engine.complete(first!.id, SUPPLIER, { outcome: 'approve' });
    expect(openAt(instance.id, 'audit')).toHaveLength(0);
    engine.complete(second!.id, 'S02-XX', { outcome: 'reject', comment: '收益口径不认' });
    expect(engine.item(first!.id).state).toBe('done');
    expect(openAt(instance.id, 'impact')).toHaveLength(1);
  });

  it('暂停后待办留着但不能处理；恢复后可以；终止取消全部待办', () => {
    const instance = engine.start({
      key: 'task',
      businessKey: 'DJ-2026-FC-1',
      title: '平尾翼根整流罩',
      actor: PEMO,
      variables: { owner: FC },
      at: ['design'],
    });
    const design = one(instance.id, 'design');
    expect(design).toMatchObject({ assignee: FC, assignment: 'direct' });
    engine.suspend(instance.id, PEMO, '等新材料到货');
    expect(status(instance.id)).toBe('paused');
    expect(() =>
      engine.complete(design.id, FC, { outcome: 'done', attachments: ['评审纪要.pdf'] }),
    ).toThrow(/暂停/);
    engine.resume(instance.id, PEMO);
    engine.complete(design.id, FC, { outcome: 'done', attachments: ['评审纪要.pdf'] });
    expect(status(instance.id)).toBe('verifying');
    engine.terminate(instance.id, PEMO, '供应商退出');
    expect(engine.itemsOf(instance.id).every((item) => item.state !== 'open')).toBe(true);
    expect(status(instance.id)).toBe('terminated');
  });

  it('流程图的进度：走过的连线都在流转记录里', () => {
    const instance = toReview();
    const edges = new Set(engine.eventsOf(instance.id).flatMap((event) => event.edge ?? []));
    for (const id of [
      'submit',
      'check-pass',
      'fork-dispatch',
      'fork-estimate',
      'dispatched',
      'feasible',
      'estimated',
      'joined',
    ])
      expect(edges.has(id), id).toBe(true);
    expect(suggestionProcess.edges.some((edge) => edge.id === 'accept')).toBe(true);
    expect(edges.has('accept')).toBe(false);
  });
});

describe('种子数据', () => {
  it('每张任务卡按里程碑回放了流程：按流程推出的状态与卡上的一致，流转记录按时间先后', () => {
    const db = createDatabase(null);
    for (const task of db.tables.tasks)
      expect(taskStatusIn(db.workflow, task.code), task.code).toBe(task.status);
    for (const instance of db.tables.workflow.instances) {
      const times = db.workflow.eventsOf(instance.id).map((event) => event.at);
      expect(times, instance.businessKey).toEqual(times.toSorted());
    }
  });
});

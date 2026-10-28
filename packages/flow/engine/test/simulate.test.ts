// 试运行：按步骤走一遍，返回走过的路、停在哪、等谁；出错放在结果里
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { simulate } from '../src/testing.ts';

const purchase = JSON.parse(
  readFileSync(new URL('../../spec/scenarios/processes/purchase.json', import.meta.url), 'utf8'),
) as ProcessDefinition;
const overtime = JSON.parse(
  readFileSync(new URL('../../spec/scenarios/processes/overtime.json', import.meta.url), 'utf8'),
) as ProcessDefinition;

describe('simulate', () => {
  it('金额大：财务复核后停在总经理，等 1004 处理', async () => {
    const run = await simulate(purchase, {
      variables: { title: '服务器', amount: '12000' },
      steps: [{ node: 'review', outcome: 'pass' }],
    });
    assert.equal(run.status, 'active');
    assert.deepEqual(
      run.open.map((o) => [o.node, o.assignee]),
      [['approve', '1004']],
    );
    assert.ok(run.path.some((e) => e.type === 'node.left' && e.edge === 'large'));
  });

  it('金额小：财务收件箱里的人是角色 1，通过就结束', async () => {
    const started = await simulate(purchase, { variables: { title: '椅子', amount: '800' } });
    assert.deepEqual(started.open[0]?.candidates, ['role:1']);
    const run = await simulate(purchase, {
      variables: { title: '椅子', amount: '800' },
      steps: [{ node: 'review', outcome: 'pass' }],
    });
    assert.equal(run.result, 'approved');
  });

  it('等时间：定时两小时后到人工节点，超时按同意自动处理', async () => {
    const run = await simulate(overtime, {
      steps: [{ wait: { hours: 2 } }, { wait: { hours: 4 } }],
    });
    assert.equal(run.status, 'completed');
    assert.ok(run.path.some((e) => e.type === 'workItem.overdue'));
  });

  it('出错放在结果里：哪一步、什么代号', async () => {
    const run = await simulate(purchase, {
      variables: { title: '桌子', amount: '1' },
      steps: [{ node: 'review', outcome: 'reject' }],
    });
    assert.equal(run.error?.step, 1);
    assert.equal(run.error?.code, 'invalid-input');
    const broken = await simulate({
      ...purchase,
      nodes: purchase.nodes.filter((n) => n.id !== 'done'),
    });
    assert.equal(broken.status, 'not-started');
    assert.equal(broken.error?.code, 'invalid-definition');
  });
});

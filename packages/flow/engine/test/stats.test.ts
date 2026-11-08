// 监控与统计（docs/decisions/0010 第 4 节）：发起、结束、各流程平均时长、环节的平均停留与超时（慢的在前）、
// 谁手上压着待办、按天的趋势；端点只给管理员，参数里的 Date 经线路还原
import assert from 'node:assert/strict';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { describe, it } from 'vitest';
import { createFlowClient, flowEndpoint, type Actor } from '../src/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

const alice: Actor = { id: '1001' };
const bob: Actor = { id: '1002' };

/** 提交 → bob 审核（2 小时时限）→ 结束 */
const definition: ProcessDefinition = {
  key: 'stats',
  name: '统计',
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'review',
      type: 'task',
      name: '审核',
      assignees: [{ user: '1002' }],
      due: { hours: 2 },
      outcomes: [{ key: 'ok', label: '同意' }],
    },
    { id: 'end', type: 'end', name: '结束', result: 'approved' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'review' },
    { id: 'e2', from: 'review', to: 'end', outcome: 'ok' },
  ],
};

describe('监控与统计', () => {
  it('发起、结束、平均时长、环节的停留与超时、待办的积压、按天的趋势', async () => {
    const { engine, clock } = await createTestEngine({});
    await engine.publish(definition);
    const first = await engine.run({ type: 'start', process: 'stats' }, alice);
    await engine.run({ type: 'start', process: 'stats' }, alice);
    clock.advance({ hours: 3 });
    await engine.run({ type: 'complete', workItem: first.workItems[0]!.id, outcome: 'ok' }, bob);

    const stats = await engine.stats.overview({ timeZone: 'Asia/Shanghai' });
    assert.deepEqual(
      { ...stats.totals },
      { active: 1, started: 2, finished: 1, rejected: 0, open: 1, overdue: 1, incidents: 0 },
    );
    assert.deepEqual(stats.processes, [
      { processKey: 'stats', active: 1, started: 2, finished: 1, averageHours: 3 },
    ]);
    assert.deepEqual(stats.nodes, [
      {
        processKey: 'stats',
        node: 'review',
        nodeName: '审核',
        done: 1,
        averageHours: 3,
        overdue: 1,
      },
    ]);
    assert.deepEqual(stats.workload, [{ user: '1002', open: 1, overdue: 1 }]);
    assert.equal(stats.daily.length >= 30, true);
    assert.equal(
      stats.daily.reduce((sum, d) => sum + d.started, 0),
      2,
    );

    const endpoint = flowEndpoint(engine, { actor: () => alice });
    const client = createFlowClient({ call: (request) => endpoint.handle(request) });
    await assert.rejects(client.stats.overview(), { code: 'forbidden' });
    // 参数里的 Date 经线路到端点还是 Date（与客户端读结果同一个 reader）
    const adminEndpoint = flowEndpoint(engine, { actor: () => ({ id: '9', admin: true }) });
    const adminClient = createFlowClient({ call: (request) => adminEndpoint.handle(request) });
    const viaClient = await adminClient.stats.overview({
      from: stats.from,
      to: stats.to,
      timeZone: 'Asia/Shanghai',
    });
    assert.deepEqual(viaClient.totals, stats.totals);
    assert.ok(viaClient.from instanceof Date);
  });
});

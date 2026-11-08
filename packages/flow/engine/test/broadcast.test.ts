// 广播（PG 的 NOTIFY）：推进、发布随提交发出 FLOW_CHANNEL，失败回滚的不发；组织目录改了发 ORG_CHANNEL
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { listen, pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import { templates } from '@zerodep-dev/flow-ts-model';
import { describe, it } from 'vitest';
import { FLOW_CHANNEL, ORG_CHANNEL, type Actor } from '../src/index.ts';
import { createOrgDirectory } from '../src/org/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

const alice: Actor = { id: '1001' };
/** NOTIFY 在提交后异步送到：等一下再看收到了什么 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('广播', () => {
  it('发布、推进随提交发出；失败回滚的命令不发；组织改了发组织的频道', async () => {
    const database = new PGlite();
    const adapter = pglite(database);
    const { engine } = await createTestEngine({ adapter });
    const flow: string[] = [];
    const org: string[] = [];
    const stopFlow = await listen(database, FLOW_CHANNEL, (payload) => flow.push(payload));
    const stopOrg = await listen(database, ORG_CHANNEL, () => org.push('changed'));

    await engine.publish(templates.leave());
    await settle();
    assert.deepEqual(flow, ['{"process":"leave"}']);

    const started = await engine.run(
      { type: 'start', process: 'leave', variables: { days: 1, reason: '病假' } },
      alice,
    );
    await settle();
    assert.equal(flow.at(-1), JSON.stringify({ instance: started.instance.id }));

    // 失败的命令整个回滚：不广播
    const before = flow.length;
    await assert.rejects(
      engine.run({ type: 'withdraw', instance: started.instance.id }, { id: '9' }),
    );
    await settle();
    assert.equal(flow.length, before);

    const directory = createOrgDirectory({ adapter });
    await directory.createTables();
    await directory.sync({ departments: [], roles: [], employees: [] });
    await directory.saveRole({ id: 'r', name: '角色' });
    await settle();
    assert.deepEqual(org, ['changed', 'changed']);
    await stopFlow();
    await stopOrg();
  });
});

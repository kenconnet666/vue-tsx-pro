// @vitest-environment node
// 流程中心的后端：全新的库上建表、同步组织、发布流程、写种子都走得通，各人的待办与种子说的一致
import { PGlite } from '@electric-sql/pglite';
import { pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import { expect, it } from 'vitest';
import { PROCESSES } from '../processes';
import { createBackend, prepare } from './backend';

it('第一次准备：种子按组织里的上级、部门负责人、财务收件箱落到各人名下', async () => {
  let fixed: Date | null = null;
  const backend = createBackend(pglite(new PGlite()), () => fixed ?? new Date());
  const steps: string[] = [];
  await prepare(backend, {
    at: (daysAgo, hour = 10) => {
      fixed = new Date(Date.now() - daysAgo * 86_400_000);
      fixed.setHours(hour, 0, 0, 0);
    },
    resume: () => (fixed = null),
    progress: (step) => steps.push(step),
  });
  expect(steps).toContain('同步组织');
  expect(await backend.engine.query.processes()).toHaveLength(PROCESSES.length);

  const todo = async (id: string) => {
    const actor = (await backend.directory.actorOf(id))!;
    return (await backend.engine.query.todo(actor)).map((item) => item.title ?? '');
  };
  // 陈晓的直属上级林小满；韩东的事假过了周启航到沈若水；何静是销售部负责人；8 万的采购到总经理
  expect(await todo('1003')).toEqual([expect.stringContaining('年假')]);
  expect(await todo('1002')).toEqual([expect.stringContaining('事假')]);
  expect(await todo('1018')).toEqual([expect.stringContaining('演示用笔记本')]);
  expect((await todo('1001')).some((title) => title.includes('展厅'))).toBe(true);
  // 财务的收件箱：财务部的人都看得到苏念的报销、维保合同的财务审核、软件许可尾款的付款单
  const finance = await todo('1012');
  for (const part of ['上海', '维保', '软件许可尾款'])
    expect(finance.some((title) => title.includes(part))).toBe(true);
  // 法务会签到一半：蒋律签过了，袁清还没签
  expect(await todo('1022')).toEqual([expect.stringContaining('维保')]);
  expect(await todo('1021')).toEqual([]);
  // 软件许可合同生效，首付那张付款单推 ERP 付掉了
  const admin = (await backend.directory.actorOf('1001'))!;
  const { rows } = await backend.engine.query.search(admin, { scope: 'all', text: '首付' });
  expect(rows.map((row) => [row.status, row.result])).toEqual([['completed', 'paid']]);
}, 60_000);

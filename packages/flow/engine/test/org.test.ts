// 组织目录：角色与部门展开成人、上级与部门负责人、Actor，接到引擎上跑一遍（PGlite）
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { beforeAll, describe, it } from 'vitest';
import type { ExtensionContext } from '../src/index.ts';
import { createOrgDirectory, type OrgData } from '../src/org/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

/**
 * 总部（1）── 研发（2）── 前端（3）
 *          └─ 财务（4）
 * 1001 总经理；1002 研发总监（研发负责人）；1003 前端组长（前端负责人）；1004、1005 前端；1006 已离职的前端；1007 财务
 */
const data: OrgData = {
  departments: [
    { id: '1', name: '总部', parentId: null, headId: '1001' },
    { id: '2', name: '研发', parentId: '1', headId: '1002', sort: 2 },
    { id: '4', name: '财务', parentId: '1', headId: '1007', sort: 1 },
    { id: '3', name: '前端', parentId: '2', headId: '1003' },
  ],
  roles: [
    { id: 'ceo', name: '总经理' },
    { id: 'finance', name: '财务' },
  ],
  employees: [
    { id: '1001', name: '顾', departmentId: '1', managerId: null, roles: ['ceo'] },
    { id: '1002', name: '沈', departmentId: '2', managerId: '1001' },
    { id: '1003', name: '林', departmentId: '3', managerId: '1002' },
    { id: '1004', name: '陈', departmentId: '3', managerId: '1003' },
    { id: '1005', name: '许', departmentId: '3', managerId: '1006' },
    { id: '1006', name: '韩', departmentId: '3', managerId: '1003', active: false },
    { id: '1007', name: '钱', departmentId: '4', managerId: '1001', roles: ['finance'] },
  ],
};

const adapter = pglite(new PGlite());
const directory = createOrgDirectory({
  adapter,
  isAdmin: (employee) => employee.roles.includes('ceo'),
});

beforeAll(async () => {
  await directory.createTables();
  await directory.sync(data);
});

/** 解析器的现场：只用到发起人、变量与参数 */
const contextOf = (
  startedBy: string,
  args: Record<string, unknown> = {},
  variables: Record<string, unknown> = {},
): ExtensionContext => ({
  instance: { id: 1, processKey: 'p', businessKey: null, startedBy },
  variables,
  read: (field: string) => variables[field],
  args,
});

describe('org directory', () => {
  it('快照：部门按树的先序、同级按 sort', async () => {
    const { departments, employees } = await directory.snapshot();
    assert.deepEqual(
      departments.map((d) => d.id),
      ['1', '4', '2', '3'],
    );
    assert.equal(employees.length, 7);
    assert.deepEqual(employees.find((e) => e.id === '1002')?.roles, []);
  });

  it('members：角色是在职的人；部门含下级部门、不含离职的', async () => {
    assert.deepEqual(await directory.org.members({ role: 'finance' }), ['1007']);
    assert.deepEqual(await directory.org.members({ department: '2' }), [
      '1002',
      '1003',
      '1004',
      '1005',
    ]);
    assert.deepEqual(await directory.org.members({ group: 'x' }), []);
  });

  it('manager：直属上级、隔级上级，离职的跳过', async () => {
    const { manager } = directory.resolvers;
    assert.deepEqual(await manager(contextOf('1004')), ['1003']);
    assert.deepEqual(await manager(contextOf('1004', { levels: 2 })), ['1002']);
    assert.deepEqual(await manager(contextOf('1005')), ['1003']);
    assert.deepEqual(await manager(contextOf('1001')), []);
    assert.deepEqual(
      await manager(contextOf('1001', { field: 'applicant' }, { applicant: '1003' })),
      ['1002'],
    );
  });

  it('departmentHead：负责人是自己时找上级部门的；level 指定第几级部门', async () => {
    const { departmentHead } = directory.resolvers;
    assert.deepEqual(await departmentHead(contextOf('1004')), ['1003']);
    assert.deepEqual(await departmentHead(contextOf('1003')), ['1002']);
    assert.deepEqual(await departmentHead(contextOf('1001')), []);
    // 一级部门（研发）的负责人；本身就在一级部门、根部门的按所在部门
    assert.deepEqual(await departmentHead(contextOf('1004', { level: 1 })), ['1002']);
    assert.deepEqual(await departmentHead(contextOf('1007', { level: 1 })), ['1001']);
  });

  it('actorOf：所在部门连同上级部门；离职的不算', async () => {
    assert.deepEqual(await directory.actorOf('1004'), {
      id: '1004',
      name: '陈',
      roles: [],
      departments: ['3', '2', '1'],
      admin: false,
    });
    assert.equal((await directory.actorOf('1001'))?.admin, true);
    assert.equal(await directory.actorOf('1006'), undefined);
  });

  it('inboxManager：部门收件箱由部门负责人指派', async () => {
    assert.equal(await directory.org.inboxManager?.({ kind: 'department', value: '3' }), '1003');
    assert.equal(await directory.org.inboxManager?.({ kind: 'role', value: 'finance' }), undefined);
  });

  it('接到引擎上：上级审批，研发部会签，下级部门的人也在里面', async () => {
    const { engine } = await createTestEngine({
      adapter,
      org: directory.org,
      extensions: { resolvers: directory.resolvers },
    });
    const definition: ProcessDefinition = {
      key: 'org',
      name: '组织',
      nodes: [
        { id: 'start', type: 'start', name: '发起' },
        {
          id: 'approve',
          type: 'task',
          name: '上级审批',
          assignees: [{ resolver: 'manager' }],
          outcomes: [{ key: 'ok', label: '同意' }],
        },
        {
          id: 'sign',
          type: 'task',
          name: '研发会签',
          multi: { participants: [{ department: '2' }], complete: 'all' },
          outcomes: [{ key: 'ok', label: '同意' }],
        },
        { id: 'end', type: 'end', name: '结束', result: 'approved' },
      ],
      edges: [
        { id: 'e1', from: 'start', to: 'approve' },
        { id: 'e2', from: 'approve', to: 'sign', outcome: 'ok' },
        { id: 'e3', from: 'sign', to: 'end', outcome: 'ok' },
      ],
    };
    await engine.publish(definition);
    const actor = async (id: string) => (await directory.actorOf(id))!;
    const started = await engine.run({ type: 'start', process: 'org' }, await actor('1004'));
    assert.deepEqual(
      started.workItems.map((item) => item.assignee),
      ['1003'],
    );
    const approved = await engine.run(
      { type: 'complete', workItem: started.workItems[0]!.id, outcome: 'ok' },
      await actor('1003'),
    );
    assert.deepEqual(
      approved.workItems.map((item) => item.assignee ?? '').toSorted((a, b) => a.localeCompare(b)),
      ['1002', '1003', '1004', '1005'],
    );
  });
});

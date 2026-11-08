// 流程即 TS 工程：编译、链接（相对路径、宿主模块）、单据并进变量、logic.名字 的引用、版本与回滚、类型检查、带类型的发起
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import { defineForm, type FlowProject } from '@zerodep-dev/flow-ts-model';
import { FlowError, type Actor } from '@zerodep-dev/flow-ts-engine';
import { createTestEngine, runScenarios } from '@zerodep-dev/flow-ts-engine/testing';
import { compileInPlace } from '../src/index.ts';
import { createTypeChecker } from '../src/typecheck.ts';

const alice: Actor = { id: '1001' };
const boss: Actor = { id: '1004' };

const graph = {
  key: 'coded',
  name: '带代码的流程',
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    { id: 'mark', type: 'service', name: '盖章', action: 'logic.stamp', mode: 'sync' },
    {
      id: 'review',
      type: 'task',
      name: '审批',
      assignees: [{ resolver: 'logic.reviewer' }],
      outcomes: [{ key: 'ok', label: '同意', guards: ['logic.budget'] }],
    },
    { id: 'route', type: 'exclusive', name: '大额？' },
    { id: 'large', type: 'end', name: '大额', result: 'large' },
    { id: 'small', type: 'end', name: '小额', result: 'small' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'mark' },
    { id: 'e2', from: 'mark', to: 'review' },
    { id: 'e3', from: 'review', to: 'route', outcome: 'ok' },
    {
      id: 'e4',
      from: 'route',
      to: 'large',
      when: { field: 'fn.logic.big', op: 'eq', value: true },
    },
    { id: 'e5', from: 'route', to: 'small', default: true },
  ],
};

const form = `import { defineForm } from '@zerodep-dev/flow-ts-model';
export default defineForm({
  amount: { type: 'number', label: '金额', required: true },
  stamped: { type: 'boolean', label: '已盖章' },
});
`;

const logic = `import { defineLogic } from '@zerodep-dev/flow-ts-engine';
import { approver } from '@app/org';
import form from './form';
import { LIMIT } from './rules/limits.ts';

export default defineLogic(form, {
  resolvers: { reviewer: () => [approver] },
  guards: { budget: ({ variables }) => (variables.amount > LIMIT ? '超出预算' : true) },
  functions: { big: ({ variables }) => variables.amount > 500 },
  actions: { stamp: () => ({ variables: { stamped: true } }) },
});
`;

const project = (files: Record<string, string> = {}): FlowProject => ({
  files: {
    'process.json': JSON.stringify(graph),
    'form.ts': form,
    'logic.ts': logic,
    'rules/limits.ts': 'export const LIMIT: number = 1000;\n',
    ...files,
  },
});

const modules = {
  '@app/org': { exports: { approver: '1004' }, types: 'export declare const approver: string;\n' },
};

async function rejectsWith(promise: Promise<unknown>, code: string, field?: string) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof FlowError, String(error));
    assert.equal(error.code, code);
    if (field) assert.equal(error.details['field'], field, error.message);
    return true;
  });
}

const scenarios = `import { defineScenarios } from '@zerodep-dev/flow-ts-engine';
import form from './form';

export default defineScenarios(form, {
  '小额走小额': {
    variables: { amount: 100 },
    steps: [{ node: 'review', outcome: 'ok' }],
    expect: { status: 'completed', result: 'small' },
  },
  '发起后等 1004': { variables: { amount: 100 }, expect: { at: ['review'], waitingFor: ['1004'] } },
  '超预算被拦': {
    variables: { amount: 5000 },
    steps: [{ node: 'review', outcome: 'ok' }],
    expect: { error: { step: 1, message: '超出预算' } },
  },
  '写错的期望': { variables: { amount: 100 }, expect: { status: 'completed' } },
});
`;

// 第一个用例要先载入 Babel，全量并行跑时机器忙会超过默认的 5 秒
describe('流程工程', { timeout: 30_000 }, () => {
  it('场景测试：test.ts 的 defineScenarios 逐个试运行、对照期望，写错的期望说出哪里不一样', async () => {
    const results = await runScenarios(project({ 'test.ts': scenarios }), {
      options: { transform: compileInPlace, modules },
    });
    assert.deepEqual(
      results.map((r) => [r.name, r.passed]),
      [
        ['小额走小额', true],
        ['发起后等 1004', true],
        ['超预算被拦', true],
        ['写错的期望', false],
      ],
    );
    assert.deepEqual(results[3]?.problems, ['状态是 active，期望 completed']);
    assert.deepEqual(await runScenarios(project()), []);
  });

  it('处理人、守卫、条件、动作引用 logic.名字；相对路径与宿主模块都能 import；单据的清单内联进定义', async () => {
    const { engine } = await createTestEngine({ transform: compileInPlace, modules });
    await engine.publish(project());
    const [definition] = await engine.query.processes();
    assert.deepEqual(Object.keys(definition?.form?.manifest ?? {}), ['amount', 'stamped']);
    assert.equal(definition?.form?.key, 'coded');
    const started = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 800 } },
      alice,
    );
    assert.equal(started.workItems[0]?.assignee, '1004');
    assert.equal(started.instance.variables['stamped'], true);
    const done = await engine.run(
      { type: 'complete', workItem: started.workItems[0]!.id, outcome: 'ok' },
      boss,
    );
    assert.equal(done.instance.result, 'large');

    const second = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 5000 } },
      alice,
    );
    await rejectsWith(
      engine.run({ type: 'complete', workItem: second.workItems[0]!.id, outcome: 'ok' }, boss),
      'guard-rejected',
    );
  });

  it('写得不对、引用了没有的逻辑、import 了没登记的模块：发布时报 invalid-definition，指出哪里', async () => {
    const { engine } = await createTestEngine({ transform: compileInPlace, modules });
    await rejectsWith(
      engine.publish(project({ 'logic.ts': 'export const = ;' })),
      'invalid-definition',
      'logic.ts',
    );
    await rejectsWith(
      engine.publish(
        project({ 'logic.ts': logic.replace('reviewer: () => [approver]', 'other: () => []') }),
      ),
      'invalid-definition',
    );
    const { engine: bare } = await createTestEngine({ transform: compileInPlace });
    await rejectsWith(bare.publish(project()), 'invalid-definition', '@app/org');
    await rejectsWith(
      engine.publish({ files: { 'form.ts': form } }),
      'invalid-definition',
      'process.json',
    );
  });

  it('版本：列出、取某版的工程、回滚成新版本；运行中的实例留在自己的版本上', async () => {
    const { engine } = await createTestEngine({ transform: compileInPlace, modules });
    await engine.publish(project(), { actor: alice, note: '第一版' });
    const first = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 100 } },
      alice,
    );
    const changed = logic.replace('[approver]', "['2002']");
    await engine.publish(project({ 'logic.ts': changed }), { note: '换审批人' });
    const second = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 100 } },
      alice,
    );
    assert.equal(second.workItems[0]?.assignee, '2002');

    await engine.versions.rollback('coded', 1, { actor: boss });
    const list = await engine.versions.list('coded');
    assert.deepEqual(
      list.map((v) => [v.version, v.note]),
      [
        [3, '回滚到第 1 版'],
        [2, '换审批人'],
        [1, '第一版'],
      ],
    );
    assert.equal((await engine.versions.project('coded', 2)).files['logic.ts'], changed);
    const third = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 100 } },
      alice,
    );
    assert.equal(third.workItems[0]?.assignee, '1004');
    // 第一版发起的实例照旧按第一版的逻辑走
    const done = await engine.run(
      { type: 'complete', workItem: first.workItems[0]!.id, outcome: 'ok' },
      boss,
    );
    assert.equal(done.instance.result, 'small');
  });

  it('带单据类型的发起：变量按单据推出的类型', async () => {
    const purchase = defineForm({
      amount: { label: '金额', type: 'number', required: true },
      stamped: { label: '已盖章', type: 'boolean' },
    });
    const { engine } = await createTestEngine({ transform: compileInPlace, modules });
    await engine.publish(project());
    const coded = engine.process<typeof purchase>('coded');
    const started = await coded.start({ variables: { amount: 900 } }, alice);
    // @ts-expect-error amount 是数字
    void (() => coded.start({ variables: { amount: '900' } }, alice));
    // @ts-expect-error amount 必填
    void (() => coded.start({ variables: {} }, alice));
    const done = await coded.complete(
      { workItem: started.workItems[0]!.id, outcome: 'ok', variables: { stamped: false } },
      boss,
    );
    assert.equal(done.instance.result, 'large');
  });

  it('类型检查：有类型错误不让发布，指出文件与行；宿主模块按登记的声明检查', async () => {
    // 从引擎包的目录解析 node_modules；仓库里按源码解析各包
    const checkTypes = createTypeChecker({
      root: fileURLToPath(new URL('..', import.meta.url)),
      compilerOptions: { customConditions: ['@vue-tsx-pro/source'] },
    });
    const { engine } = await createTestEngine({ transform: compileInPlace, modules, checkTypes });
    await engine.publish(project());
    await assert.rejects(
      engine.publish(project({ 'rules/limits.ts': "export const LIMIT: number = '1000';\n" })),
      (error: unknown) => {
        assert.ok(error instanceof FlowError);
        const [problem] = error.details['types'] as { file: string; line: number }[];
        assert.deepEqual([problem?.file, problem?.line], ['rules/limits.ts', 1]);
        return true;
      },
    );
    await assert.rejects(
      engine.publish(
        project({ 'logic.ts': logic.replace('variables.amount > 500', 'variables.amount.length') }),
      ),
      (error: unknown) =>
        error instanceof FlowError &&
        (error.details['types'] as { file: string }[]).some((p) => p.file === 'logic.ts'),
    );
  });
});

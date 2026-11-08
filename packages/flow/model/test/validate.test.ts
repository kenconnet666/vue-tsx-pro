import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  validateProcess,
  type FormManifest,
  type ProcessDefinition,
  type Problem,
  type ValidationContext,
  templates,
} from '../src/index.ts';
import { listSpec, readSpec } from './spec.ts';

/** spec/definitions 里一份样例 */
interface DefinitionSpec {
  name: string;
  definition: ProcessDefinition;
  form?: FormManifest;
  /** 发布时才有的外部信息：注册了哪些扩展、有哪些流程、谁调用谁、有哪些日历 */
  context?: {
    registered?: Partial<Record<string, string[]>>;
    processes?: string[];
    calls?: Record<string, string[]>;
    calendars?: string[];
  };
  expect: Problem[];
}

/** 样例里的 context → 校验上下文；Java 一侧按同样的规则构造 */
export function contextOf(sample: DefinitionSpec): ValidationContext {
  const c = sample.context;
  return {
    ...(sample.form ? { form: sample.form } : {}),
    ...(c?.registered
      ? {
          isRegistered: (kind: string, name: string) => c.registered![kind]?.includes(name) ?? true,
        }
      : {}),
    ...(c?.processes ? { processExists: (key: string) => c.processes!.includes(key) } : {}),
    ...(c?.calls ? { callsOf: (key: string) => c.calls![key] ?? [] } : {}),
    ...(c?.calendars ? { calendarExists: (name: string) => c.calendars!.includes(name) } : {}),
  };
}

/** 比较时不看先后：每个问题写成固定键序的 JSON 再排序 */
const normalize = (problems: readonly Problem[]) =>
  problems
    .map((p) =>
      JSON.stringify([
        p.code,
        p.severity,
        p.node ?? null,
        p.edge ?? null,
        p.lane ?? null,
        p.params ?? null,
      ]),
    )
    .sort();

describe('定义的校验（spec/definitions）', () => {
  for (const file of listSpec('definitions')) {
    const sample = readSpec<DefinitionSpec>(`definitions/${file}`);
    it(`${file}：${sample.name}`, () => {
      const actual = validateProcess(sample.definition, contextOf(sample));
      if (process.env.FLOW_SPEC_PRINT) console.log(file, JSON.stringify(actual, null, 1));
      assert.deepEqual(normalize(actual), normalize(sample.expect));
    });
  }
});

describe('单据的字段也是流程变量', () => {
  it('标题模板、条件不写 form. 也认得清单里的字段；不存在的照样报 ref-unknown', () => {
    const base = templates.leave();
    const definition = {
      ...base,
      variables: [],
      title: '{kind}：{days} 天',
      form: {
        key: 'leave',
        manifest: {
          kind: { label: '类型', type: 'text' },
          days: { label: '天数', type: 'number' },
        },
      },
    } as const;
    const refs = (d: typeof definition | Record<string, unknown>) =>
      validateProcess(d as never)
        .filter((p) => p.code === 'ref-unknown')
        .map((p) => p.params?.['ref']);
    assert.deepEqual(refs(definition), []);
    assert.deepEqual(refs({ ...definition, title: '{missing}' }), ['missing']);
  });
});

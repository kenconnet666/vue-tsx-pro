// 字段清单写回 form.ts：prettier 风格的字面量，读回来是同一份清单
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { describe, it } from 'vitest';
import { formFileSource, type FormManifest } from '../src/index.ts';

const manifest: FormManifest = {
  title: { label: '合同名称', type: 'text', required: true, maxLength: 100 },
  kind: {
    label: '类型',
    type: 'select',
    options: [
      { value: 'buy', label: '采购' },
      { value: 'sell', label: "销售（含'代销'）" },
    ],
  },
  plans: {
    label: '付款计划',
    type: 'list',
    minItems: 1,
    fields: {
      amount: { label: '金额', type: 'decimal', required: true, min: '0.01', scale: 2 },
    },
  },
  'cost-center': { label: '成本中心', type: 'text' },
};

describe('formFileSource', () => {
  it('写成 defineForm 的字面量：短的一行，长的分行，键能不加引号就不加', () => {
    assert.equal(
      formFileSource(manifest),
      `import { defineForm } from '@zerodep-dev/flow-ts-model';

export default defineForm({
  title: { label: '合同名称', type: 'text', required: true, maxLength: 100 },
  kind: {
    label: '类型',
    type: 'select',
    options: [
      { value: 'buy', label: '采购' },
      { value: 'sell', label: '销售（含\\'代销\\'）' },
    ],
  },
  plans: {
    label: '付款计划',
    type: 'list',
    minItems: 1,
    fields: { amount: { label: '金额', type: 'decimal', required: true, min: '0.01', scale: 2 } },
  },
  'cost-center': { label: '成本中心', type: 'text' },
});
`,
    );
  });

  it('读回来（当 JS 求值）是同一份清单', () => {
    const literal = formFileSource(manifest)
      .replace(/^import[^\n]*\n\nexport default defineForm/, '')
      .replace(/;\n$/, '');
    // 另一个上下文里求值：对象的原型不同，按 JSON 比
    assert.deepEqual(JSON.parse(JSON.stringify(runInNewContext(literal))), manifest);
  });
});

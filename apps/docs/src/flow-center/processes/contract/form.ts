// 合同的单据：字段清单（表单设计器读写的就是它），推出单据的类型给 logic.ts 用
import { defineForm } from '@zerodep-dev/flow-ts-model';

export default defineForm({
  title: { label: '合同名称', type: 'text', required: true, maxLength: 100 },
  counterparty: { label: '相对方', type: 'text', required: true, maxLength: 100 },
  amount: { label: '合同金额', type: 'decimal', required: true, min: '0', scale: 2 },
  signOn: { label: '签订日期', type: 'date' },
  plans: {
    label: '付款计划',
    type: 'list',
    minItems: 1,
    fields: {
      label: { label: '期次', type: 'text', required: true, maxLength: 50 },
      amount: { label: '金额', type: 'decimal', required: true, min: '0.01', scale: 2 },
      due: { label: '付款日', type: 'date' },
    },
  },
  files: { label: '合同文本', type: 'file', maxCount: 5 },
});

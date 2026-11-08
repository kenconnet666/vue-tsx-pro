// 合同的场景测试：工作室的“测试”页签里跑；每个场景从发起开始一步步试运行，对照期望
import { defineScenarios } from '@zerodep-dev/flow-ts-engine';
import form from './form';

const base = { title: '设计软件许可', counterparty: '北方办公', signOn: '2026-11-20' };

export default defineScenarios(form, {
  '付款计划对不上：财务审核通过被守卫拦下': {
    initiator: '1016',
    variables: { ...base, amount: '50000.00', plans: [{ label: '一次付清', amount: '40000.00' }] },
    steps: [
      { node: 'head', outcome: 'approve' },
      { node: 'finance', outcome: 'approve' },
    ],
    expect: { error: { step: 2, message: '付款计划合计' } },
  },
  '小额合同：会审、归档后按计划发起付款，合同生效': {
    initiator: '1016',
    variables: {
      ...base,
      amount: '60000.00',
      plans: [
        { label: '首付', amount: '30000.00' },
        { label: '尾款', amount: '30000.00' },
      ],
    },
    steps: [
      { node: 'head', outcome: 'approve' },
      // 法务会签：法务部两个人各同意一次
      { node: 'legal', outcome: 'approve' },
      { node: 'legal', outcome: 'approve' },
      { node: 'finance', outcome: 'approve' },
      { node: 'archive', outcome: 'approve' },
    ],
    expect: { status: 'completed', result: 'approved' },
  },
  '相对方是停用的供应商：部门负责人同意被守卫拦下（读业务库）': {
    initiator: '1016',
    variables: {
      ...base,
      counterparty: '西部线缆',
      amount: '8000.00',
      plans: [{ label: '一次付清', amount: '8000.00' }],
    },
    steps: [{ node: 'head', outcome: 'approve' }],
    expect: { error: { step: 1, message: '已停用' } },
  },
  '部门负责人审批：郑可的合同到采购经理吴昊': {
    initiator: '1016',
    variables: { ...base, amount: '60000.00', plans: [{ label: '一次付清', amount: '60000.00' }] },
    expect: { at: ['head'], waitingFor: ['1015'] },
  },
});

// 合同的逻辑：process.json 里按 logic.名字 引用；variables 的类型从 form.ts 推出
import { defineLogic } from '@zerodep-dev/flow-ts-engine';
import form from './form';

/** 金额是两位小数的文字：换成分再加，不受浮点误差影响 */
const cents = (value: string | undefined) => Math.round(Number(value ?? 0) * 100);

export default defineLogic(form, {
  guards: {
    // 财务审核通过前：付款计划逐期加起来要等于合同金额
    plansMatch: ({ variables }) => {
      const total = variables.plans.reduce(
        (sum, plan) => sum + cents((plan as { amount?: string }).amount),
        0,
      );
      const expected = cents(variables.amount);
      return total === expected
        ? true
        : `付款计划合计 ${(total / 100).toFixed(2)}，与合同金额 ${(expected / 100).toFixed(2)} 不一致`;
    },
  },
});

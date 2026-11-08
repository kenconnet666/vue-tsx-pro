// 合同的逻辑：process.json 里按 logic.名字 引用；variables 的类型从 form.ts 推出。
// @app/business 是流程中心登记的宿主模块（业务库的供应商、物料、预算）
import { supplierByName } from '@app/business';
import { defineLogic } from '@zerodep-dev/flow-ts-engine';
import form from './form';

/** 金额是两位小数的文字：换成分再加，不受浮点误差影响 */
const cents = (value: string | undefined) => Math.round(Number(value ?? 0) * 100);

export default defineLogic(form, {
  guards: {
    // 部门负责人同意前：相对方是停用的供应商（资质过期、黑名单）就不能签
    counterpartyAllowed: async ({ variables }) => {
      const found = await supplierByName(variables.counterparty ?? '');
      return found?.blocked ? `相对方 ${found.name} 已停用：${found.blockedReason ?? ''}` : true;
    },
    // 财务审核通过前：付款计划逐期加起来要等于合同金额
    plansMatch: ({ variables }) => {
      const total = (variables.plans ?? []).reduce((sum, plan) => sum + cents(plan.amount), 0);
      const expected = cents(variables.amount);
      return total === expected
        ? true
        : `付款计划合计 ${(total / 100).toFixed(2)}，与合同金额 ${(expected / 100).toFixed(2)} 不一致`;
    },
  },
});

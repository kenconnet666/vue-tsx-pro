// 两个编辑页（单机降本、降 DMC）共用的字段规则：基本信息、降本信息与技术实施的公共部分，
// 以及“选了哪种降本类型就要填对应的预期收益”
import { decimalSchema } from '@vue-tsx-pro/ui';
import * as z from 'zod';

/** 金额：≥0、两位小数，可以先不填 */
const amount = decimalSchema({ min: 0, scale: 2 }).nullable();

/** 两个编辑页都有的字段 */
export const taskFields = {
  name: z.string().min(1, '请填写项目名称').max(200, '项目名称不超过 200 字'),
  org: z.string().min(1, '请选择提出单位'),
  contact: z.string().min(1, '请选择联络人'),
  team: z.string().min(1, '请选择责任一级团队'),
  install: z.string().min(1, '请选择必装或选装'),
  types: z.array(z.string()).min(1, '至少选一种降本类型'),
  unitSaving: amount,
  dmcSaving: amount,
  description: z
    .string()
    .min(
      20,
      '写明更改内容、降本金额计算依据、材料降本、工时降本，并填三级项目建议书编号或计算方法',
    ),
  modelNo: z.string().regex(/^$|^\S+ R\d+$/, '按“编号 + 版本”填写，如 C1H02-5513-002 R03'),
  flights: z.number().int().min(0, '贯彻架次不能小于 0').nullable(),
  form: z.string().min(1, '请选择完成形式'),
  suppliers: z.array(z.string()),
  plan: z.string(),
  remark: z.string().max(1000, '备注不超过 1000 字'),
};

/** 条件必填（在 superRefine 里调用）：选了哪种降本类型就要填对应的预期收益 */
export function checkSavings(
  values: { types: string[]; unitSaving: unknown; dmcSaving: unknown },
  ctx: z.RefinementCtx,
) {
  if (values.types.includes('unit') && values.unitSaving == null)
    ctx.addIssue({ code: 'custom', path: ['unitSaving'], message: '降本类型含单机降本时必填' });
  if (values.types.includes('dmc') && values.dmcSaving == null)
    ctx.addIssue({ code: 'custom', path: ['dmcSaving'], message: '降本类型含降 DMC 时必填' });
}

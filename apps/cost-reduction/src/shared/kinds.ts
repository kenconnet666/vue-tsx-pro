/**
 * 两种降本类型的显示：名称、编码列的表头、金额的单位与格式（显示与输入共用）。
 * 单机降本存的是元、按万元显示；降 DMC 是美元 / FH。一个视图里只有一种单位，不混着相加
 */
import type { CostKind } from '../domain/task/types';

/** 两种降本类型的显示 */
export const costKinds = {
  unit: {
    label: '单机降本',
    codeHeader: '降本项目编码',
    unit: '万元',
    format: { scale: 10_000, minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
  dmc: {
    label: '降 DMC',
    codeHeader: '项目编码',
    unit: '美元/FH',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
} as const satisfies Record<CostKind, unknown>;

/** 两种降本类型（切换项的先后） */
export const costKindKeys: readonly CostKind[] = ['unit', 'dmc'];

/** 元：明细里的单件、单机金额（两位小数，不缩放） */
export const yuanFormat = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

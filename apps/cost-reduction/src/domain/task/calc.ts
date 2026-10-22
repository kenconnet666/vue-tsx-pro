/**
 * 单机降本明细的收益计算（单机降本明细表）：费用与收益都由系统算出，不允许手工修改。
 *   单件材料费 = 单件材料定额 × 材料单价；单件工时费 = 单件工时定额 × 费率；
 *   单件价格 = 材料费 + 工时费；单机价格 = 单件价格 × 单机数量；
 *   各项收益 = 更改前 − 更改后
 */
import Decimal from 'decimal.js';
import type { PartChange, PartSide, UnitDetail } from './types';

/** 一个零件的费用（元） */
export interface PartCost {
  /** 单件材料费 */
  material: Decimal;
  /** 单件工时费 */
  labor: Decimal;
  /** 单件价格 */
  unit: Decimal;
  /** 单机价格 */
  aircraft: Decimal;
}

/** 一条更改的收益（元） */
export interface PartSaving {
  /** 单件材料费收益 */
  material: Decimal;
  /** 单件工时费收益 */
  labor: Decimal;
  /** 单件零件收益 */
  part: Decimal;
  /** 单机零件收益 */
  aircraft: Decimal;
}

const zero = new Decimal(0);

/** 一个零件的费用；没有这一边（取消没有更改后、新增没有更改前）时都是 0 */
export function partCost(side: PartSide | null): PartCost {
  if (!side) return { material: zero, labor: zero, unit: zero, aircraft: zero };
  const material = side.quota.times(side.materialPrice);
  const labor = side.laborHours.times(side.laborRate);
  const unit = material.plus(labor);
  return { material, labor, unit, aircraft: unit.times(side.quantity) };
}

/** 一条更改的收益：更改前 − 更改后 */
export function partSaving(change: PartChange): PartSaving {
  const before = partCost(change.before);
  const after = partCost(change.after);
  return {
    material: before.material.minus(after.material),
    labor: before.labor.minus(after.labor),
    part: before.unit.minus(after.unit),
    aircraft: before.aircraft.minus(after.aircraft),
  };
}

/** 各条更改的单机零件收益之和（元）：单机降本的预期收益由它算出 */
export const totalSaving = (parts: readonly PartChange[]) =>
  parts.reduce((total, change) => total.plus(partSaving(change).aircraft), zero);

/** 单机降本明细的单机零件收益合计（元） */
export const unitSaving = (detail: UnitDetail) => totalSaving(detail.parts);

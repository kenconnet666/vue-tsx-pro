/**
 * 降本项目编码：单机降本是“DJ-完成年度-团队拼音缩写-序号”，降 DMC 是“DMC-完成年度-团队拼音缩写-序号”。
 * 系统生成，不允许手工修改；序号在全部项目里递增，不按年度、团队重新开始
 */
import type { CostKind } from './types';

/** 编码的前缀 */
export const taskCodePrefix = (kind: CostKind) => (kind === 'unit' ? 'DJ' : 'DMC');

/** 编码是哪种降本类型：DMC 开头是降 DMC，其余是单机降本 */
export const kindOfCode = (code: string): CostKind => (code.startsWith('DMC-') ? 'dmc' : 'unit');

/** 编码里的序号 */
export const taskSerial = (code: string) => Number(code.split('-').at(-1)) || 0;

/** 拼出编码 */
export const formatTaskCode = (kind: CostKind, year: string, teamCode: string, serial: number) =>
  `${taskCodePrefix(kind)}-${year}-${teamCode}-${serial}`;

/** 新项目的编码：序号接在已有编码的最大序号后面 */
export function nextTaskCode(
  existing: readonly string[],
  kind: CostKind,
  year: string,
  teamCode: string,
): string {
  const serial = existing.reduce((max, code) => Math.max(max, taskSerial(code)), 0) + 1;
  return formatTaskCode(kind, year, teamCode, serial);
}

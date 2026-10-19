/**
 * 选择模型：单选、多选怎样响应“点了一项”。纯函数，ToggleGroup 用；以后的 Select、Menu 的复选组、Table 的行选择也用它。
 */

/** 选择方式 */
export interface SelectionModes {
  /** 单选：选中一项会取消其他项；再点已选的项取消选中（required 时不取消） */
  single: unknown;
  /** 多选：每项独立切换 */
  multiple: unknown;
}

/** toggleSelection 的选项 */
export interface SelectionOptions {
  /** 选择方式 */
  mode: keyof SelectionModes;
  /** 至少保留一项：最后一个已选项不能被取消 */
  required?: boolean;
}

/** 点了 key 之后的选择；没有变化时返回原数组 */
export function toggleSelection<Key>(
  selected: readonly Key[],
  key: Key,
  { mode, required = false }: SelectionOptions,
): readonly Key[] {
  const isSelected = selected.includes(key);
  if (mode === 'single') {
    if (!isSelected) return [key];
    return required ? selected : [];
  }
  if (!isSelected) return [...selected, key];
  if (required && selected.length === 1) return selected;
  return selected.filter((item) => item !== key);
}

/**
 * 选择模型：单选、多选怎样响应“点了一项”（纯函数），以及单选 / 多选组件共用的 props。
 * ToggleGroup、Listbox、Select、Combobox、CheckboxGroup、DataTable 的行选择都用它。
 */

/** 选择方式 */
export interface SelectionModes {
  /** 单选：选中一项会取消其他项；再点已选的项取消选中（required 时不取消） */
  single: unknown;
  /** 多选：每项独立切换 */
  multiple: unknown;
}

/** 单选：value 是选中项的值 */
export interface SingleSelectionProps {
  /** 选择方式，默认 single */
  selectionMode?: Extract<keyof SelectionModes, 'single'>;
  /** 选中项：父级写 value={_bind(x)} */
  value?: string;
}

/** 多选：value 是选中项的值的数组 */
export interface MultipleSelectionProps {
  /** 选择方式 */
  selectionMode: Extract<keyof SelectionModes, 'multiple'>;
  /** 选中项：父级写 value={_bind(list)} */
  value?: string[];
}

/** 单选或多选：按 selectionMode 区分 value 是一个值还是数组（Listbox、Select、ToggleGroup） */
export type SelectionProps = SingleSelectionProps | MultipleSelectionProps;

/** toggleSelection 的选项 */
export interface SelectionOptions {
  /** 选择方式 */
  mode: keyof SelectionModes;
  /** 至少保留一项：最后一个已选项不能被取消 */
  required?: boolean;
}

/** 单选的值或多选的值数组 → 已选值的数组（单选、多选共用一套渲染与列表状态时） */
export const selectedValues = (value: string | readonly string[] | undefined): readonly string[] =>
  typeof value === 'string' ? [value] : (value ?? []);

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

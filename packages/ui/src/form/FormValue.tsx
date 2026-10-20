/**
 * 把不是原生输入元素的控件的值交给表单：渲染隐藏的 input（type="hidden"），随表单提交、被 FormData 读到。
 * Slider、Select、Combobox 用它；数组时每个值一个 input（同名，服务端按多值读取）。
 *
 *   <FormValue name="tags" value={['a', 'b']} />   →   <input type="hidden" name="tags" value="a">…
 *
 * 没有 name、或值为 null / undefined 时不渲染。
 */
import { _component } from '@vue-tsx-pro/tsx';

/** FormValue 的属性 */
export interface FormValueProps {
  /** 表单字段名；不写时不渲染 */
  name?: string;
  /** 值；数组时每个值一个 input */
  value?: string | number | readonly (string | number)[] | null;
}

/** 隐藏的表单值（input type="hidden"） */
export const FormValue = _component(({ name, value }: FormValueProps) => () => {
  if (name == null || value == null) return null;
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => <input key={String(item)} type="hidden" name={name} value={item} />);
});

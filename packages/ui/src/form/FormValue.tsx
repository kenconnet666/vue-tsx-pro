/**
 * 把不是原生输入元素的控件的值交给表单：渲染隐藏的 input（type="hidden"），随表单提交、被 FormData 读到。
 * Slider、Select、Combobox、NumberField、日期组件用它；数组时每个值一个 input（同名，服务端按多值读取）。
 *
 *   <FormValue name="tags" value={['a', 'b']} />   →   <input type="hidden" name="tags" value="a">…
 *   <FormValue name="price" value={new Decimal('19.90')} />   →   value="19.9"
 *
 * 内置的值类型都按规范文本提交（formValueText）：数字（number、bigint、Decimal）是不带分组、不用科学计数法的十进制；
 * 原生 Date 是 ISO 时间（UTC），@internationalized/date 的日期值是它自己的 ISO 文本（2026-10-20、2026-10-20T14:30:00）。
 * 没有 name、值为 null / undefined、或控件不可用（disabled，同原生的不可用控件不随表单提交）时不渲染。
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { DateValue } from '@internationalized/date';
import { isNumeric, numericText, type NumericValue } from '../utils/data/numeric';

/** 能交给表单的单个值 */
export type FormValueItem = string | boolean | NumericValue | Date | DateValue;

/** FormValue 的属性 */
export interface FormValueProps {
  /** 表单字段名；不写时不渲染 */
  name?: string;
  /** 值；数组时每个值一个 input */
  value?: FormValueItem | readonly FormValueItem[] | null;
  /** 控件不可用：同原生的不可用控件，不随表单提交 */
  disabled?: boolean;
}

/** 值 → 提交的文本：数字是十进制，日期是 ISO */
export function formValueText(value: FormValueItem): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return String(value);
  if (isNumeric(value)) return numericText(value);
  if (value instanceof Date) return value.toISOString();
  // DateValue 的 toString 就是 ISO 8601（含时区的 ZonedDateTime 带上偏移与时区名）
  return value.toString();
}

/** 隐藏的表单值（input type="hidden"） */
export const FormValue = _component(({ name, value, disabled = false }: FormValueProps) => () => {
  if (name == null || value == null || disabled) return null;
  const texts = (Array.isArray(value) ? value : [value]).map((item) => formValueText(item));
  // 同一个值可能出现两次（数组里重复的项）：key 带上下标
  return texts.map((text, index) => (
    <input key={`${index}:${text}`} type="hidden" name={name} value={text} />
  ));
});

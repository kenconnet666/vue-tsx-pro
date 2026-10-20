/**
 * 日期输入框：分段输入年、月、日（不带弹层），段的顺序按语言（zh-CN 年/月/日，en-US 月/日/年）。
 * 参考 React Aria DateField、原生 input type="date"。要弹出日历用 DatePicker。
 *
 *   <Field label="生日"><DateField value={_bind(birthday)} max={today} /></Field>
 *   <DateField granularity="minute" value={_bind(at)} aria-label="开始时间" />   // '2026-10-20T14:30'
 *   <DateField granularity="month" value={_bind(month)} aria-label="账期" />     // '2026-10'
 *
 * 值是 ISO 字符串，形式随 granularity：year 'YYYY'、month 'YYYY-MM'、day 'YYYY-MM-DD'，
 * hour / minute / second 是日期加时间 'YYYY-MM-DDTHH:mm[:ss]'（同原生 datetime-local）。
 * 值在 min–max 之外、或是不可选的日期时显示出错（aria-invalid），值照样写回，由表单校验决定能不能提交。
 *
 * 键盘：数字逐段输入（满了自动跳段），↑↓ 加减，Page Up / Down 大步，Home / End 最小 / 最大，
 * Backspace 删一位（删空回到上一段），←→ 与 Tab 换段。部件见 SegmentedField。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { isDateDisabled, type DateUnit } from '../utils/data/date';
import { toDateLimits, useDateLocale, type DateLimitProps } from './date-locale';
import { segmentFields, type DateFieldGranularity } from './date-segments';
import { SegmentedField, type SegmentedFieldOptions } from './SegmentedField';

/** 未声明的属性落到这组分段上（主元素）；外壳用 propsRoot */
export interface DateFieldProps extends SegmentedFieldOptions, DateLimitProps {
  /** 值（ISO 字符串，形式随 granularity）：父级写 value={_bind(x)}；没填全时 null */
  value?: string | null;
  /** 精确到哪一段，默认 day；到 hour / minute / second 时是日期加时间 */
  granularity?: DateFieldGranularity;
}

/** 日期输入框：分段输入 */
export const DateField = _component(
  ({
    value = _bindable<string | null>(null),
    granularity = 'day',
    min,
    max,
    isDateUnavailable,
    ...rest
  }: DateFieldProps) => {
    const locale = useDateLocale();
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    const unit = (): DateUnit =>
      granularity === 'year' || granularity === 'month' ? granularity : 'day';
    // 只按日期部分比较：'2026' 与 '2026-10' 补成 1 日，日期时间取前 10 位
    const outOfRange = (iso: string) => {
      const day =
        iso.length === 4 ? `${iso}-01-01` : iso.length === 7 ? `${iso}-01` : iso.slice(0, 10);
      const date = locale.fromIso(day);
      return date != null && isDateDisabled(date, limits, unit());
    };
    return () => (
      <SegmentedField
        {...rest}
        value={_bind(value)}
        fields={segmentFields(granularity)}
        outOfRange={outOfRange}
      />
    );
  },
);

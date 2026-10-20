/**
 * 时间输入框：分段输入时、分（可选秒），12 / 24 小时制跟随语言（zh-CN 24 小时，en-US 12 小时加 AM / PM），也可以用 hourCycle 指定。
 * 参考 React Aria TimeField、原生 input type="time"。要弹出时、分列表用 TimePicker。
 *
 *   <Field label="提醒时间"><TimeField value={_bind(time)} /></Field>
 *   <TimeField granularity="second" hourCycle="h12" value={_bind(at)} aria-label="打卡时间" />
 *
 * 值是 'HH:mm'（granularity 为 second 时 'HH:mm:ss'），时总是 24 小时制，与原生 input type="time" 一致；
 * 也可以是 @internationalized/date 的 Time，写回时保持同一种类型。
 * 键盘同 DateField；12 小时制时在上午 / 下午那段打 a、p 切换。部件见 SegmentedField。
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { Time } from '@internationalized/date';
import { parseIsoTime, toIsoTime } from '../utils/data/date';
import type { DateValueTypes } from './date-locale';
import { segmentFields } from './date-segments';
import { SegmentedField, type SegmentedFieldOptions } from './SegmentedField';

/** 时间精确到哪一段 */
export interface TimeFieldGranularities {
  /** 只有时：'14:00' */
  hour: unknown;
  /** 时分（默认）：'14:30' */
  minute: unknown;
  /** 时分秒：'14:30:15' */
  second: unknown;
}

/** 时间输入框接受的值：'HH:mm[:ss]' 字符串，或 @internationalized/date 的 Time */
export type TimeInput = string | Time;

/** 未声明的属性落到这组分段上（主元素）；外壳用 propsRoot */
export interface TimeFieldProps<V extends TimeInput = string> extends SegmentedFieldOptions {
  /** 值（'HH:mm' 或 'HH:mm:ss'，24 小时制；或 Time，写回时保持同一种类型）：父级写 value={_bind(x)}；没填全时 null */
  value?: V | null;
  /** 值为空、推不出类型时写回哪一种，默认 iso（字符串）；dateValue 写 Time */
  valueType?: keyof DateValueTypes;
  /** 精确到哪一段，默认 minute */
  granularity?: keyof TimeFieldGranularities;
  /** 最早的时间（'09:00' 或 Time）：早于它显示出错 */
  min?: TimeInput;
  /** 最晚的时间（'18:00' 或 Time）：晚于它显示出错 */
  max?: TimeInput;
}

/** 时间输入框：分段输入 */
export const TimeField = _component(
  <V extends TimeInput>({
    value = _bindable<V | null>(null),
    granularity = 'minute',
    valueType = 'iso',
    min,
    max,
    ...rest
  }: TimeFieldProps<V>) => {
    const toTime = (input: TimeInput | undefined) =>
      typeof input === 'string' || input == null ? parseIsoTime(input) : input;
    const outOfRange = (iso: string) => {
      const time = parseIsoTime(iso);
      const low = toTime(min);
      const high = toTime(max);
      return (
        time != null &&
        ((low != null && time.compare(low) < 0) || (high != null && time.compare(high) > 0))
      );
    };
    const iso = _derived(
      value == null || typeof value === 'string'
        ? value
        : toIsoTime(value, granularity === 'second'),
    );
    // 值清空后再填：仍按清空前的类型写回
    let lastLike: V | undefined;
    function write(next: string | null) {
      lastLike = value ?? lastLike;
      const asTime = lastLike != null ? typeof lastLike !== 'string' : valueType === 'dateValue';
      value = (next != null && asTime ? parseIsoTime(next) : next) as V | null;
    }
    return () => (
      <SegmentedField
        {...rest}
        {...{ 'onUpdate:value': write }}
        value={iso}
        fields={segmentFields(granularity, true)}
        outOfRange={outOfRange}
      />
    );
  },
);

/**
 * 会滚动的数字（span）：值变化时从旧值过渡到新值（useTween），按当前语言格式化，等宽数字不抖动。
 * 统计卡片的数值、金额、百分比、计数器。
 *
 *   <AnimatedNumber value={revenue} format={{ style: 'currency' }} />
 *   <AnimatedNumber value={0.123} format={{ style: 'percent', maximumFractionDigits: 1 }} trend prefix="较上周 " />
 *
 * 读屏只读终值：滚动中的数字对读屏隐藏，旁边有一份隐藏的终值文字。需要播报变化时在外层加 aria-live。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { VisuallyHidden, type VisuallyHiddenProps } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { useTween, type TweenOptions } from '../utils/motion/tween';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import type { StyleTable } from '../utils/style/styles';
import { toneStyles, type Tone } from '../utils/style/typography';

/** 未声明的属性落到外层 span 上；原生的 prefix 属性（RDFa）让给前缀内容 */
export interface AnimatedNumberProps extends PartProps<'span', 'prefix'> {
  /** 数值 */
  value: number;
  /** 格式（Intl.NumberFormat 的选项）：金额 `{ style: 'currency' }`（币种默认取语言包）、百分比 `{ style: 'percent' }` */
  format?: Intl.NumberFormatOptions;
  /** 过渡的时长档位，默认 lg */
  duration?: TweenOptions['duration'];
  /** 挂载时从这个值滚到 value；不给时直接显示 value */
  from?: number;
  /** 按正负着色：正数成功色、负数危险色（涨跌）；data-trend 写 up / down / flat */
  trend?: boolean;
  /** 文字色调；给了 trend 时由正负决定 */
  tone?: Tone;
  /** 数字前的内容（如“¥”以外的说明文字、图标） */
  prefix?: VNodeChild;
  /** 数字后的内容（如单位“人”） */
  suffix?: VNodeChild;
  /** 前缀的部件属性 */
  propsPrefix?: PartProps<'span'>;
  /** 后缀的部件属性 */
  propsSuffix?: PartProps<'span'>;
  /** 滚动中的数字（对读屏隐藏）的部件属性 */
  propsValue?: PartProps<'span', 'aria-hidden'>;
  /** 给读屏的终值文字的部件属性 */
  propsLabel?: Partial<VisuallyHiddenProps>;
}

/** AnimatedNumber 的样式：root */
export const animatedNumberStyles: StyleTable<'root'> = stylex.create({
  // 等宽数字：滚动时宽度不跳
  root: { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
});

/** 终值的小数位数：滚动中的值按它取整，整数不会滚出一串小数 */
function decimals(value: number) {
  const text = String(value);
  if (text.includes('e-')) return Math.min(20, Number(text.split('e-')[1]));
  return text.split('.')[1]?.length ?? 0;
}

/** 会滚动的数字：值变化时过渡，读屏只读终值 */
export const AnimatedNumber = _component(
  ({
    value,
    format,
    duration = 'lg',
    from,
    trend = false,
    tone,
    prefix,
    suffix,
    propsPrefix,
    propsSuffix,
    propsValue,
    propsLabel,
    ...rest
  }: AnimatedNumberProps) => {
    const lang = useLang();
    const formatter = useFormat();
    const tween = useTween(() => value, { duration: _untrack(duration), from: _untrack(from) });

    const text = (number: number) =>
      formatter.number(
        number,
        format?.style === 'currency' && !format.currency
          ? { ...format, currency: lang.currency }
          : (format ?? {}),
      );

    return () => {
      const places = 10 ** decimals(value);
      const shown = Math.round(tween.current * places) / places;
      const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
      const color = trend
        ? ({ up: 'success', down: 'danger', flat: tone } as const)[direction]
        : tone;
      return (
        <span
          {...elementProps(
            mergeProps<'span'>(
              { sx: [animatedNumberStyles.root, color && toneStyles[color]] },
              rest,
            ),
          )}
          data-trend={trend ? direction : undefined}
        >
          {prefix != null && (
            <span {...elementProps(mergeProps<'span'>({}, propsPrefix))}>{prefix}</span>
          )}
          <span {...elementProps(mergeProps<'span'>({}, propsValue, { 'aria-hidden': true }))}>
            {text(shown)}
          </span>
          <VisuallyHidden {...mergePartProps<VisuallyHiddenProps>({}, propsLabel)}>
            {text(value)}
          </VisuallyHidden>
          {suffix != null && (
            <span {...elementProps(mergeProps<'span'>({}, propsSuffix))}>{suffix}</span>
          )}
        </span>
      );
    };
  },
);

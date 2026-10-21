/**
 * 进度条（role="progressbar"）。有 value 时显示完成比例；没有 value（null / undefined）时是不确定进度，循环动画。
 * 名称写 label（显示在上方）或 aria-label / aria-labelledby（读屏要知道是什么的进度）。
 * 有 label 时右侧默认显示数值（按语言格式化的百分比，valueLabel 可以换成自己的文字），参考 React Spectrum ProgressBar。
 *
 *   <Progress value={uploaded} max={total} label="上传" valueLabel={`${uploaded} / ${total}`} />
 *   <Progress value={60} aria-label="上传进度" />  只有进度条
 *   <Progress aria-label="正在加载" />               不确定进度
 *
 * 部件：有标签行时外层是 Root（propsRoot），里面是 Label、ValueLabel 与进度条；没有时进度条就是根元素。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { Text, type TextProps } from '../base/Text';
import { useFormat } from '../config/lang/format';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { clamp } from '../utils/data/number';
import { compareNumeric, toNumber, type NumericValue } from '../utils/data/numeric';
import type { StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 进度条的圆角 */
export interface ProgressRadii {
  /** 直角 */
  none: unknown;
  /** 小圆角 */
  sm: unknown;
  /** 胶囊形（默认） */
  full: unknown;
}

/** 角色与取值由组件管理 */
export type ProgressManaged =
  'role' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow' | 'aria-valuetext';

/** 未声明的属性落到轨道（role="progressbar" 的主元素）上 */
export interface ProgressProps extends PartProps<'div', ProgressManaged> {
  /** 当前值：number、bigint 或 Decimal；不写（或 null）时为不确定进度 */
  value?: NumericValue | null;
  /** 最大值，默认 100 */
  max?: NumericValue;
  /** 色调（与 Badge、Alert 等同一套），默认 accent */
  tone?: StatusTone;
  /** 字号档位：进度条的粗细随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 圆角，默认 full */
  radius?: keyof ProgressRadii;
  /** 读屏念的取值文字，如 `(value, max) => \`已上传 ${value} / ${max} 个文件\``；默认是百分比 */
  valueText?: (value: NumericValue, max: NumericValue) => string;
  /** 进度条上方的标签：同时是进度条的名称（aria-labelledby），不用再写 aria-label */
  label?: VNodeChild;
  /** 在标签行右侧显示数值；有 label 或 valueLabel 时默认显示，不确定进度时不显示 */
  showValueLabel?: boolean;
  /** 数值文字，替换默认的百分比：`'38.6 / 50 GB'`（只是显示，读屏念的是 valueText） */
  valueLabel?: VNodeChild;
  /** 进度（着色部分）的部件属性 */
  propsIndicator?: PartProps<'div'>;
  /** 外层（标签行与进度条）的部件属性；只在有标签行时渲染 */
  propsRoot?: PartProps<'div'>;
  /** 标签的部件属性 */
  propsLabel?: Partial<TextProps>;
  /** 数值文字的部件属性 */
  propsValueLabel?: Partial<TextProps>;
}

const slide = stylex.keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(250%)' },
});

/** Progress 的样式：shell、header、valueLabel、root、indicator、indeterminate */
export const progressStyles = stylex.create({
  // 有标签行时的外层：标签行在上、进度条在下
  shell: { display: 'grid', gap: '_xs', minWidth: 0 },
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '_sm' },
  // 数值宽度不跳：等宽数字，不被标签挤压
  valueLabel: { flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  root: {
    position: 'relative',
    overflow: 'hidden',
    width: '_full',
    height: 'calc(_space.xs * 1.5)',
    backgroundColor: '_fill',
  },
  indicator: {
    height: '_full',
    borderRadius: 'inherit',
    transition: 'width _durations.md _easings.standard',
  },
  // 不确定进度：一段 40% 宽的色块从左到右循环；它本身就是信息，不随 durations 变为 0，减少动态效果时变慢
  indeterminate: {
    width: '40%',
    animationName: slide,
    animationDuration: { default: '1.4s', '@media (prefers-reduced-motion: reduce)': '3s' },
    animationTimingFunction: '_easings.standard',
    animationIterationCount: 'infinite',
  },
});

/** Progress 的样式：none、sm、full */
export const progressRadiusStyles = stylex.create({
  none: { borderRadius: 0 },
  sm: { borderRadius: '_sm' },
  full: { borderRadius: '_full' },
});

// 和轨道（fill）之间要有 3:1：中性色用次要文字色，accent 以外的状态色用各自的文字色
/** Progress 的样式：neutral、accent、info、success、warning、danger */
export const progressToneStyles = stylex.create({
  neutral: { backgroundColor: '_textMuted' },
  accent: { backgroundColor: '_accent' },
  info: { backgroundColor: '_infoText' },
  success: { backgroundColor: '_successText' },
  warning: { backgroundColor: '_warningText' },
  danger: { backgroundColor: '_dangerText' },
});

// 宽度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Progress 的样式：percent */
export const progressWidthStyles = stylex.create({
  percent: (percent: string) => ({ width: percent }),
});

/** 进度条：有 value 时为完成比例，没有时为不确定进度；有 label 时上方是标签与数值 */
export const Progress = _component(
  ({
    value,
    max = 100,
    tone = 'accent',
    size,
    radius = 'full',
    valueText,
    label,
    showValueLabel,
    valueLabel,
    propsIndicator,
    propsRoot,
    propsLabel,
    propsValueLabel,
    ...rest
  }: ProgressProps) => {
    const labelId = `${useId()}-label`;
    const format = useFormat();
    return () => {
      const determinate = value != null;
      // 夹在 0–max 之间、按原值比较；比例与读屏的 aria-valuenow 用浮点数就够
      const clamped: NumericValue = !determinate
        ? 0
        : compareNumeric(value, 0) < 0
          ? 0
          : compareNumeric(value, max) > 0
            ? max
            : value;
      const total = toNumber(max);
      const percent = total > 0 ? clamp((toNumber(clamped) / total) * 100, 0, 100) : 0;
      const percentText = format.number(percent / 100, {
        style: 'percent',
        maximumFractionDigits: 0,
      });
      const header = label != null || (determinate && (showValueLabel ?? valueLabel != null));
      const bar = (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                progressStyles.root,
                progressRadiusStyles[radius],
                // 有外层时字号档位放在外层，标签行一起缩放
                !header && size && fontSizeStyles[size],
              ],
              'aria-labelledby': label != null ? labelId : undefined,
            },
            rest,
            {
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': total,
              'aria-valuenow': determinate ? toNumber(clamped) : undefined,
              'aria-valuetext': determinate
                ? (valueText?.(clamped, max) ?? percentText)
                : undefined,
            },
          )}
          data-state={
            !determinate
              ? 'indeterminate'
              : compareNumeric(clamped, max) >= 0
                ? 'complete'
                : 'loading'
          }
        >
          <div
            {...mergeAttrs<'div'>(
              { sx: [progressStyles.indicator, progressToneStyles[tone]] },
              propsIndicator,
              {
                sx: determinate
                  ? progressWidthStyles.percent(`${percent}%`)
                  : progressStyles.indeterminate,
              },
            )}
          />
        </div>
      );
      if (!header) return bar;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [progressStyles.shell, size && fontSizeStyles[size]] },
            propsRoot,
          )}
        >
          <div {...stylex.attrs(progressStyles.header)}>
            {label != null && (
              <Text {...mergePartProps<TextProps>({ size: 'sm' }, propsLabel, { id: labelId })}>
                {label}
              </Text>
            )}
            {determinate && (showValueLabel ?? true) && (
              <Text
                {...mergePartProps<TextProps>(
                  { size: 'sm', tone: 'muted', sx: progressStyles.valueLabel },
                  propsValueLabel,
                  // 读屏从进度条的 aria-valuetext 得知数值，这里不重复念
                  { 'aria-hidden': true },
                )}
              >
                {valueLabel ?? percentText}
              </Text>
            )}
          </div>
          {bar}
        </div>
      );
    };
  },
);

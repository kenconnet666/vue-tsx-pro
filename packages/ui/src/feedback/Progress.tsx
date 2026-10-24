/**
 * 进度（role="progressbar"）：条形（默认）或环形。有 value 时显示完成比例；没有 value（null / undefined）时是不确定进度，循环动画。
 * 名称写 label（条形显示在上方、环形显示在下方）或 aria-label / aria-labelledby（读屏要知道是什么的进度）。
 * 条形有 label 时右侧默认显示数值，环形中间显示数值（按语言格式化的百分比，valueLabel 可以换成自己的文字），参考 React Spectrum ProgressBar。
 * target 是目标值：条上画一条竖线、环上画一道刻度，读屏念成“60%，目标 80%”。
 *
 *   <Progress value={uploaded} max={total} label="上传" valueLabel={`${uploaded} / ${total}`} />
 *   <Progress value={60} aria-label="上传进度" />  只有进度条
 *   <Progress aria-label="正在加载" />               不确定进度
 *   <Progress shape="circle" value={72} target={80} label="本月降本完成率" />
 *
 * 部件：有标签行时外层是 Root（propsRoot），里面是 Label、ValueLabel 与进度条；没有时进度条就是根元素。
 * 环形：根元素是 progressbar，里面是 SVG（轨道、进度、目标刻度）与中间的 ValueLabel；有 label 时外层是 Root，标签在下方。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useFormat } from '../config/lang/format';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { clamp } from '../utils/data/number';
import { compareNumeric, toNumber, type NumericValue } from '../utils/data/numeric';
import type { StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, relativeFontSizeStyles, type TextSize } from '../utils/style/typography';
import { radiusStyles, type Radius } from '../utils/style/styles';
import { t } from '../config/theme/tokens';

/** 角色与取值由组件管理 */
export type ProgressManaged =
  'role' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow' | 'aria-valuetext';

/** 进度的形状 */
export interface ProgressShapes {
  /** 条形（默认）：占满一行 */
  bar: unknown;
  /** 环形：中间显示数值，适合仪表盘、卡片里的完成率；直径随字号缩放 */
  circle: unknown;
}

/** Progress 的外观选项：可以在 ComponentDefaults 里统一设置 */
export interface ProgressOptions {
  /** 色调（与 Badge、Alert 等同一套），默认 accent */
  tone?: StatusTone;
  /** 字号档位：进度条的粗细随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 圆角，默认 full */
  radius?: Radius;
}

/** 未声明的属性落到轨道（role="progressbar" 的主元素）上 */
export interface ProgressProps extends PartProps<'div', ProgressManaged>, ProgressOptions {
  /** 当前值：number、bigint 或 Decimal；不写（或 null）时为不确定进度 */
  value?: NumericValue | null;
  /** 最大值，默认 100 */
  max?: NumericValue;
  /** 形状，默认 bar */
  shape?: keyof ProgressShapes;
  /** 目标值（与 value 同一单位）：条上画竖线、环上画刻度，读屏念在进度后面 */
  target?: NumericValue;
  /** 读屏念的取值文字，如 `(value, max) => \`已上传 ${value} / ${max} 个文件\``；默认是百分比 */
  valueText?: (value: NumericValue, max: NumericValue) => string;
  /** 进度条上方的标签：同时是进度条的名称（aria-labelledby），不用再写 aria-label */
  label?: VNodeChild;
  /** 在标签行右侧显示数值；有 label 或 valueLabel 时默认显示，不确定进度时不显示 */
  showValueLabel?: boolean;
  /** 数值文字，替换默认的百分比：`'38.6 / 50 GB'`（只是显示，读屏念的是 valueText） */
  valueLabel?: VNodeChild;
  /** 条形的进度（着色部分）的部件属性 */
  propsIndicator?: PartProps<'div'>;
  /** 外层（标签行与进度条）的部件属性；只在有标签行时渲染 */
  propsRoot?: PartProps<'div'>;
  /** 标签行（标签与数值文字）的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 标签的部件属性 */
  propsLabel?: Partial<TextProps>;
  /** 数值文字的部件属性 */
  propsValueLabel?: Partial<TextProps>;
}

const slide = css.keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(250%)' },
});

// 从右到左排版：色块在起始边（右边），从右往左扫
const slideRtl = css.keyframes({
  from: { transform: 'translateX(100%)' },
  to: { transform: 'translateX(-250%)' },
});

/** Progress 的样式：shell、header、valueLabel、root、indicator、indeterminate */
export const progressStyles = css.create({
  // 有标签行时的外层：标签行在上、进度条在下
  shell: { display: 'grid', gap: '_xs', minWidth: 0 },
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '_sm' },
  // 数值宽度不跳：等宽数字，不被标签挤压
  valueLabel: { flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  root: {
    position: 'relative',
    overflow: 'hidden',
    width: '_full',
    height: `calc(${t.space.xs} * 1.5)`,
    backgroundColor: '_fill',
    // Windows 高对比下系统把背景色改掉：轨道画一圈系统的文字色，进度用系统的高亮色（见 progressToneStyles）
    outlineStyle: { default: null, '@media (forced-colors: active)': 'solid' },
    outlineWidth: { default: null, '@media (forced-colors: active)': '_borderWidths.xs' },
    outlineColor: { default: null, '@media (forced-colors: active)': 'CanvasText' },
  },
  indicator: {
    height: '_full',
    borderRadius: 'inherit',
    forcedColorAdjust: { default: null, '@media (forced-colors: active)': 'none' },
    transition: `width ${t.durations.md} ${t.easings.standard}`,
  },
  // 不确定进度：一段 40% 宽的色块从起始边到结束边循环；它本身就是信息，不随 durations 变为 0，减少动态效果时变慢
  indeterminate: {
    width: '40%',
    animationName: { default: slide, ':dir(rtl)': slideRtl },
    animationDuration: { default: '1.4s', '@media (prefers-reduced-motion: reduce)': '3s' },
    animationTimingFunction: '_easings.standard',
    animationIterationCount: 'infinite',
  },
});

// 和轨道（fill）之间要有 3:1：中性色用次要文字色，accent 以外的状态色用各自的文字色
/** Progress 的样式：neutral、accent、info、success、warning、danger */
export const progressToneStyles = css.create({
  neutral: {
    backgroundColor: { default: '_textMuted', '@media (forced-colors: active)': 'Highlight' },
  },
  accent: {
    backgroundColor: { default: '_accent', '@media (forced-colors: active)': 'Highlight' },
  },
  info: {
    backgroundColor: { default: '_infoText', '@media (forced-colors: active)': 'Highlight' },
  },
  success: {
    backgroundColor: { default: '_successText', '@media (forced-colors: active)': 'Highlight' },
  },
  warning: {
    backgroundColor: { default: '_warningText', '@media (forced-colors: active)': 'Highlight' },
  },
  danger: {
    backgroundColor: { default: '_dangerText', '@media (forced-colors: active)': 'Highlight' },
  },
});

const spin = css.keyframes({ to: { rotate: '1turn' } });

/** 环形进度的样式：root、svg、track、indicator、indeterminate、target、center、shell */
export const progressCircleStyles = css.create({
  // 直径随字号缩放：5em 在默认字号下约 70px
  root: {
    position: 'relative',
    display: 'inline-grid',
    placeItems: 'center',
    width: '5em',
    height: '5em',
    flexShrink: 0,
  },
  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%', rotate: '-90deg' },
  track: {
    fill: 'none',
    stroke: { default: '_fill', '@media (forced-colors: active)': 'CanvasText' },
  },
  indicator: {
    fill: 'none',
    forcedColorAdjust: { default: null, '@media (forced-colors: active)': 'none' },
    transition: `stroke-dashoffset ${t.durations.md} ${t.easings.standard}`,
  },
  // 不确定进度：四分之一圈的弧一直转；减少动态效果时变慢
  indeterminate: {
    transformOrigin: 'center',
    animationName: spin,
    animationDuration: { default: '1s', '@media (prefers-reduced-motion: reduce)': '3s' },
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  target: { stroke: '_text', strokeLinecap: 'round' },
  // 中间的数值：比上下文字号小一档，等宽数字
  center: { fontVariantNumeric: 'tabular-nums', fontWeight: '_semibold', lineHeight: 1 },
  // 有标签时：环在上、标签在下，居中
  shell: { display: 'inline-grid', justifyItems: 'center', gap: '_xs', textAlign: 'center' },
});

/** 环形进度的颜色：neutral、accent、info、success、warning、danger（同条形，用 stroke） */
export const progressStrokeStyles = css.create({
  neutral: { stroke: { default: '_textMuted', '@media (forced-colors: active)': 'Highlight' } },
  accent: { stroke: { default: '_accent', '@media (forced-colors: active)': 'Highlight' } },
  info: { stroke: { default: '_infoText', '@media (forced-colors: active)': 'Highlight' } },
  success: { stroke: { default: '_successText', '@media (forced-colors: active)': 'Highlight' } },
  warning: { stroke: { default: '_warningText', '@media (forced-colors: active)': 'Highlight' } },
  danger: { stroke: { default: '_dangerText', '@media (forced-colors: active)': 'Highlight' } },
});

/** 条形进度的目标线 */
export const progressTargetStyles = css.create({
  // 竖线压在轨道上：正文色，与进度、轨道都有对比；位置按书写方向
  line: {
    position: 'absolute',
    insetBlock: 0,
    width: '_borderWidths.sm',
    marginInlineStart: `calc(-0.5 * ${t.borderWidths.sm})`,
    backgroundColor: { default: '_text', '@media (forced-colors: active)': 'CanvasText' },
  },
});

/** 条形进度目标线的位置 */
export const progressTargetPositionStyles = css.create({
  at: (percent: string) => ({ insetInlineStart: percent }),
});

// 宽度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Progress 的样式：percent */
export const progressWidthStyles = css.create({
  percent: (percent: string) => ({ width: percent }),
});

/** 环形的几何：viewBox 100 × 100，线宽 10 */
const RING = { stroke: 10, radius: 45, circumference: 2 * Math.PI * 45 };

/** 值在 0–max 的比例（0–100）；超出范围的夹到两端 */
function percentOf(value: NumericValue, max: NumericValue): number {
  const total = toNumber(max);
  if (total <= 0) return 0;
  const clamped = compareNumeric(value, 0) < 0 ? 0 : compareNumeric(value, max) > 0 ? max : value;
  return clamp((toNumber(clamped) / total) * 100, 0, 100);
}

/** 进度：有 value 时为完成比例，没有时为不确定进度；条形有 label 时上方是标签与数值，环形中间是数值 */
export const Progress = _component(
  ({
    value,
    max = 100,
    shape = 'bar',
    target,
    tone,
    size,
    radius,
    valueText,
    label,
    showValueLabel,
    valueLabel,
    propsIndicator,
    propsRoot,
    propsHeader,
    propsLabel,
    propsValueLabel,
    ...rest
  }: ProgressProps) => {
    const labelId = `${useId()}-label`;
    const format = useFormat();
    const lang = useLang();
    const appearance = useDefaults('Progress', () => ({ tone, size, radius }), {
      tone: 'accent',
      radius: 'full',
    });
    const percentText = (percent: number) =>
      format.number(percent / 100, { style: 'percent', maximumFractionDigits: 0 });

    return () => {
      const look = appearance();
      const determinate = value != null;
      // 夹在 0–max 之间、按原值比较；比例与读屏的 aria-valuenow 用浮点数就够
      const clamped: NumericValue = !determinate
        ? 0
        : compareNumeric(value, 0) < 0
          ? 0
          : compareNumeric(value, max) > 0
            ? max
            : value;
      const percent = percentOf(clamped, max);
      const targetPercent = target == null ? undefined : percentOf(target, max);
      const shownValue = valueLabel ?? percentText(percent);
      const spoken = determinate ? (valueText?.(clamped, max) ?? percentText(percent)) : undefined;
      const circle = shape === 'circle';
      const header =
        !circle && (label != null || (determinate && (showValueLabel ?? valueLabel != null)));
      const wrapped = header || (circle && hasContent(label));

      const progressbar = {
        role: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': toNumber(max),
        'aria-valuenow': determinate ? toNumber(clamped) : undefined,
        'aria-valuetext':
          spoken && targetPercent !== undefined
            ? `${spoken}，${lang.progressTarget(percentText(targetPercent))}`
            : spoken,
      } as const;
      const state = !determinate
        ? 'indeterminate'
        : compareNumeric(clamped, max) >= 0
          ? 'complete'
          : 'loading';

      const ring = () => {
        const { stroke, radius: r, circumference } = RING;
        // 目标刻度：从轨道外缘到内缘的一道线，按比例转到对应角度（SVG 整体转了 -90°，0 在正上方）
        const angle = ((targetPercent ?? 0) / 100) * 2 * Math.PI;
        const tick = (distance: number) => ({
          x: 50 + distance * Math.cos(angle),
          y: 50 + distance * Math.sin(angle),
        });
        const outer = tick(r + stroke / 2 + 2);
        const inner = tick(r - stroke / 2 - 2);
        return (
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [progressCircleStyles.root, !wrapped && look.size && fontSizeStyles[look.size]],
                'aria-labelledby': hasContent(label) ? labelId : undefined,
              },
              rest,
              progressbar,
            )}
            data-state={state}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" {...css.attrs(progressCircleStyles.svg)}>
              <circle
                cx="50"
                cy="50"
                r={r}
                stroke-width={stroke}
                {...css.attrs(progressCircleStyles.track)}
              />
              <circle
                cx="50"
                cy="50"
                r={r}
                stroke-width={stroke}
                stroke-linecap={look.radius === 'none' ? 'butt' : 'round'}
                stroke-dasharray={circumference}
                stroke-dashoffset={
                  determinate ? circumference * (1 - percent / 100) : circumference * 0.75
                }
                {...css.attrs(
                  progressCircleStyles.indicator,
                  progressStrokeStyles[look.tone],
                  !determinate && progressCircleStyles.indeterminate,
                )}
              />
              {targetPercent !== undefined && (
                <line
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke-width={2.5}
                  {...css.attrs(progressCircleStyles.target)}
                />
              )}
            </svg>
            {determinate && (showValueLabel ?? true) && (
              <Text
                {...mergePartProps<TextProps>(
                  { sx: [progressCircleStyles.center, relativeFontSizeStyles.sm] },
                  propsValueLabel,
                  // 读屏从 aria-valuetext 得知数值，这里不重复念
                  { 'aria-hidden': true },
                )}
              >
                {shownValue}
              </Text>
            )}
          </div>
        );
      };

      const bar = () => (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                progressStyles.root,
                radiusStyles[look.radius],
                // 有外层时字号档位放在外层，标签行一起缩放
                !header && look.size && fontSizeStyles[look.size],
              ],
              'aria-labelledby': hasContent(label) ? labelId : undefined,
            },
            rest,
            progressbar,
          )}
          data-state={state}
        >
          <div
            {...mergeAttrs<'div'>(
              { sx: [progressStyles.indicator, progressToneStyles[look.tone]] },
              propsIndicator,
              {
                sx: determinate
                  ? progressWidthStyles.percent(`${percent}%`)
                  : progressStyles.indeterminate,
              },
            )}
          />
          {targetPercent !== undefined && (
            <div
              aria-hidden="true"
              {...css.attrs(
                progressTargetStyles.line,
                progressTargetPositionStyles.at(`${targetPercent}%`),
              )}
            />
          )}
        </div>
      );

      if (circle) {
        if (!wrapped) return ring();
        return (
          <div
            {...mergeAttrs<'div'>(
              { sx: [progressCircleStyles.shell, look.size && fontSizeStyles[look.size]] },
              propsRoot,
            )}
          >
            {ring()}
            <Text
              {...mergePartProps<TextProps>(
                { tone: 'muted', sx: relativeFontSizeStyles.sm },
                propsLabel,
                { id: labelId },
              )}
            >
              {label}
            </Text>
          </div>
        );
      }
      if (!header) return bar();
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [progressStyles.shell, look.size && fontSizeStyles[look.size]] },
            propsRoot,
          )}
        >
          <div
            {...mergeAttrs<'div'>(
              { sx: [progressStyles.header, relativeFontSizeStyles.sm] },
              propsHeader,
            )}
          >
            {hasContent(label) && (
              <Text {...mergePartProps<TextProps>({}, propsLabel, { id: labelId })}>{label}</Text>
            )}
            {determinate && (showValueLabel ?? true) && (
              <Text
                {...mergePartProps<TextProps>(
                  { tone: 'muted', sx: progressStyles.valueLabel },
                  propsValueLabel,
                  // 读屏从进度条的 aria-valuetext 得知数值，这里不重复念
                  { 'aria-hidden': true },
                )}
              >
                {shownValue}
              </Text>
            )}
          </div>
          {bar()}
        </div>
      );
    };
  },
);

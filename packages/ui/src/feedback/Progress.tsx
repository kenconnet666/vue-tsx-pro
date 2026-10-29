/**
 * 进度（role="progressbar"）：条形（默认）或环形。有 value 时显示完成比例；没有 value（null / undefined）时是不确定进度，循环动画。
 * 名称写 label（条形显示在上方、环形显示在下方）或 aria-label / aria-labelledby（读屏要知道是什么的进度）。
 * 条形有 label 时右侧默认显示数值，环形中间显示数值（按语言格式化的百分比，valueLabel 可以换成自己的文字），参考 React Spectrum ProgressBar。
 * target 是目标值：条上画一条竖线、环上画一道刻度，读屏念成“60%，目标 80%”。
 *
 *   <Progress value={uploaded} max={total} label="上传" valueLabel={`${uploaded} / ${total}`} />
 *   <Progress value={60} aria-label="上传进度" />  只有进度条
 *   <Progress aria-label="正在加载" />               不确定进度
 *   <Progress shape="circle" value={72} target={80} label="本月销售完成率" />
 *
 * 部件：有标签行时外层是 Root（propsRoot），里面是 Label、ValueLabel 与进度条；没有时进度条就是根元素。
 * 环形：根元素是 progressbar，里面是 SVG（轨道、进度、目标刻度）与中间的 ValueLabel；有 label 时外层是 Root，标签在下方。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { useFormat } from '../config/lang/format';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { clamp, svgNumber } from '../utils/data/number';
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

const spin = css.keyframes({ to: { rotate: '1turn' } });

/**
 * 进度的配方。条形的部件：root（有标签行时的外层）、header（标签行）、label、valueLabel、
 * track（轨道，即 progressbar）、indicator（进度）、target（目标线）；环形的部件：root（有标签时的外层）、
 * circle（progressbar）、circleSvg、circleTrack、circleIndicator、circleTarget、valueLabel（中间的数值）、label。
 * 档位：shape、tone、indeterminate（不确定进度）。字号、圆角用共用的表另外叠加；
 * 条形的进度宽度与目标线的位置是任意值，用下面的动态样式
 */
export const progressRecipe = css.recipe({
  name: 'Progress',
  parts: [
    'root',
    'header',
    'label',
    'valueLabel',
    'track',
    'indicator',
    'target',
    'circle',
    'circleSvg',
    'circleTrack',
    'circleIndicator',
    'circleTarget',
  ],
  base: {
    header: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: '_sm',
    },
    track: {
      position: 'relative',
      overflow: 'hidden',
      width: '_full',
      height: `calc(${t.space.xs} * 1.5)`,
      backgroundColor: '_fill',
      // Windows 高对比下系统把背景色改掉：轨道画一圈系统的文字色，进度用系统的高亮色（见档位 tone）
      outlineStyle: { default: null, _forcedColors: 'solid' },
      outlineWidth: { default: null, _forcedColors: '_borderWidths.xs' },
      outlineColor: { default: null, _forcedColors: 'CanvasText' },
    },
    indicator: {
      height: '_full',
      borderRadius: 'inherit',
      forcedColorAdjust: { default: null, _forcedColors: 'none' },
      transition: `width ${t.durations.md} ${t.easings.standard}`,
    },
    // 竖线压在轨道上：正文色，与进度、轨道都有对比；位置按书写方向
    target: {
      position: 'absolute',
      insetBlock: 0,
      width: '_borderWidths.sm',
      marginInlineStart: `calc(-0.5 * ${t.borderWidths.sm})`,
      backgroundColor: { default: '_text', _forcedColors: 'CanvasText' },
    },
    // 直径随字号缩放：5em 在默认字号下约 70px
    circle: {
      position: 'relative',
      display: 'inline-grid',
      placeItems: 'center',
      width: '5em',
      height: '5em',
      flexShrink: 0,
    },
    circleSvg: { position: 'absolute', inset: 0, width: '100%', height: '100%', rotate: '-90deg' },
    circleTrack: {
      fill: 'none',
      stroke: { default: '_fill', _forcedColors: 'CanvasText' },
    },
    circleIndicator: {
      fill: 'none',
      forcedColorAdjust: { default: null, _forcedColors: 'none' },
      transition: `stroke-dashoffset ${t.durations.md} ${t.easings.standard}`,
    },
    circleTarget: { stroke: '_text', strokeLinecap: 'round' },
  },
  variants: {
    shape: {
      bar: {
        // 有标签行时的外层：标签行在上、进度条在下
        root: { display: 'grid', gap: '_xs', minWidth: 0 },
        // 数值宽度不跳：等宽数字，不被标签挤压
        valueLabel: { flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
      },
      circle: {
        // 有标签时：环在上、标签在下，居中
        root: { display: 'inline-grid', justifyItems: 'center', gap: '_xs', textAlign: 'center' },
        // 中间的数值：比上下文字号小一档，等宽数字
        valueLabel: { fontVariantNumeric: 'tabular-nums', fontWeight: '_semibold', lineHeight: 1 },
      },
    },
    // 和轨道（fill）之间要有 3:1：中性色用次要文字色，accent 以外的状态色用各自的文字色；条形用背景色，环形用 stroke
    tone: {
      neutral: {
        indicator: {
          backgroundColor: { default: '_textMuted', _forcedColors: 'Highlight' },
        },
        circleIndicator: {
          stroke: { default: '_textMuted', _forcedColors: 'Highlight' },
        },
      },
      accent: {
        indicator: {
          backgroundColor: { default: '_accent', _forcedColors: 'Highlight' },
        },
        circleIndicator: {
          stroke: { default: '_accent', _forcedColors: 'Highlight' },
        },
      },
      info: {
        indicator: {
          backgroundColor: { default: '_infoText', _forcedColors: 'Highlight' },
        },
        circleIndicator: {
          stroke: { default: '_infoText', _forcedColors: 'Highlight' },
        },
      },
      success: {
        indicator: {
          backgroundColor: {
            default: '_successText',
            _forcedColors: 'Highlight',
          },
        },
        circleIndicator: {
          stroke: { default: '_successText', _forcedColors: 'Highlight' },
        },
      },
      warning: {
        indicator: {
          backgroundColor: {
            default: '_warningText',
            _forcedColors: 'Highlight',
          },
        },
        circleIndicator: {
          stroke: { default: '_warningText', _forcedColors: 'Highlight' },
        },
      },
      danger: {
        indicator: {
          backgroundColor: {
            default: '_dangerText',
            _forcedColors: 'Highlight',
          },
        },
        circleIndicator: {
          stroke: { default: '_dangerText', _forcedColors: 'Highlight' },
        },
      },
    },
    indeterminate: {
      true: {
        // 条形：一段 40% 宽的色块从起始边到结束边循环；它本身就是信息，不随 durations 变为 0，减少动态效果时变慢
        indicator: {
          width: '40%',
          animationName: { default: slide, ':dir(rtl)': slideRtl },
          animationDuration: { default: '1.4s', _reducedMotion: '3s' },
          animationTimingFunction: '_easings.standard',
          animationIterationCount: 'infinite',
        },
        // 环形：四分之一圈的弧一直转；减少动态效果时变慢
        circleIndicator: {
          transformOrigin: 'center',
          animationName: spin,
          animationDuration: { default: '1s', _reducedMotion: '3s' },
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        },
      },
    },
  },
});

/** 进度的部件（createUi / Provider 的 styles.Progress 按它定制） */
export type ProgressPart = (typeof progressRecipe.parts)[number];

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
    const recipe = useRecipe(progressRecipe);
    const percentText = (percent: number) =>
      format.number(percent / 100, { style: 'percent', maximumFractionDigits: 0 });

    return () => {
      const look = appearance();
      const determinate = value != null;
      const s = recipe({ shape, tone: look.tone, indeterminate: !determinate });
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
          x: svgNumber(50 + distance * Math.cos(angle)),
          y: svgNumber(50 + distance * Math.sin(angle)),
        });
        const outer = tick(r + stroke / 2 + 2);
        const inner = tick(r - stroke / 2 - 2);
        return (
          <div
            {...mergeAttrs<'div'>(
              {
                ...s.circle,
                sx: [s.circle.sx, !wrapped && look.size && fontSizeStyles[look.size]],
                'aria-labelledby': hasContent(label) ? labelId : undefined,
              },
              rest,
              progressbar,
            )}
            data-state={state}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" {...mergeAttrs<'svg'>(s.circleSvg)}>
              <circle
                cx="50"
                cy="50"
                r={r}
                stroke-width={stroke}
                {...mergeAttrs<'circle'>(s.circleTrack)}
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
                {...mergeAttrs<'circle'>(s.circleIndicator)}
              />
              {targetPercent !== undefined && (
                <line
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke-width={2.5}
                  {...mergeAttrs<'line'>(s.circleTarget)}
                />
              )}
            </svg>
            {determinate && (showValueLabel ?? true) && (
              <Text
                {...mergePartProps<TextProps>(
                  { ...s.valueLabel, sx: [s.valueLabel.sx, relativeFontSizeStyles.sm] },
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
              ...s.track,
              sx: [
                s.track.sx,
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
            {...mergeAttrs<'div'>(s.indicator, propsIndicator, {
              sx: determinate ? progressWidthStyles.percent(`${percent}%`) : undefined,
            })}
          />
          {targetPercent !== undefined && (
            <div
              aria-hidden="true"
              {...mergeAttrs<'div'>({
                ...s.target,
                sx: [s.target.sx, progressTargetPositionStyles.at(`${targetPercent}%`)],
              })}
            />
          )}
        </div>
      );

      if (circle) {
        if (!wrapped) return ring();
        return (
          <div
            {...mergeAttrs<'div'>(
              { ...s.root, sx: [s.root.sx, look.size && fontSizeStyles[look.size]] },
              propsRoot,
            )}
          >
            {ring()}
            <Text
              {...mergePartProps<TextProps>(
                { ...s.label, tone: 'muted', sx: [s.label.sx, relativeFontSizeStyles.sm] },
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
            { ...s.root, sx: [s.root.sx, look.size && fontSizeStyles[look.size]] },
            propsRoot,
          )}
        >
          <div
            {...mergeAttrs<'div'>(
              { ...s.header, sx: [s.header.sx, relativeFontSizeStyles.sm] },
              propsHeader,
            )}
          >
            {hasContent(label) && (
              <Text {...mergePartProps<TextProps>(s.label, propsLabel, { id: labelId })}>
                {label}
              </Text>
            )}
            {determinate && (showValueLabel ?? true) && (
              <Text
                {...mergePartProps<TextProps>(
                  { ...s.valueLabel, tone: 'muted' },
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

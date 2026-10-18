/**
 * 进度条（role="progressbar"）。有 value 时显示完成比例；没有 value（null / undefined）时是不确定进度，循环动画。
 * 名称写 aria-label 或 aria-labelledby（读屏要知道是什么的进度）。
 *
 *   <Progress value={uploaded} max={total} aria-label="上传进度" />
 *   <Progress aria-label="正在加载" />          不确定进度
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { elementProps, mergeProps, type PartProps } from '../utils/props';

/** 进度条的色调 */
export interface ProgressTones {
  /** 品牌色（默认） */
  accent: unknown;
  /** 成功 */
  success: unknown;
  /** 警告 */
  warning: unknown;
  /** 危险 */
  danger: unknown;
}

/** 角色与取值由组件管理 */
type Managed = 'role' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow' | 'aria-valuetext';

/** 未声明的属性落到轨道（role="progressbar" 的主元素）上 */
export interface ProgressProps extends PartProps<'div', Managed> {
  /** 当前值；不写（或 null）时为不确定进度 */
  value?: number | null;
  /** 最大值，默认 100 */
  max?: number;
  /** 色调，默认 accent */
  tone?: keyof ProgressTones;
  /** 读屏念的取值文字，如 `(value, max) => \`已上传 ${value} / ${max} 个文件\``；默认是百分比 */
  valueText?: (value: number, max: number) => string;
  /** 进度（着色部分）的部件属性 */
  propsIndicator?: PartProps<'div'>;
}

const slide = stylex.keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(250%)' },
});

const styles = stylex.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    width: '_full',
    height: 'calc(_space.xs * 1.5)',
    borderRadius: '_full',
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

const toneStyles = stylex.create({
  accent: { backgroundColor: '_accent' },
  success: { backgroundColor: '_successText' },
  warning: { backgroundColor: '_warningText' },
  danger: { backgroundColor: '_danger' },
});

// 宽度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
const widthStyles = stylex.create({
  percent: (percent: string) => ({ width: percent }),
});

/** 进度条：有 value 时为完成比例，没有时为不确定进度 */
export const Progress = _component(
  ({ value, max = 100, tone = 'accent', valueText, propsIndicator, ...rest }: ProgressProps) =>
    () => {
      const determinate = value != null;
      const clamped = determinate ? Math.min(max, Math.max(0, value)) : 0;
      const percent = max > 0 ? (clamped / max) * 100 : 0;
      return (
        <div
          {...elementProps(
            mergeProps<'div'>({ sx: styles.root }, rest, {
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': max,
              'aria-valuenow': determinate ? clamped : undefined,
              'aria-valuetext': determinate
                ? (valueText?.(clamped, max) ?? `${Math.round(percent)}%`)
                : undefined,
            }),
          )}
          data-state={!determinate ? 'indeterminate' : clamped >= max ? 'complete' : 'loading'}
        >
          <div
            {...elementProps(
              mergeProps<'div'>({ sx: [styles.indicator, toneStyles[tone]] }, propsIndicator, {
                sx: determinate ? widthStyles.percent(`${percent}%`) : styles.indeterminate,
              }),
            )}
          />
        </div>
      );
    },
);

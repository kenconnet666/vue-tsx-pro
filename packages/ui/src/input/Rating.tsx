/**
 * 评分：几颗星（或别的图标）里选一个分数，供应商评价、满意度、优先级。可以半星，可以只读显示。
 *
 *   <Field label="交付质量"><Rating value={_bind(score)} /></Field>
 *   <Rating value={4.5} readonly />                         只读：一个 role="img"，读“4.5 星，满分 5 星”
 *   <Rating value={_bind(score)} allowHalf count={10} icon={Heart} tone="danger" />
 *
 * 可编辑时是单选组（role="radiogroup"）：每颗星是一个原生 radio（视觉上隐藏），方向键、表单提交、读屏都是原生的；
 * 名称是“3 星”这样的文字（lang.ratingStar）。指针悬停时预览将要选的分数；再点一次已选的分数清空（clearable，默认开）。
 * 半星：每颗星左右各一半，各是一个 radio。部件：Root（div）、Star（span，每颗星）、Icon。
 */
import { Star } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useId } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFieldControl } from '../form/Field';
import { defaultLabelledBy, mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import type { StatusTone } from '../utils/style/tone-styles';
import { t } from '../config/theme/tokens';

/** 角色由组件管理 */
export type RatingManaged = 'role';

/** 未声明的属性落到外层 div 上；名称写 aria-label，或放在 Field 里 */
export interface RatingProps extends PartProps<'div', RatingManaged> {
  /** 分数：父级写 value={_bind(score)}；没有评分时是 null */
  value?: number | null;
  /** 一共几颗星，默认 5 */
  count?: number;
  /** 可以选半颗 */
  allowHalf?: boolean;
  /** 再点一次已选的分数时清空，默认 true */
  clearable?: boolean;
  /** 图标，默认星星 */
  icon?: IconData;
  /** 选中的颜色，默认 warning（金黄） */
  tone?: StatusTone;
  /** 字号档位：图标随之缩放 */
  size?: TextSize;
  /** 只读：只显示分数（一个 role="img"） */
  readonly?: boolean;
  /** 不可用（不写时取 Field 的） */
  disabled?: boolean;
  /** 表单提交时的 name */
  name?: string;
  /** 每颗星的部件属性 */
  propsStar?: PartProps<'span'>;
}

/** Rating 的样式：root、star、readonly、icon、empty、fill、clip、clipIcon、whole、startHalf、endHalf、disabled */
export const ratingStyles = stylex.create({
  root: { display: 'inline-flex', alignItems: 'center', gap: '0.15em', lineHeight: 1 },
  // 每颗星：空心图标打底，填色的那层按比例裁出；radio 盖满（半星时左右各一半）
  star: {
    position: 'relative',
    display: 'inline-grid',
    width: '1.35em',
    height: '1.35em',
    borderRadius: '_sm',
    cursor: 'pointer',
    transition: `scale ${t.durations.sm} ${t.easings.standard}`,
    scale: { default: null, ':hover': '1.12' },
  },
  readonly: { cursor: 'default', scale: null },
  icon: { gridArea: '1 / 1', width: '100%', height: '100%' },
  empty: { color: '_borderStrong' },
  // 填色的那层：currentColor 填满图标
  fill: { fill: 'currentColor' },
  clip: { gridArea: '1 / 1', overflow: 'hidden', pointerEvents: 'none' },
  // 裁出来的那层按整颗星的大小画，不随裁出的宽度缩小
  clipIcon: { display: 'block', width: '1.35em', height: '1.35em', maxWidth: 'none' },
  // 点击区域：整颗；半星时起始边一半、结束边一半
  whole: { position: 'absolute', inset: 0 },
  startHalf: { position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: '50%' },
  endHalf: { position: 'absolute', insetBlock: 0, insetInlineEnd: 0, width: '50%' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
});

// 选中的颜色用各色调的实色（金黄的星、红色的心）：实心与空心靠形状区分，不只靠颜色；Windows 高对比下用系统高亮色
/** Rating 的颜色：neutral、accent、info、success、warning、danger */
export const ratingToneStyles = stylex.create({
  neutral: { color: { default: '_textMuted', '@media (forced-colors: active)': 'Highlight' } },
  accent: { color: { default: '_accent', '@media (forced-colors: active)': 'Highlight' } },
  info: { color: { default: '_info', '@media (forced-colors: active)': 'Highlight' } },
  success: { color: { default: '_success', '@media (forced-colors: active)': 'Highlight' } },
  warning: { color: { default: '_warning', '@media (forced-colors: active)': 'Highlight' } },
  danger: { color: { default: '_danger', '@media (forced-colors: active)': 'Highlight' } },
});

/** 填色那层的宽度 */
export const ratingClipStyles = stylex.create({
  width: (percent: string) => ({ width: percent }),
});

/** 评分：一排可以点的星 */
export const Rating = _component(
  ({
    value = _bindable<number | null>(null),
    count = 5,
    allowHalf = false,
    clearable = true,
    icon = Star,
    tone = 'warning',
    size,
    readonly,
    disabled,
    name,
    id,
    propsStar,
    ...rest
  }: RatingProps) => {
    const lang = useLang();
    const generatedName = useId();
    const control = useFieldControl(() => ({ id, disabled, readonly }));
    // 指针悬停时预览的分数
    let hover = _state<number | null>(null);

    /** 第 index 颗星（从 1 开始）填了多少：0、50、100 */
    const filled = (shown: number | null, index: number) =>
      shown == null ? 0 : shown >= index ? 100 : shown >= index - 0.5 ? 50 : 0;

    function pick(next: number) {
      value = clearable && value === next ? null : next;
      hover = null;
    }

    const starIcon = (percent: number) => [
      <Icon icon={icon} sx={[ratingStyles.icon, ratingStyles.empty]} />,
      percent > 0 && (
        <span {...stylex.attrs(ratingStyles.clip, ratingClipStyles.width(`${percent}%`))}>
          <Icon
            icon={icon}
            sx={[ratingStyles.clipIcon, ratingStyles.fill, ratingToneStyles[tone]]}
          />
        </span>
      ),
    ];

    return () => {
      const state = control();
      const stars = Array.from({ length: count }, (_, index) => index + 1);

      if (state.readonly) {
        return (
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [ratingStyles.root, size && fontSizeStyles[size]],
                'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
              },
              rest,
              { id: state.id, role: 'img', 'aria-label': lang.ratingSummary(value, count) },
            )}
          >
            {stars.map((index) => (
              <span
                key={index}
                aria-hidden="true"
                {...mergeAttrs<'span'>(
                  { sx: [ratingStyles.star, ratingStyles.readonly] },
                  propsStar,
                )}
              >
                {starIcon(filled(value, index))}
              </span>
            ))}
          </div>
        );
      }

      const shown = hover ?? value;
      const radio = (score: number, sx: StyleXStyles) => (
        <label {...stylex.attrs(sx)} onPointerenter={() => (hover = score)}>
          <input
            type="radio"
            name={name ?? generatedName}
            value={String(score)}
            checked={value === score}
            disabled={state.disabled}
            aria-label={lang.ratingStar(score)}
            onClick={() => pick(score)}
            {...stylex.attrs(visuallyHiddenStyles.hidden)}
          />
        </label>
      );
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                ratingStyles.root,
                size && fontSizeStyles[size],
                state.disabled && ratingStyles.disabled,
              ],
              'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
            },
            rest,
            {
              id: state.id,
              role: 'radiogroup',
              'aria-describedby': state.describedBy,
              'aria-disabled': state.disabled || undefined,
              onPointerleave: () => (hover = null),
            },
          )}
        >
          {stars.map((index) => (
            <span
              key={index}
              {...mergeAttrs<'span'>(
                {
                  sx: [ratingStyles.star, focusRingStyles.within],
                },
                propsStar,
              )}
              data-state={
                filled(value, index) === 100 ? 'full' : filled(value, index) ? 'half' : 'empty'
              }
            >
              {starIcon(filled(shown, index))}
              {allowHalf && radio(index - 0.5, ratingStyles.startHalf)}
              {radio(index, allowHalf ? ratingStyles.endHalf : ratingStyles.whole)}
            </span>
          ))}
        </div>
      );
    };
  },
);

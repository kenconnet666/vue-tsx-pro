/**
 * 字数计数（span）：TextField、Textarea 的 showCount 用它，也可以单独放在 Field 里。
 * 显示“12 / 100”，超出上限时用危险色；读屏念完整的句子（语言包的 characterCount），由输入框经 aria-describedby 关联。
 *
 *   <CharacterCount id={countId} count={bio.length} max={200} />
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到 span 上；id 给输入框的 aria-describedby 关联 */
export interface CharacterCountProps extends PartProps<'span'> {
  /** 已输入的字符数 */
  count: number;
  /** 上限；不给时只显示字数 */
  max?: number;
}

/** CharacterCount 的样式：root、over */
export const characterCountStyles = stylex.create({
  root: {
    flexShrink: 0,
    fontSize: '_sm',
    color: '_textMuted',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  over: { color: '_dangerText' },
});

/** 字数计数：超出上限时用危险色 */
export const CharacterCount = _component(({ count, max, ...rest }: CharacterCountProps) => {
  const lang = useLang();
  return () => {
    const over = max != null && count > max;
    return (
      <span
        {...mergeAttrs<'span'>(
          { sx: [characterCountStyles.root, over && characterCountStyles.over] },
          rest,
        )}
        data-over={over || undefined}
      >
        <span aria-hidden="true">{max == null ? count : `${count} / ${max}`}</span>
        <VisuallyHidden>{lang.characterCount(count, max)}</VisuallyHidden>
      </span>
    );
  };
});

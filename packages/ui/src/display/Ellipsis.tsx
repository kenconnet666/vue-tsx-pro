/**
 * 截断的文字：超出一行（或 lines 行）时省略，真的被截断了才给出看全文的办法——悬停或聚焦时的提示，或展开按钮。
 * 表格里的长名称、卡片里的描述、列表里的备注。
 *
 *   <Ellipsis>杭州远山精密机械有限公司（萧山二厂）</Ellipsis>             一行，截断时悬停看全文
 *   <Ellipsis lines={3} expandable>{description}</Ellipsis>              三行，截断时后面有“展开”
 *
 * 是否截断由 ResizeObserver 量出（内容或宽度变了重新量），没截断时就是普通文字：不能聚焦、没有提示、没有按钮。
 * 截断时文字能用 Tab 聚焦（键盘用户也能看全文），提示的内容默认是 children，tooltip 可以换成别的；
 * expandable 时展开后显示全部，再点“收起”。部件：Root（span）、Text（span，截断的那段）、Toggle（展开按钮）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { Tooltip } from '../overlay/Tooltip';
import { useResizeObserver } from '../utils/dom/resize';
import { batchLayout } from '../utils/dom/layout-batch';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { lineClampStyles, textStyles } from '../utils/style/typography';

/** 未声明的属性落到外层 span 上 */
export interface EllipsisProps extends PartProps<'span'> {
  /** 最多几行，默认 1 */
  lines?: number;
  /** 截断时后面放“展开”按钮，展开后显示全部 */
  expandable?: boolean;
  /** 是否展开：父级可以写 expanded={_bind(x)} */
  expanded?: boolean;
  /** 截断时悬停、聚焦显示的提示，默认是 children；false 不提示（expandable 时默认不提示） */
  tooltip?: VNodeChild | false;
  /** 截断的那段文字的部件属性 */
  propsText?: PartProps<'span'>;
  /** 展开按钮的部件属性 */
  propsToggle?: PartProps<'button'>;
  /** 文字 */
  children?: VNodeChild;
}

/** Ellipsis 的样式：root、multiline、text、toggle */
export const ellipsisStyles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '_xs',
    minWidth: 0,
    maxWidth: '100%',
  },
  // 多行时块级：段落里的描述
  multiline: { display: 'flex', alignItems: 'flex-end' },
  text: { minWidth: 0, borderRadius: '_xs' },
  // 展开按钮：链接样式，不换行
  toggle: {
    flexShrink: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '_accentText',
    font: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecorationLine: { default: 'none', ':hover': 'underline' },
  },
});

/** 截断的文字：真的截断了才有提示或展开按钮 */
export const Ellipsis = _component(
  ({
    lines = 1,
    expandable = false,
    expanded = _bindable(false),
    tooltip,
    propsText,
    propsToggle,
    children,
    ...rest
  }: EllipsisProps) => {
    const lang = useLang();
    let text = _state.raw<HTMLElement | null>(null);
    let truncated = _state(false);

    function measure() {
      batchLayout(() => {
        const element = text;
        if (!element || expanded) return;
        // 多行比高度、单行比宽度；差 1px 以内是小数取整
        const over =
          lines > 1
            ? element.scrollHeight > element.clientHeight + 1
            : element.scrollWidth > element.clientWidth + 1;
        return () => (truncated = over);
      });
    }
    useResizeObserver(() => text, measure);
    // 挂载后量一次；内容、行数变了重新量（截断后的大小可能不变，ResizeObserver 不会通知）
    watch(() => [children, lines, expanded], measure, { immediate: true, flush: 'post' });

    return () => {
      const clamped = !expanded;
      const showTooltip =
        truncated && clamped && tooltip !== false && (tooltip !== undefined || !expandable);
      const body = (props: Record<string, unknown> = {}) => (
        <span
          {...mergeAttrs<'span'>(
            {
              sx: [
                ellipsisStyles.text,
                clamped &&
                  (lines > 1
                    ? [textStyles.clamp, lineClampStyles.lines(lines)]
                    : textStyles.truncate),
                showTooltip && focusRingStyles.visible,
              ],
            },
            propsText,
            {
              ref: _toRef(text),
              // 截断时能聚焦：键盘用户也能看到提示里的全文
              tabindex: showTooltip ? 0 : undefined,
              ...props,
            },
          )}
        >
          {children}
        </span>
      );
      return (
        <span
          {...mergeAttrs<'span'>(
            { sx: [ellipsisStyles.root, lines > 1 && ellipsisStyles.multiline] },
            rest,
          )}
          data-truncated={truncated || undefined}
          data-expanded={expanded || undefined}
        >
          {showTooltip ? (
            <Tooltip trigger={(props) => body(props as unknown as Record<string, unknown>)}>
              {tooltip ?? children}
            </Tooltip>
          ) : (
            body()
          )}
          {expandable && (truncated || expanded) && (
            <button
              {...mergeAttrs<'button'>({ sx: ellipsisStyles.toggle }, propsToggle, {
                type: 'button',
                'aria-expanded': expanded,
                onClick: () => (expanded = !expanded),
              })}
            >
              {expanded ? lang.ellipsisCollapse : lang.ellipsisExpand}
            </button>
          )}
        </span>
      );
    };
  },
);

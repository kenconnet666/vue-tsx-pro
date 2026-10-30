/**
 * 折叠面板：一组可展开、收起的段落（常见问题、订单详情的分组）；手风琴模式下同时只展开一个。
 *
 *   <Collapse _value={open}>
 *     <CollapseItem name="ship" title="多久发货？">付款后 48 小时内发货。</CollapseItem>
 *     <CollapseItem name="refund" title="怎么退款？">…</CollapseItem>
 *   </Collapse>
 *   <Collapse _value={current} accordion>…</Collapse>
 *
 * 展开收起的高度动画用网格行（0fr ↔ 1fr），不用量内容的高度，小程序里也一样。
 */
import { ChevronDown } from '@lucide/icons';
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { dividerImage, dividerLayout } from '../theme/divider';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 面板提供给各项的 */
interface CollapseState {
  isOpen(name: string): boolean;
  toggle(name: string): void;
}

const CollapseContext = createContext<CollapseState>('Collapse');

/** 未声明的属性落到根元素（div）上 */
export interface CollapseProps extends Omit<PartProps<'div'>, 'onChange'> {
  /** 展开的项；双向绑定写 `_value={x}`。手风琴模式下是一个名字（或 null），否则是名字的数组 */
  _value?: string[] | string | null;
  /** 手风琴：同时只展开一个 */
  accordion?: boolean;
  /** 展开的项变了 */
  onChange?: (value: string[] | string | null) => void;
  /** 各个 CollapseItem */
  children?: VNodeChild;
}

/** Collapse 的样式：root、header、title、arrow、panel、content */
export const collapseStyles = css.create({
  root: { backgroundColor: '_surface' },
  item: {
    // 项之间的细线（同 Cell），最后一项不画
    backgroundImage: {
      default: dividerImage,
      ':last-child': 'none',
    },
    ...dividerLayout,
  },
  header: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_md',
    width: '100%',
    minHeight: '_control',
    margin: 0,
    paddingBlock: '0.7em',
    paddingInline: '_lg',
    borderWidth: 0,
    backgroundColor: { default: 'transparent', ':active:not([disabled])': '_fillActive' },
    color: { default: '_text', '[disabled]': '_textDisabled' },
    fontFamily: 'inherit',
    fontSize: '_md',
    lineHeight: '1.5',
    textAlign: 'start',
    cursor: { default: 'pointer', '[disabled]': 'not-allowed' },
  },
  title: { flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere' },
  value: { flex: 'none', color: '_textMuted' },
  arrow: {
    flex: 'none',
    color: '_textPlaceholder',
    transform: { default: 'none', '[data-open]': 'rotate(180deg)' },
    transitionProperty: 'transform',
    transitionDuration: '_md',
  },
  panel: {
    display: 'grid',
    gridTemplateRows: { default: '0fr', '[data-open]': '1fr' },
    transitionProperty: 'grid-template-rows',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
  clip: { overflow: 'hidden', minHeight: 0 },
  content: {
    paddingBlock: '0.25em 1em',
    paddingInline: '_lg',
    fontSize: '_sm',
    lineHeight: '1.6',
    color: '_textMuted',
  },
});

/** 折叠面板（div > 各项） */
export const Collapse = _component(
  ({
    _value: value = _bindable<string[] | string | null>([]),
    accordion = false,
    onChange,
    children,
    ...rest
  }: CollapseProps) => {
    CollapseContext.provide({
      isOpen: (name) => (Array.isArray(value) ? value.includes(name) : value === name),
      toggle(name) {
        if (accordion) value = value === name ? null : name;
        else {
          const list = Array.isArray(value) ? value : [];
          value = list.includes(name) ? list.filter((item) => item !== name) : [...list, name];
        }
        onChange?.(value);
      },
    });
    return () => <div {...mergeAttrs<'div'>({ sx: collapseStyles.root }, rest)}>{children}</div>;
  },
);

/** 未声明的属性落到这一项的根元素（div）上 */
export interface CollapseItemProps extends PartProps<'div', 'title'> {
  /** 名字：展开的状态按它记 */
  name: string;
  /** 标题 */
  title: VNodeChild;
  /** 标题右边的值 */
  value?: VNodeChild;
  /** 不能展开 */
  disabled?: boolean;
  /** 展开的内容 */
  children?: VNodeChild;
  /** 标题栏（button）的部件属性 */
  propsHeader?: PartProps<'button'>;
  /** 内容的部件属性 */
  propsContent?: PartProps<'div'>;
}

/** 折叠面板的一项（div > 标题栏 button[aria-expanded] + 内容） */
export const CollapseItem = _component(
  ({
    name,
    title,
    value,
    disabled = false,
    children,
    propsHeader,
    propsContent,
    ...rest
  }: CollapseItemProps) => {
    const collapse = CollapseContext.inject();
    return () => {
      const open = collapse.isOpen(name);
      const state = dataAttrs({ 'data-open': open });
      return (
        <div {...mergeAttrs<'div'>({ sx: collapseStyles.item }, rest, state)}>
          <button
            {...mergeAttrs<'button'>({ sx: collapseStyles.header }, propsHeader, {
              type: 'button',
              disabled,
              'aria-expanded': open ? 'true' : 'false',
              onClick: () => collapse.toggle(name),
            })}
          >
            <span {...mergeAttrs<'span'>({ sx: collapseStyles.title })}>{title}</span>
            {hasContent(value) && (
              <span {...mergeAttrs<'span'>({ sx: collapseStyles.value })}>{value}</span>
            )}
            <Icon icon={ChevronDown} sx={collapseStyles.arrow} {...state} />
          </button>
          <div {...mergeAttrs<'div'>({ sx: collapseStyles.panel }, state)}>
            <div {...mergeAttrs<'div'>({ sx: collapseStyles.clip })}>
              <div {...mergeAttrs<'div'>({ sx: collapseStyles.content }, propsContent)}>
                {children}
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
);

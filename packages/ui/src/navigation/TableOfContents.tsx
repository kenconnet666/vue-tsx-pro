/**
 * 本页目录：列出页面的各节标题，滚动时高亮正在读的一节（useScrollSpy），侧边的指示条滑过去（useActiveIndicator）。
 *
 *   <TableOfContents items={[{ id: 'install', label: '安装', level: 2 }, …]} />
 *
 * 目录项可以手写，也可以在页面渲染后用 collectHeadings(article) 从带 id 的标题收集。
 * 链接是普通的页内锚点（#install）：标题的 scroll-margin 让开粘性顶栏（layoutVars.stickyOffset）。
 * 当前节的链接带 aria-current="location"。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { FlexList, type FlexProps } from '../layout/Flex';
import { toElement } from '../utils/dom/element';
import { useScrollSpy, type HeadingEntry } from '../utils/dom/scroll-spy';
import { useActiveIndicator } from '../utils/motion/active-indicator';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { t } from '../config/theme/tokens';

/** 未声明的属性落到 nav 上；原生的 title 属性（悬停提示）让给目录的标题 */
export interface TableOfContentsProps extends PartProps<'nav', 'aria-labelledby' | 'title'> {
  /** 目录项：标题的 id、文字与级别（2 级起，每深一级多缩进一档） */
  items: readonly HeadingEntry[];
  /** 目录的标题，同时是导航的名称；默认取语言包（本页目录） */
  title?: VNodeChild;
  /** 页面在哪个容器里滚动；不写时是窗口 */
  scrollRoot?: HTMLElement | null;
  /** 标题的部件属性 */
  propsTitle?: Partial<TextProps>;
  /** 列表（ul）的部件属性 */
  propsList?: Partial<FlexProps<'ul'>>;
  /** 链接的部件属性 */
  propsLink?: PartProps<'a'>;
}

/** TableOfContents 的样式：title、list、indicator、link、current */
export const tableOfContentsStyles = stylex.create({
  title: { display: 'block', marginBlockEnd: '_sm' },
  // 指示条按链接的 offsetTop 定位：列表是它的定位容器
  list: {
    position: 'relative',
    borderInlineStartWidth: '_xs',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_border',
  },
  indicator: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineStart: 0,
    // 盖住列表左边的细线
    marginInlineStart: `calc(-1 * ${t.borderWidths.xs})`,
    width: '_borderWidths.sm',
    borderRadius: '_full',
    backgroundColor: '_accent',
  },
  link: {
    display: 'block',
    paddingBlock: '_xs',
    paddingInlineEnd: '_xs',
    borderRadius: '_xs',
    color: { default: '_textMuted', ':hover': '_text' },
    fontSize: '_sm',
    lineHeight: '_snug',
    textDecoration: 'none',
    transition: `color ${t.durations.sm} ${t.easings.standard}`,
  },
  current: { color: { default: '_accentText', ':hover': '_accentText' } },
  // 按级别缩进：2 级贴着细线留一档，往下每级多一档
  indent: (level: number) => ({ paddingInlineStart: `calc(${Math.max(level - 1, 1)} * 0.75em)` }),
});

/** 本页目录（nav）：滚动时高亮当前节 */
export const TableOfContents = _component(
  ({
    items,
    title,
    scrollRoot,
    propsTitle,
    propsList,
    propsLink,
    ...rest
  }: TableOfContentsProps) => {
    const lang = useLang();
    const titleId = useId();
    let list = _state.raw<HTMLElement | null>(null);
    let indicator = _state.raw<HTMLElement | null>(null);
    const current = useScrollSpy(() => ({
      ids: items.map((item) => item.id),
      root: scrollRoot,
    }));
    useActiveIndicator(() => ({
      container: list,
      indicator,
      active: '[aria-current="location"]',
      axis: 'vertical',
      value: current.value,
    }));

    return () => (
      <nav {...mergeAttrs<'nav'>({}, rest, { 'aria-labelledby': titleId })}>
        <Text
          {...mergePartProps<TextProps>(
            { sx: tableOfContentsStyles.title, size: 'sm', weight: 'semibold' },
            propsTitle,
            { id: titleId },
          )}
        >
          {title ?? lang.tableOfContents}
        </Text>
        <FlexList
          {...mergePartProps<FlexProps<'ul'>>(
            { sx: tableOfContentsStyles.list, direction: 'column' },
            propsList,
            { ref: (value: unknown) => (list = toElement(value)) },
          )}
        >
          {current.value !== undefined && (
            <span
              {...mergeAttrs<'span'>({ sx: tableOfContentsStyles.indicator })}
              ref={_toRef(indicator)}
              aria-hidden="true"
            />
          )}
          {items.map((item) => (
            <li key={item.id}>
              <a
                {...mergeAttrs<'a'>(
                  {
                    sx: [
                      tableOfContentsStyles.link,
                      tableOfContentsStyles.indent(item.level),
                      current.value === item.id && tableOfContentsStyles.current,
                      focusRingStyles.visible,
                    ],
                  },
                  propsLink,
                  {
                    href: `#${item.id}`,
                    'aria-current': current.value === item.id ? 'location' : undefined,
                  },
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </FlexList>
      </nav>
    );
  },
);

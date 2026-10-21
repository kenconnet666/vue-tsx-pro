/**
 * 页头：面包屑、返回、页面标题与旁边的状态标记、说明、结束边的操作，下面还能放页签或筛选。后台每一页的第一块。
 *
 *   <PageHeader
 *     breadcrumbs={[{ label: '降本任务', href: '/tasks' }, { label: 'DJ-2026-FC-1' }]}
 *     back="/tasks"
 *     title="机型 A 平尾翼根整流罩设计优化"
 *     meta={<StatusBadge statuses={taskStatuses} value="verifying" />}
 *     description="复合材料中心 · 林小满 · 2026 年完成"
 *     actions={<><Button variant="outline" tone="neutral">导出</Button><Button>编辑</Button></>}
 *   >
 *     <Tabs …/>
 *   </PageHeader>
 *
 * 标题是 h1（headingLevel 可改），字号比文章的 h1 小一档，适合后台；操作在宽屏时与标题同一行、窄了换到下一行。
 * back 是地址时渲染成链接（走路由适配），是函数时渲染成按钮。
 *
 * 部件：Root（div）、Breadcrumbs、Row（div，标题行）、Back（IconLinkButton / IconButton）、Heading（h1–h6）、
 * Meta（span）、Description（Text）、Actions（div）、Footer（div，children）。
 */
import { ArrowLeft } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { H1, H2, H3, H4, H5, H6, type HeadingProps } from '../base/Heading';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { IconLinkButton, type IconLinkButtonProps } from '../base/IconLinkButton';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { Breadcrumbs, type BreadcrumbItem, type BreadcrumbsProps } from '../navigation/Breadcrumbs';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 原生的 title 属性（悬停提示）让给页面标题 */
export type PageHeaderManaged = 'title';

/** 未声明的属性落到外层 div 上 */
export interface PageHeaderProps extends PartProps<'div', PageHeaderManaged> {
  /** 页面标题 */
  title: VNodeChild;
  /** 标题旁边的内容：状态标记、编号 */
  meta?: VNodeChild;
  /** 标题下面的说明 */
  description?: VNodeChild;
  /** 面包屑的路径；最后一项是当前页 */
  breadcrumbs?: readonly BreadcrumbItem[];
  /** 返回：地址（链接，走路由适配）或函数（按钮）；在标题前放一个返回箭头 */
  back?: string | (() => void);
  /** 结束边的操作：按钮、菜单 */
  actions?: VNodeChild;
  /** 标题的级别（h1–h6），默认 1 */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 面包屑的部件属性 */
  propsBreadcrumbs?: Partial<BreadcrumbsProps>;
  /** 标题行的部件属性 */
  propsRow?: PartProps<'div'>;
  /** 标题块（返回箭头与标题文字）的部件属性 */
  propsTitleBlock?: PartProps<'div'>;
  /** 标题文字（标题一行与说明）的部件属性 */
  propsTitleText?: PartProps<'div'>;
  /** 标题一行（标题与旁边的内容）的部件属性 */
  propsTitleLine?: PartProps<'div'>;
  /** 返回按钮的部件属性（链接或按钮） */
  propsBack?: Partial<IconLinkButtonProps> & Partial<IconButtonProps>;
  /** 标题的部件属性 */
  propsHeading?: Partial<HeadingProps>;
  /** 标题旁内容的部件属性 */
  propsMeta?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 操作区的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 底部（children）的部件属性 */
  propsFooter?: PartProps<'div'>;
  /** 标题下方的内容：页签、筛选、统计 */
  children?: VNodeChild;
}

const HEADINGS = { 1: H1, 2: H2, 3: H3, 4: H4, 5: H5, 6: H6 } as const;

/** PageHeader 的样式：root、row、titleBlock、back、titleText、titleLine、meta、description、actions、footer */
export const pageHeaderStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: '_lg',
    rowGap: '_sm',
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_sm',
    flexGrow: 1,
    flexBasis: '20em',
    minWidth: 0,
  },
  // 返回箭头与标题的第一行垂直居中：标题行高约 1.25em × 字号
  back: { flexShrink: 0, marginBlockStart: '0.1em' },
  titleText: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  titleLine: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: '_sm',
    rowGap: '_xs',
  },
  meta: { display: 'inline-flex', alignItems: 'center', gap: '_xs', flexWrap: 'wrap' },
  // 比所在文字小一档（0.93em ≈ 默认字号下的 sm）
  description: { fontSize: '0.93em' },
  actions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '_sm',
    marginInlineStart: 'auto',
  },
  footer: { marginBlockStart: '_xs' },
});

/** 页头：面包屑、返回、标题与状态、说明、操作，下面放页签或筛选 */
export const PageHeader = _component(
  ({
    title,
    meta,
    description,
    breadcrumbs,
    back,
    actions,
    headingLevel = 1,
    propsBreadcrumbs,
    propsRow,
    propsTitleBlock,
    propsTitleText,
    propsTitleLine,
    propsBack,
    propsHeading,
    propsMeta,
    propsDescription,
    propsActions,
    propsFooter,
    children,
    ...rest
  }: PageHeaderProps) => {
    const lang = useLang();
    return () => {
      const Heading = HEADINGS[headingLevel];
      const backButton =
        back == null ? null : typeof back === 'string' ? (
          <IconLinkButton
            {...mergePartProps<IconLinkButtonProps>(
              {
                href: back,
                icon: ArrowLeft,
                'aria-label': lang.back,
                variant: 'ghost',
                tone: 'neutral',
                sx: pageHeaderStyles.back,
              },
              propsBack,
            )}
          />
        ) : (
          <IconButton
            {...mergePartProps<IconButtonProps>(
              {
                icon: ArrowLeft,
                'aria-label': lang.back,
                variant: 'ghost',
                tone: 'neutral',
                sx: pageHeaderStyles.back,
                onClick: back,
              },
              propsBack,
            )}
          />
        );
      return (
        <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.root }, rest)}>
          {breadcrumbs != null && (
            <Breadcrumbs
              {...mergePartProps<BreadcrumbsProps>({ items: breadcrumbs }, propsBreadcrumbs)}
            />
          )}
          <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.row }, propsRow)}>
            <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.titleBlock }, propsTitleBlock)}>
              {backButton}
              <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.titleText }, propsTitleText)}>
                <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.titleLine }, propsTitleLine)}>
                  <Heading {...mergePartProps<HeadingProps>({ size: 'xxl' }, propsHeading)}>
                    {title}
                  </Heading>
                  {meta != null && (
                    <span {...mergeAttrs<'span'>({ sx: pageHeaderStyles.meta }, propsMeta)}>
                      {meta}
                    </span>
                  )}
                </div>
                {description != null && (
                  <Text
                    {...mergePartProps<TextProps>(
                      { tone: 'muted', sx: pageHeaderStyles.description },
                      propsDescription,
                    )}
                  >
                    {description}
                  </Text>
                )}
              </div>
            </div>
            {actions != null && (
              <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.actions }, propsActions)}>
                {actions}
              </div>
            )}
          </div>
          {children != null && (
            <div {...mergeAttrs<'div'>({ sx: pageHeaderStyles.footer }, propsFooter)}>
              {children}
            </div>
          )}
        </div>
      );
    };
  },
);

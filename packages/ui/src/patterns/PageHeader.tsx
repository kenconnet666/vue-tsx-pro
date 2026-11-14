/**
 * 页头（header）：面包屑、返回、标题与标记、说明、结束边的操作，下面还可以放摘要或标签页。列表页、详情页、表单页
 * 开头都是这一块，不用每页自己拿 Flex 拼。参考 Ant Design 的 PageHeader、GitHub Primer 的 PageHeader。
 *
 *   <PageHeader
 *     breadcrumbs={[{ label: '采购单', href: '/orders' }, { label: order.id }]}
 *     title={order.id}
 *     meta={<Badge tone="success">已到货</Badge>}
 *     description="华辰精密 · 2026-10-20 下单"
 *     actions={<><Button variant="outline">编辑</Button><Button>催单</Button></>}
 *     onBack={() => router.back()}
 *   />
 *
 * - 标题是 h1（headingLevel 可改），标题与说明在 hgroup 里；放不下时操作换到下一行，手机上标题占满一行。
 * - 返回：给 onBack 是按钮，给 backHref 是链接（能在新标签页打开）；名称取文案（“返回”）。
 * - children 放在最下面：摘要（Descriptions）、标签页（TabList）。
 *
 * 部件：Root（header）、Breadcrumbs、Main（标题行，div）、Back、Heading（hgroup）、TitleRow（div）、Title（H1–H3）、
 * Meta（div）、Description（Paragraph）、Actions（div）。
 */
import { ArrowLeft } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { H1, H2, H3, type HeadingProps } from '../base/Heading';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { IconLinkButton, type IconLinkButtonProps } from '../base/IconLinkButton';
import { Paragraph, type TextProps } from '../base/Text';
import { useMessages } from '../config/lang/messages';
import { partAttrs } from '../config/styles';
import { Breadcrumbs, type BreadcrumbItem, type BreadcrumbsProps } from '../navigation/Breadcrumbs';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 未声明的属性落到 header 上 */
export interface PageHeaderProps extends PartProps<'header', 'title'> {
  /** 标题 */
  title: VNodeChild;
  /** 标题下面的说明 */
  description?: VNodeChild;
  /**
   * 标题的级别：整页的页头是 1；嵌在页面里的一块（抽屉、分栏的右侧）用 2、3
   * @default 1
   */
  headingLevel?: 1 | 2 | 3;
  /** 面包屑：最后一项是当前页 */
  breadcrumbs?: readonly BreadcrumbItem[];
  /** 标题后面的标记：状态、标签 */
  meta?: VNodeChild;
  /** 结束边的操作：按钮；放不下时换到标题下面一行 */
  actions?: VNodeChild;
  /** 点了返回（给了它就显示返回按钮） */
  onBack?: () => void;
  /** 返回的地址：给了它返回是一个链接；和 onBack 都给时用链接，点击时也调用 onBack */
  backHref?: string;
  /** 面包屑的部件属性 */
  propsBreadcrumbs?: Partial<BreadcrumbsProps>;
  /** 标题行（返回、标题、操作）的部件属性 */
  propsMain?: PartProps<'div'>;
  /** 返回按钮的部件属性（给了 backHref 时是图标链接按钮） */
  propsBack?: Partial<IconButtonProps & IconLinkButtonProps>;
  /** 标题与说明外层（hgroup）的部件属性 */
  propsHeading?: PartProps<'hgroup'>;
  /** 标题与标记那一行的部件属性 */
  propsTitleRow?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: Partial<HeadingProps>;
  /** 标记外层的部件属性 */
  propsMeta?: PartProps<'div'>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps<'p'>>;
  /** 操作外层的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 页头下面的内容：摘要、标签页 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="page-header"） */
const pageHeaderPart = (part: string) => partAttrs({ name: 'PageHeader' }, part);

/** PageHeader 的样式：root、main、back、heading、titleRow、meta、actions */
const pageHeaderStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_md', minWidth: 0 },
  // 标题一侧尽量宽，操作靠结束边；放不下时操作整块换到下一行
  main: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '_md', minWidth: 0 },
  back: { flexShrink: 0 },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    flexGrow: 1,
    flexBasis: '16rem',
    minWidth: 0,
    margin: 0,
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '_md',
    rowGap: '_xs',
  },
  meta: { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '_xs' },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '_sm',
    marginInlineStart: 'auto',
  },
});

const HEADINGS = { 1: H1, 2: H2, 3: H3 } as const;

/** 页头：面包屑、返回、标题、说明、操作 */
export const PageHeader = _component(
  ({
    title,
    description,
    headingLevel = 1,
    breadcrumbs,
    meta,
    actions,
    onBack,
    backHref,
    propsBreadcrumbs,
    propsMain,
    propsBack,
    propsHeading,
    propsTitleRow,
    propsTitle,
    propsMeta,
    propsDescription,
    propsActions,
    children,
    ...rest
  }: PageHeaderProps) => {
    const messages = useMessages('patterns', patternsMessages);

    function renderBack(): VNodeChild {
      if (backHref == null && !onBack) return null;
      const shared = {
        icon: ArrowLeft,
        variant: 'ghost',
        tone: 'neutral',
        propsIcon: { flipInRtl: true },
        'aria-label': messages.pageHeaderBack,
        sx: pageHeaderStyles.back,
        ...pageHeaderPart('back'),
      } as const;
      return backHref != null ? (
        <IconLinkButton
          {...mergePartProps<IconLinkButtonProps>({ ...shared, href: backHref }, propsBack, {
            onClick: () => onBack?.(),
          })}
        />
      ) : (
        <IconButton
          {...mergePartProps<IconButtonProps>(shared, propsBack, { onClick: () => onBack?.() })}
        />
      );
    }

    return () => {
      const Title = HEADINGS[headingLevel];
      return (
        <header
          {...mergeAttrs<'header'>({ sx: pageHeaderStyles.root, ...pageHeaderPart('root') }, rest)}
        >
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              {...mergePartProps<BreadcrumbsProps>(
                { items: breadcrumbs, ...pageHeaderPart('breadcrumbs') },
                propsBreadcrumbs,
              )}
            />
          )}
          <div
            {...mergeAttrs<'div'>(
              { sx: pageHeaderStyles.main, ...pageHeaderPart('main') },
              propsMain,
            )}
          >
            {renderBack()}
            <hgroup
              {...mergeAttrs<'hgroup'>(
                { sx: pageHeaderStyles.heading, ...pageHeaderPart('heading') },
                propsHeading,
              )}
            >
              <div
                {...mergeAttrs<'div'>(
                  { sx: pageHeaderStyles.titleRow, ...pageHeaderPart('titleRow') },
                  propsTitleRow,
                )}
              >
                <Title
                  {...mergePartProps<HeadingProps>(
                    { size: 'xxl', ...pageHeaderPart('title') },
                    propsTitle,
                  )}
                >
                  {title}
                </Title>
                {hasContent(meta) && (
                  <div
                    {...mergeAttrs<'div'>(
                      { sx: pageHeaderStyles.meta, ...pageHeaderPart('meta') },
                      propsMeta,
                    )}
                  >
                    {meta}
                  </div>
                )}
              </div>
              {hasContent(description) && (
                <Paragraph
                  {...mergePartProps<TextProps<'p'>>(
                    { tone: 'muted', ...pageHeaderPart('description') },
                    propsDescription,
                  )}
                >
                  {description}
                </Paragraph>
              )}
            </hgroup>
            {hasContent(actions) && (
              <div
                {...mergeAttrs<'div'>(
                  { sx: pageHeaderStyles.actions, ...pageHeaderPart('actions') },
                  propsActions,
                )}
              >
                {actions}
              </div>
            )}
          </div>
          {children}
        </header>
      );
    };
  },
);

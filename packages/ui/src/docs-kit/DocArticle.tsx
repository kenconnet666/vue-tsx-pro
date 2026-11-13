/**
 * 文档页的骨架：一篇文章（DocArticle：标题、简介、正文）与里面的一节（DocSection：带锚点的标题、内容）。
 * 字号比界面文字大一号、行距宽松，间距以 em 计随之放大；页面的宽度由外面的 Container 决定。
 *
 *   <DocArticle title="快速开始" description="两分钟跑起来">
 *     <DocSection id="install" title="安装">…</DocSection>
 *   </DocArticle>
 *
 * 部件：DocArticle 是 Root（article）、Header（div）、Title（H1）、Description（Paragraph）；
 * DocSection 是 Root（section）、Title（H2）。标题的 id 进 TableOfContents。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { H1, H2, type HeadingProps } from '../base/Heading';
import { Paragraph, type TextProps } from '../base/Text';
import { hasContent, mergeAttrs, mergeProps, type PartProps } from '../utils/props';

/** 未声明的属性落到 article 上 */
export interface DocArticleProps extends PartProps<'article', 'title'> {
  /** 标题 */
  title?: VNodeChild;
  /** 简介 */
  description?: VNodeChild;
  /** 简介下面、正文之前的内容：导入语句之类 */
  lead?: VNodeChild;
  /** 头部（标题、简介、lead 外面的 div）的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: Partial<HeadingProps>;
  /** 简介的部件属性 */
  propsDescription?: Partial<TextProps>;
  children?: VNodeChild;
}

/** DocArticle、DocSection 的样式：article、header、description、section */
const docArticleStyles = css.create({
  // 长文阅读：比界面文字（14px）大一号、行距宽松
  article: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
    minWidth: 0,
    fontSize: '15px',
    lineHeight: '_relaxed',
  },
  header: { display: 'flex', flexDirection: 'column', gap: '_lg' },
  // 简介保持适合阅读的行宽，宽版面时也不拉满
  description: { maxWidth: '48rem', lineHeight: '_relaxed' },
  section: { display: 'flex', flexDirection: 'column', gap: '_lg', minWidth: 0 },
});

/** 文档页的骨架：标题、简介与正文 */
export const DocArticle = _component(
  ({
    title,
    description,
    lead,
    propsHeader,
    propsTitle,
    propsDescription,
    children,
    ...rest
  }: DocArticleProps) =>
    () => (
      <article {...mergeAttrs<'article'>({ sx: docArticleStyles.article }, rest)}>
        <div {...mergeAttrs<'div'>({ sx: docArticleStyles.header }, propsHeader)}>
          <H1 {...propsTitle}>{title}</H1>
          {hasContent(description) && (
            <Paragraph
              {...mergeProps<TextProps>(
                { size: 'lg', tone: 'muted', sx: docArticleStyles.description },
                propsDescription,
              )}
            >
              {description}
            </Paragraph>
          )}
          {lead}
        </div>
        {children}
      </article>
    ),
);

/** 未声明的属性落到 section 上 */
export interface DocSectionProps extends PartProps<'section', 'id' | 'title'> {
  /** 标题的 id：锚点，也进本页目录 */
  id: string;
  /** 标题 */
  title?: VNodeChild;
  /** 标题的部件属性 */
  propsTitle?: Partial<HeadingProps>;
  children?: VNodeChild;
}

/** 文档页的一节：带锚点的标题与内容 */
export const DocSection = _component(
  ({ id, title, propsTitle, children, ...rest }: DocSectionProps) =>
    () => (
      <section {...mergeAttrs<'section'>({ sx: docArticleStyles.section }, rest)}>
        <H2 {...mergeProps<HeadingProps>({ id, size: 'xl', anchor: true }, propsTitle)}>{title}</H2>
        {children}
      </section>
    ),
);

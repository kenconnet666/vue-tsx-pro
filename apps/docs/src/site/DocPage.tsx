/**
 * 文档页的骨架：标题、简介、导入语句，后面是各个示例与 API。组件页与指南页都用它。
 * 组件页加 wide：内容区放宽，示例（Examples）在宽屏时分两列；指南页保持适合阅读的宽度。
 *
 *   export const meta = { title: 'Button 按钮', description: '触发一个操作', order: 1 };
 *   export default _component(() => () => (
 *     <DocPage meta={meta} imports="import { Button } from '@vue-tsx-pro/ui';">…</DocPage>
 *   ));
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { CodeBlock, Container, createFlex, Flex, H1, Paragraph } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import type { PageMeta } from './types';

const styles = stylex.create({
  // 长文阅读：比界面文字（14px）大一号、行距宽松；间距以 em 计，随之放大。示例的效果区会改回界面字号
  article: { gap: '3rem', fontSize: '15px', lineHeight: '_relaxed' },
  header: { gap: '_lg' },
  // 简介保持适合阅读的行宽，宽版面时也不拉满
  lead: { maxWidth: '48rem', lineHeight: '_relaxed' },
});

/** 页面正文是一篇文章（article） */
const Article = createFlex('article', 'DocArticle');

/** DocPage 的属性 */
export interface DocPageProps {
  /** 页面的 meta：标题与简介 */
  meta: PageMeta;
  /** 导入语句：组件页给出从哪里导入 */
  imports?: string;
  /** 宽版面：组件页用，示例在宽屏时分两列 */
  wide?: boolean;
  children?: VNodeChild;
}

/** 文档页：标题、简介、导入语句与正文 */
export const DocPage = _component(
  ({ meta, imports, wide = false, children }: DocPageProps) =>
    () => (
      <Container size={wide ? 'xl' : 'md'} padding="none">
        <Article direction="column" sx={styles.article}>
          <Flex direction="column" sx={styles.header}>
            <H1>{meta.title}</H1>
            <Paragraph size="lg" tone="muted" sx={styles.lead}>
              {meta.description}
            </Paragraph>
            {imports && <CodeBlock code={imports} lang="ts" />}
          </Flex>
          {children}
        </Article>
      </Container>
    ),
);

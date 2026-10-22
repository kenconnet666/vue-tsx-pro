/** 设计规格页的骨架：标题、简介与正文，宽度适合阅读 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Container, createFlex, Flex, H1, Paragraph } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

const styles = stylex.create({
  // 长文阅读：比界面文字大一号、行距宽松；间距以 em 计，随之放大
  article: { gap: '3rem', fontSize: '15px', lineHeight: '_relaxed', paddingBlock: '2.5rem' },
  header: { gap: '_lg' },
  lead: { maxWidth: '48rem', lineHeight: '_relaxed' },
});

const Article = createFlex('article', 'DocArticle');

/** DocPage 的属性 */
export interface DocPageProps {
  /** 标题与简介 */
  meta: { title: string; description: string };
  children?: VNodeChild;
}

/** 设计规格页：标题、简介与正文 */
export const DocPage = _component(({ meta, children }: DocPageProps) => () => (
  <Container size="md">
    <Article direction="column" sx={styles.article}>
      <Flex direction="column" sx={styles.header}>
        <H1>{meta.title}</H1>
        <Paragraph size="lg" tone="muted" sx={styles.lead}>
          {meta.description}
        </Paragraph>
      </Flex>
      {children}
    </Article>
  </Container>
));

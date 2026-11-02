/**
 * 文档页的骨架：标题、简介、导入语句，后面是各个示例与 API。组件页与指南页都用它。
 * 组件页加 wide：内容区放宽，示例（Examples）在宽屏时分两列；指南页保持适合阅读的宽度。
 *
 *   export const meta = { title: 'Button 按钮', description: '触发一个操作', order: 1 };
 *   export default _component(() => () => (
 *     <DocPage meta={meta} imports="import { Button } from '@zerodep-dev/vue-tsx-pro-ui';">…</DocPage>
 *   ));
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { CodeBlock, Container } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocArticle } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';
import type { VNodeChild } from 'vue';
import type { PageMeta } from './types';

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
        <DocArticle
          title={meta.title}
          description={meta.description}
          lead={imports && <CodeBlock code={imports} lang="ts" />}
        >
          {children}
        </DocArticle>
      </Container>
    ),
);

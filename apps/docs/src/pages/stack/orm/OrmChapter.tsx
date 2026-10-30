/**
 * ORM 分区的章节页：标题、与官方文档的对应、若干小节（段落、代码、列表）。各章只写数据，
 * 段落里用反引号包起来的部分渲染成行内代码。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../../site/DocPage';

export interface OrmSection {
  /** 锚点 */
  readonly id: string;
  readonly title: string;
  /** 段落：反引号里的是行内代码 */
  readonly text?: string;
  readonly code?: string;
  /** 代码块的标题 */
  readonly file?: string;
  readonly items?: readonly string[];
}

export interface OrmChapterSpec {
  readonly meta: { readonly title: string; readonly description: string };
  /** 对应官方文档的哪些页 */
  readonly official: string;
  readonly sections: readonly OrmSection[];
}

/** `a` 段落 → 文字与行内代码交替 */
function inline(text: string) {
  return text.split('`').map((part, i) => (i % 2 === 1 ? <Code>{part}</Code> : part));
}

export function ormChapter(spec: OrmChapterSpec) {
  return _component(() => () => (
    <DocPage meta={spec.meta}>
      <Paragraph>{inline(`对应官方文档：${spec.official}。`)}</Paragraph>
      {spec.sections.map((s) => [
        <H2 id={s.id} size="xl" anchor>
          {s.title}
        </H2>,
        s.text ? <Paragraph>{inline(s.text)}</Paragraph> : null,
        s.code ? <CodeBlock title={s.file ?? s.title} code={s.code} lang="ts" /> : null,
        s.items ? (
          <List>
            {s.items.map((item) => (
              <ListItem>{inline(item)}</ListItem>
            ))}
          </List>
        ) : null,
      ])}
    </DocPage>
  ));
}

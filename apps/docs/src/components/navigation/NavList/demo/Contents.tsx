import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  H3,
  H4,
  Paragraph,
  ScrollArea,
  TableOfContents,
  toElement,
  type HeadingEntry,
} from '@zerodep-dev/vue-tsx-pro-ui';

// id 带前缀：页面上的锚点不能重名
const headings: HeadingEntry[] = [
  { id: 'toc-demo-install', label: '安装', level: 2 },
  { id: 'toc-demo-npm', label: '用 npm 安装', level: 3 },
  { id: 'toc-demo-cdn', label: '用 CDN 引入', level: 3 },
  { id: 'toc-demo-usage', label: '使用', level: 2 },
  { id: 'toc-demo-theme', label: '主题', level: 2 },
  { id: 'toc-demo-faq', label: '常见问题', level: 2 },
];

const filler =
  '组件库按需引入，样式在用到时才生成，页面只带用到的部分。每个组件都可以用 sx 覆盖样式，用 propsXxx 给内部的部件加属性。';

const styles = css.create({
  layout: { display: 'grid', gridTemplateColumns: '1fr 9rem', gap: '_lg', alignItems: 'start' },
  article: { height: '18rem' },
  content: { display: 'grid', gap: '_md', paddingInlineEnd: '_md' },
});

export default _component(() => {
  let scroller = _state.raw<HTMLElement | null>(null);
  return () => (
    <Card>
      <div {...css.attrs(styles.layout)}>
        <ScrollArea
          sx={styles.article}
          propsViewport={{
            ref: (element) => (scroller = toElement(element)),
            'aria-label': '文章',
          }}
        >
          <div {...css.attrs(styles.content)}>
            {headings.map((heading) => {
              const Heading = heading.level === 2 ? H3 : H4;
              return (
                <>
                  <Heading id={heading.id} size={heading.level === 2 ? 'lg' : 'md'}>
                    {heading.label}
                  </Heading>
                  <Paragraph size="sm">{filler}</Paragraph>
                  <Paragraph size="sm">{filler}</Paragraph>
                </>
              );
            })}
          </div>
        </ScrollArea>
        <TableOfContents items={headings} scrollRoot={scroller} title="本文目录" />
      </div>
    </Card>
  );
});

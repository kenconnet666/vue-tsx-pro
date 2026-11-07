import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
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

// 每一节的正文
const sections: Record<string, string[]> = {
  'toc-demo-install': ['支持 Vue 3.5 以上与 Vite 6 以上；组件按需引入，样式在用到时才生成。'],
  'toc-demo-npm': [
    '用 pnpm add 安装组件库与 TSX 运行时两个包，再在 vite.config.ts 里加上插件。',
    '升级时两个包一起升到同一个版本，发布说明里写了每一版对使用方的变化。',
  ],
  'toc-demo-cdn': [
    '没有构建工具的页面可以从 CDN 引入打包好的 ES 模块，用 import map 指向 Vue。',
    '这种方式没有按需生成样式，页面会带上全部组件的样式，适合原型与演示。',
  ],
  'toc-demo-usage': [
    '在 main.ts 里调用 app.use(createUi())，之后在任意组件里直接写 Button、Field。',
    '每个组件都能用 sx 覆盖样式，用 propsXxx 给里面的部件加属性，层层合并。',
  ],
  'toc-demo-theme': [
    '内置十几套主题，createUi 的 theme 指定默认主题，Provider 可以给一块区域换主题。',
    '主题定制页能实时调品牌色、圆角、缩放并检查对比度，导出的代码直接粘进项目。',
  ],
  'toc-demo-faq': [
    '服务端渲染时样式随页面一起输出，水合后不会闪；内容安全策略用 nonce 放行。',
    '要改某个组件全站的默认值，写在 createUi 的 defaults 里，不用每处都传。',
  ],
};

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
                  {sections[heading.id]!.map((text) => (
                    <Paragraph size="sm">{text}</Paragraph>
                  ))}
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

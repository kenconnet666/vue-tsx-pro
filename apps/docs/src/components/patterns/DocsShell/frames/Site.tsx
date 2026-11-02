// 一个文档站：写一份导航，侧栏、搜索、翻页都有了；这个示例的“路由”是一个状态，真实项目传 route.path 和 router.push
import { BookOpen } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  createThemePreference,
  darkTheme,
  lightTheme,
  Paragraph,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { DocArticle, DocSection, DocsShell } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';

const preference = createThemePreference({
  themes: { light: lightTheme, dark: darkTheme },
  storageKey: 'demo-docs-shell-theme',
});

const sections = [
  {
    label: '开始',
    pages: [
      { path: '#intro', title: '介绍', description: '它是做什么的' },
      { path: '#install', title: '安装', description: '用 `pnpm` 装好依赖' },
    ],
  },
  {
    label: '进阶',
    pages: [{ path: '#theming', title: '主题', description: '换一套配色' }],
  },
];

export default _component(() => {
  let path = _state('#intro');
  const page = () =>
    sections.flatMap((section) => section.pages).find((item) => item.path === path);
  return () => (
    <DocsShell
      name="示例文档"
      icon={BookOpen}
      sections={sections}
      path={path}
      onNavigate={(next) => (path = next)}
      preference={preference}
      repository="https://github.com/kenconnet666/vue-tsx-pro"
      headingSelector="h2[id]"
      pageTitle={page()?.title}
    >
      <DocArticle title={page()?.title} description={page()?.description?.replaceAll('`', '')}>
        <DocSection id="first" title="第一节">
          <Paragraph>正文写在这里。右边的本页目录从正文的标题收集。</Paragraph>
        </DocSection>
        <DocSection id="second" title="第二节">
          <Paragraph>下面是上一篇、下一篇，顶栏的搜索也能找到每一页。</Paragraph>
        </DocSection>
      </DocArticle>
    </DocsShell>
  );
});

import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/DocsShellProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Site from './frames/Site.tsx?demo';

export const meta = {
  title: 'DocsShell 文档站外壳',
  description:
    '文档站的整页骨架：站点名、搜索、主题切换、仓库链接，左侧导航，右侧本页目录，末尾上一篇 / 下一篇。本站和 easy-query TS 的文档站都用它。',
  order: 1.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DocsShell } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';"
  >
    <Example id="site" title="一个文档站" demo={Site} frame="40rem">
      写一份 <Code>sections</Code>
      ，侧栏、搜索、上一篇 / 下一篇都从它取，顺序一致。它不依赖路由库：<Code>path</Code>{' '}
      是当前地址，
      <Code>onNavigate</Code> 是搜索面板里选了一页时怎么跳，导航链接走 <Code>createUi</Code> 的{' '}
      <Code>router</Code>，真实项目里传 <Code>route.path</Code>、<Code>router.push</Code>，正文放{' '}
      <Code>RouterView</Code>。本页目录从正文收集，<Code>headingSelector</Code>{' '}
      可以排除示例里的标题；浏览器标签的标题是“页面标题 · 站点名”，不在导航里的页面用{' '}
      <Code>pageTitle</Code> 给。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));

import { _component } from '@vue-tsx-pro/tsx';
import { Code, CodeBlock } from '@vue-tsx-pro/ui';
import api from 'virtual:api/LoadingBarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Navigation from './demo/Navigation.tsx?demo';

export const meta = {
  title: 'LoadingBar 加载条',
  description: '窗口顶部的一条细线进度：路由切换、整页刷新数据时提示“正在加载”，很快完成的不显示。',
  order: 7,
};

const routerCode = `// loading-bar.ts：应用里创建一次，组件内外都能调用
export const loadingBar = createLoadingBar();

// main.ts：换页时自动 start / finish，跳转失败时 error
useRouteLoadingBar(router, loadingBar);

// App.tsx：放一个
<LoadingBar controller={loadingBar} />`;

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports={
      "import { LoadingBar, createLoadingBar } from '@vue-tsx-pro/ui';\nimport { useRouteLoadingBar } from '@vue-tsx-pro/ui/vue-router';"
    }
  >
    <Example id="navigation" title="换页时的加载" demo={Navigation}>
      控制器加显示（同 Toast）：<Code>createLoadingBar()</Code> 返回控制器，
      <Code>start</Code> 开始、<Code>finish</Code> 走满后淡出、<Code>error</Code>{' '}
      变成危险色走满。不知道真实进度，所以先快后慢地涨，停在 90% 前等完成。<Code>delay</Code>（默认
      200ms）之内就完成的不显示，免得每次切换都闪一下。加载条只是视觉提示：读屏读到的是页面内容区域的{' '}
      <Code>aria-busy</Code> 与“正在加载”的文字。示例把加载条放进了框里（
      <Code>position: absolute</Code>
      ），平时它贴在窗口顶部。
      <Code>useRouteLoadingBar</Code>（子路径 <Code>@vue-tsx-pro/ui/vue-router</Code>）在开始跳转时
      start、跳完 finish，守卫抛错或懒加载的页面加载失败时 error，被取消、重定向的不算失败。
    </Example>
    <CodeBlock code={routerCode} lang="tsx" title="接上路由（本文档站就是这样接的）" />
    <ApiReference api={api} />
  </DocPage>
));

/**
 * 文档站的外壳：DocsShell（站点名、搜索、组件演练场、主题切换、仓库链接，左侧导航，右侧本页目录，上一篇 / 下一篇），
 * 正文是当前路由的页面。
 */
import { Box } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { DocsShell } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { loadingBar } from './site/loading-bar';
import { sections } from './site/nav';
import { PropsPlaygroundButton } from './site/PropsPlaygroundButton';
import { isFrame } from './router';
import { preference } from './site/theme';

export const App = _component(() => {
  const route = useRoute();
  const router = useRouter();

  return () => {
    // 整页示例在 iframe 里单独渲染，不套站点外壳
    if (isFrame) return <RouterView />;
    return (
      <DocsShell
        name="vue-tsx-pro"
        icon={Box}
        sections={sections}
        path={route.path}
        pageTitle={route.meta.title as string | undefined}
        onNavigate={(path) => void router.push(path)}
        preference={preference}
        repository="https://github.com/kenconnet666/vue-tsx-pro"
        loadingBar={loadingBar}
        // 示例里的标题（data-demo 里面）是示例内容，不进本页目录
        headingSelector="h2[id]:not([data-demo] *), h3[id]:not([data-demo] *)"
        tools={<PropsPlaygroundButton />}
        propsPagerContainer={{ size: route.path.startsWith('/components/') ? 'xl' : 'md' }}
      >
        <RouterView />
      </DocsShell>
    );
  };
});

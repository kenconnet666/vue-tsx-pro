/**
 * 全栈：框架（@zerodep-dev/vue-tsx-pro-kit）。Nitro 上按页面选渲染模式、loader、action、请求上下文、会话与权限
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Framework 全栈框架',
  description:
    '组件库 + Nitro：按页面选服务端渲染、浏览器渲染或预渲染；loader 的数据经 json-wire 进页面，action 带类型、按 Standard Schema 校验；请求上下文、会话与权限两端一致。',
};

const pages = `// src/pages.ts（nitro.config.ts 在 Node 里也加载它，只从 kit/page 导入）import { definePages } from '@zerodep-dev/vue-tsx-pro-kit/page';

export const pages = definePages([
  { path: '/', mode: 'ssr', title: '首页', component: () => import('./pages/Home.tsx') },
  { path: '/report', mode: 'csr', title: '报表', component: () => import('./pages/Report.tsx') },
  { path: '/about', mode: 'static', title: '关于', component: () => import('./pages/About.tsx') },
  { path: '/todos', mode: 'ssr', title: '待办', permission: 'todo.read', component: () => import('./pages/Todos.tsx') },
]);`;

const data = `// src/loaders.ts（只在服务端）：服务端渲染时直接调用，浏览器换页时经 /_data 调用
export const loaders = defineLoaders({
  '/todos': () => db.queryable(Todo).orderBy((t) => t.id).toList(),
});

// src/actions.ts（只在服务端）：入参按 zod 校验，要求权限
export const actions = defineActions({
  addTodo: defineAction(
    { input: z.object({ title: z.string().min(1) }), permission: 'todo.write' },
    ({ title }) => db.insert(Todo).values({ title }).returnId(),
  ),
});

// src/client.ts：页面里用，类型从上面推出（只导入类型）
export const usePageData = pageDataHook<typeof loaders>();
export const actions = actionClient<typeof serverActions>();

// 页面里
const data = usePageData('/todos');
await actions.addTodo({ title });
await data.reload();`;

const entries = `// vite.config.ts
plugins: [workspaceSource(), ...vueTsxPro(), kit(), nitro()],

// src/entry-server.ts
export default {
  fetch: createRenderer({ ...app, assets, loaders, actions, createContext, session: sessionOf }),
};

// src/entry-client.ts
startClient(app);`;

export default _component(() => () => (
  <DocPage meta={meta}>
    <H2 id="modes" size="xl" anchor>
      按页面选渲染模式
    </H2>
    <List>
      <ListItem>
        <Code>ssr</Code>
        ：每次请求在服务端渲染，浏览器水合；渲染出错时记下错误、改发空壳由浏览器渲染。
      </ListItem>
      <ListItem>
        <Code>csr</Code>：服务端只发空壳（后台页、只能在浏览器里画的页面）。
      </ListItem>
      <ListItem>
        <Code>static</Code>：构建时预渲染成 HTML（内容不随请求变）；会话在挂载后经{' '}
        <Code>/_session</Code> 取。
      </ListItem>
      <ListItem>
        环境变量 <Code>RENDER_MODE=csr</Code> 整站改成浏览器渲染：服务端渲染出问题时的总开关。
      </ListItem>
    </List>
    <CodeBlock title="pages.ts" code={pages} lang="ts" />
    <H2 id="data" size="xl" anchor>
      数据与写操作
    </H2>
    <Paragraph>
      页面不知道自己是哪种模式：服务端渲染时 loader 的结果写进页面（bigint、Decimal、日期经
      json-wire 原样到浏览器），水合时不重复请求；浏览器里换页、<Code>csr</Code>{' '}
      的页面经接口取。action 在服务端执行，浏览器拿到带类型的调用函数，校验不过抛{' '}
      <Code>ActionError</Code>，<Code>issues</Code> 里是每一处问题。
    </Paragraph>
    <CodeBlock title="loaders.ts、actions.ts、client.ts" code={data} lang="ts" />
    <H2 id="context" size="xl" anchor>
      请求上下文、会话与权限
    </H2>
    <Paragraph>
      <Code>createContext(request)</Code> 的结果放进 AsyncLocalStorage，loader、action
      与它们调用的代码用 <Code>currentContext()</Code>
      取——easy-query 的 <Code>tenant</Code> 拦截器读当前租户，一个 <Code>db</Code>{' '}
      就按租户隔离。会话（当前用户与权限）写进页面，
      <Code>useSession().can('todo.write')</Code> 藏按钮、菜单按权限生成；页面与 action 写了{' '}
      <Code>permission</Code> 的，服务端回 403、不取数据，<Code>PageView</Code> 画“没有权限”。
    </Paragraph>
    <H2 id="setup" size="xl" anchor>
      接线
    </H2>
    <CodeBlock title="入口" code={entries} lang="ts" />
    <Paragraph>
      完整的例子在仓库的 <Code>apps/fullstack-demo</Code>
      （三种模式、loader、action、权限、按租户隔离）与
      <Code>apps/flow-demo</Code>（流程引擎的审批应用）。
    </Paragraph>
  </DocPage>
));

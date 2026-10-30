/**
 * 移动端：@zerodep-dev/vue-tsx-pro-mobile（组件库）与 -mini（小程序运行时）。一份页面代码跑在 H5、微信、支付宝
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Mobile 移动端',
  description:
    '移动端组件库 @zerodep-dev/vue-tsx-pro-mobile 与小程序运行时 -mini：同一份 TSX 页面在 H5、微信小程序、支付宝小程序里运行，样式、主题、表单、浮层、手势三端一致。',
};

const install = `pnpm add @zerodep-dev/vue-tsx-pro-mobile @zerodep-dev/vue-tsx-pro-tsx vue
# 要出小程序时再加
pnpm add -D @zerodep-dev/vue-tsx-pro-mini`;

const h5 = `// vite.config.ts
export default defineConfig({ plugins: vueTsxPro() });

// src/main.ts：最外层一个 ConfigProvider（主题、语言包，也负责挂 Toast、Dialog 这类函数调用的浮层）
createApp(() => (
  <ConfigProvider theme="system">
    <HomePage />
  </ConfigProvider>
)).mount('#app');`;

const mini = `// src/app.ts：声明页面（第一个是首页），页面组件收到 query 属性
import { definePages } from '@zerodep-dev/vue-tsx-pro-mini';
export default definePages({ index: HomePage, detail: DetailPage });

// build.ts：node build.ts 出微信工程；platform: 'my' 出支付宝工程
import { buildMini, watchMini } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

const options = { root: import.meta.dirname, platform: 'wx', plugins: vueTsxPro(), appId: 'wx…', darkmode: true };
if (process.argv.includes('--watch')) await watchMini({ ...options, development: true });
else await buildMini(options);`;

const pageApi = `import { navigateTo, navigateBack, onPageShow, onReachBottom } from '@zerodep-dev/vue-tsx-pro-mini';

onPageShow(() => refresh());            // 每次回到这一页
onReachBottom(() => loadMore());        // 滚到底
navigateTo('detail', { id: 42 });       // 按 definePages 的页面名跳转，参数进 query 属性`;

export default _component(() => () => (
  <DocPage meta={meta}>
    <H2 id="how" size="xl" anchor>
      一份代码，三个宿主
    </H2>
    <List>
      <ListItem>
        <Code>-mobile</Code>
        {
          '：组件库，只依赖 Vue 与 tsx 的样式引擎；用到宿主的地方（测量、滚动、系统信息、选图、震动）都经 '
        }
        <Code>useHost()</Code>
        {'，H5 的实现就在组件库里。'}
      </ListItem>
      <ListItem>
        <Code>-mini</Code>
        {'：小程序运行时。Vue 的自定义渲染器把节点落到一棵树上，每轮变化合成一次 '}
        <Code>setData</Code>
        {
          '；通用模板按层展开，层数用完接递归组件；样式在渲染时展开成行内样式（小程序不能在运行时插规则）；宿主约定的小程序版也在这里。'
        }
      </ListItem>
      <ListItem>
        两个包互不导入，经 <Code>{"Symbol.for('vue-tsx-pro.host')"}</Code> 对接。
      </ListItem>
      <ListItem>
        {'组件库按发布的产物（编译好的 JS）打进小程序，应用自己的 TSX 由 '}
        <Code>vueTsxPro()</Code>
        {' 编译；H5 与小程序用的是同一份组件、同一份页面。'}
      </ListItem>
    </List>

    <H2 id="install" size="xl" anchor>
      安装
    </H2>
    <CodeBlock code={install} lang="shellscript" />

    <H2 id="h5" size="xl" anchor>
      H5
    </H2>
    <Paragraph>和普通的 Vite 应用一样，组件的属性、插槽写法与桌面组件库一致。</Paragraph>
    <CodeBlock title="H5" code={h5} lang="tsx" />

    <H2 id="mini" size="xl" anchor>
      小程序
    </H2>
    <CodeBlock title="app.ts 与 build.ts" code={mini} lang="ts" />
    <List>
      <ListItem>
        产物在 <Code>dist/wx</Code>（或 <Code>dist/my</Code>
        ），用微信开发者工具或支付宝小程序开发者工具打开。
      </ListItem>
      <ListItem>
        监听模式（<Code>watchMini</Code>）：Vue、运行时、组件库单独打成 <Code>vtp-vendor.js</Code>
        ，改了源码只重打应用自己的代码，约 0.3–0.5
        秒，带源码映射；开发者工具看到产物变了会自己重新编译。
      </ListItem>
      <ListItem>
        <Code>darkmode: true</Code> 时微信报告系统的深浅色，<Code>ConfigProvider</Code> 的{' '}
        <Code>theme="system"</Code> 跟着切换。
      </ListItem>
    </List>
    <CodeBlock title="页面的生命周期与跳转" code={pageApi} lang="ts" />

    <H2 id="rules" size="xl" anchor>
      写法约束
    </H2>
    <Paragraph>
      小程序按标签选模板、样式在运行时判定条件，所以页面与组件里只用判定得了的写法（组件库自己由{' '}
      <Code>pnpm layers:check</Code> 检查）：
    </Paragraph>
    <List>
      <ListItem>
        元素：<Code>div</Code>、<Code>span</Code>、<Code>button</Code>、<Code>img</Code>、
        <Code>input</Code>、<Code>textarea</Code>、<Code>svg</Code>。
      </ListItem>
      <ListItem>
        样式条件：属性选择器与条件别名（<Code>_disabled</Code>、<Code>_checked</Code>…）、
        <Code>:active</Code>、<Code>:first-child</Code> / <Code>:last-child</Code>、宽度与深浅色的{' '}
        <Code>@media</Code>。<Code>:hover</Code>、<Code>:focus</Code> 系列在触屏上不成立；伪元素、
        <Code>:nth-child</Code>、标签与类名选择器展开不了，开发构建的 console 里会提示。
      </ListItem>
      <ListItem>
        不要在同一个页面里同时用桌面组件库与移动端组件库：两套的主题 token 短写都是全局登记的。
      </ListItem>
    </List>

    <H2 id="testing" size="xl" anchor>
      测试
    </H2>
    <List>
      <ListItem>
        单测用 happy-dom；小程序的渲染测试用 <Code>@zerodep-dev/vue-tsx-pro-mini/testing</Code> 的{' '}
        <Code>mountPage</Code>：在 Node 里把组件挂成页面，按小程序的规则应用
        setData，断言数据树与行内样式、模拟点按。
      </ListItem>
      <ListItem>
        靠排版与真实触摸的行为在真实浏览器里测（Chromium 与 WebKit，手机视口、触摸屏），见{' '}
        <Code>apps/mobile-demo/test</Code>。
      </ListItem>
      <ListItem>
        截图：<Code>apps/mobile-demo</Code> 里 <Code>node screenshots.ts</Code>（H5 用
        Playwright，微信用开发者工具的 wechatide
        命令行）。各分组页的微信截图就是它生成的；支付宝没有命令行截图，在开发者工具里看。
      </ListItem>
    </List>
  </DocPage>
));

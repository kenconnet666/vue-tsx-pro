/** 指南：在已有的 Vue 项目里装上 vue-tsx-pro，写第一个 TSX 页面 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Code,
  CodeBlock,
  Flex,
  H2,
  Link,
  List,
  ListItem,
  Paragraph,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { CodePreview } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';
import { h } from 'vue';
import Counter from '../demo/Counter.tsx?demo';
import { DocPage } from '../../site/DocPage';
import { EditInPlayground } from '../../site/EditInPlayground';

const meta = {
  title: 'Getting Started 快速开始',
  description: '在已有的 Vue 3.5 项目里装上 vue-tsx-pro，写第一个 TSX 页面。',
};

const install =
  'pnpm add @zerodep-dev/vue-tsx-pro-tsx @zerodep-dev/vue-tsx-pro-ui @lucide/icons zod';

const viteConfig = `import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 原有的 @vitejs/plugin-vue 保留，再加上预设：符文、样式绑定与 JSX 一次编译完
export default defineConfig({ plugins: [vue(), ...vueTsxPro()] });`;

const tsconfig = `{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@zerodep-dev/vue-tsx-pro-tsx",
    "types": ["@zerodep-dev/vue-tsx-pro-tsx/runes"]
  }
}`;

const entry = `import { createUi, darkTheme, lightTheme } from '@zerodep-dev/vue-tsx-pro-ui';
import { vueRouterAdapter } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';

app.use(
  createUi({
    theme: { light: lightTheme, dark: darkTheme }, // 跟随系统明暗
    router: vueRouterAdapter(router), // 站内链接不刷新页面地跳转
  }),
);`;

const scaffold = `npx -p @zerodep-dev/vue-tsx-pro-ui vtp-ui create my-admin
cd my-admin
npm install
npm run dev`;

export default _component(() => () => (
  <DocPage meta={meta}>
    <Flex direction="column" gap="md">
      <H2 id="create" size="xl" anchor>
        从模板起步
      </H2>
      <Paragraph>
        {
          '新项目可以直接用模板：一个后台骨架——AppShell 的顶栏与侧边导航、vue-router、列表页（QueryTable）、详情页（Descriptions）、编辑页（按 zod schema 生成的 SchemaForm），数据是 src/api 里的假接口，换成真的接口就能用。已有的项目照下面几步接入。'
        }
      </Paragraph>
      <CodeBlock code={scaffold} lang="bash" />
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="install" size="xl" anchor>
        安装
      </H2>
      <Paragraph>
        要求 Vue 3.5+、Vite 8。<Code>@lucide/icons</Code> 是组件用的图标数据，<Code>zod</Code>{' '}
        是表单的校验库。
      </Paragraph>
      <CodeBlock code={install} lang="bash" />
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="vite" size="xl" anchor>
        配置 Vite 与 TypeScript
      </H2>
      <CodeBlock title="vite.config.ts" code={viteConfig} lang="ts" />
      <CodeBlock title="tsconfig.json" code={tsconfig} lang="json" />
      <Alert tone="info">
        只有用到符文或 <Code>_component</Code> 的文件会被改写，宿主的其他代码不受影响；不要再单独加{' '}
        <Code>@vitejs/plugin-vue-jsx</Code>，预设已经包含。样式由运行时引擎在页面里生成，不需要 CSS
        插件。
      </Alert>
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="create-ui" size="xl" anchor>
        装上组件库
      </H2>
      <Paragraph>在应用入口调用 createUi：主题、语言、路由适配、代码高亮都在这里配置。</Paragraph>
      <CodeBlock title="main.ts" code={entry} lang="ts" />
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="first-page" size="xl" anchor>
        第一个页面
      </H2>
      <Paragraph>
        <Code>_state</Code> 声明的变量像普通变量一样读写，界面跟着变；<Code>_derived</Code>{' '}
        是由它算出来的值。
      </Paragraph>
      <CodePreview
        code={Counter.source}
        _showCode
        align="center"
        actions={<EditInPlayground code={Counter.source} />}
      >
        {h(Counter.component)}
      </CodePreview>
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="support" size="xl" anchor>
        浏览器与环境
      </H2>
      <Paragraph>
        {
          '浏览器：Chrome、Edge 123 以上，Firefox 125 以上，Safari 17.5 以上（含 iOS）。下限由用到的平台能力定：浮层、菜单、提示、通知用原生的 popover；二维码、手写签名的“纸面”用 '
        }
        <Code>light-dark()</Code>
        {
          ' 保持浅底深色。CI 在三种浏览器的最新版上跑浏览器测试，并截从右到左、Windows 高对比的图比对。'
        }
      </Paragraph>
      <Paragraph>
        {
          'Vite 8 默认的构建目标（Chrome 111、Firefox 114、Safari 16.4）只转语法、不加 polyfill，比上面的下限低，不用改。更新的能力只做增强，不支持时直接略过：进场动画（'
        }
        <Code>@starting-style</Code>
        {'）、高度过渡（'}
        <Code>interpolate-size</Code>
        {'）、视图过渡、标题的均衡换行。'}
      </Paragraph>
      <List>
        <ListItem>
          {
            '依赖：Vue 3.5 以上、Vite 8；可选的 vue-router 5、zod 4.6、@lucide/icons 1.69、shiki 4、three 0.170 以上。CI 按这些下限另装一遍跑使用方测试。'
          }
        </ListItem>
        <ListItem>构建时的 Node：20.19 以上或 22.12 以上（与 Vite 8 一致）。</ListItem>
        <ListItem>
          {
            '服务端渲染：组件能在服务端渲染并水合，样式按页面收集成一个 style 标签，主题与语言写在 html 的属性上（'
          }
          <Link href="/stack/framework">全栈框架</Link>
          {
            '里有完整的接法）。只能在浏览器里画的（图表、3D、要量尺寸的布局）和弹层面板挂载后才渲染；记在浏览器里的界面设置、'
          }
          <Code>useMediaQuery</Code>
          {' 的结果与服务端不同时，水合会对不上那一处，版式尽量交给 CSS 媒体查询。'}
        </ListItem>
      </List>
    </Flex>
  </DocPage>
));

/** 指南：在已有的 Vue 项目里装上 vue-tsx-pro，写第一个 TSX 页面 */
import { _component } from '@vue-tsx-pro/tsx';
import { Alert, Code, CodeBlock, Flex, H2, Paragraph } from '@vue-tsx-pro/ui';
import { CodePreview } from '@vue-tsx-pro/ui/docs-kit';
import { h } from 'vue';
import Counter from '../demo/Counter.tsx?demo';
import { DocPage } from '../../site/DocPage';
import { EditInPlayground } from '../../site/EditInPlayground';

const meta = {
  title: 'Getting Started 快速开始',
  description: '在已有的 Vue 3.5 项目里装上 vue-tsx-pro，写第一个 TSX 页面。',
};

const install = 'pnpm add @vue-tsx-pro/tsx @vue-tsx-pro/ui @lucide/icons zod';

const viteConfig = `import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { vueTsxPro } from '@vue-tsx-pro/tsx/vite';

// 原有的 @vitejs/plugin-vue 保留，再加上预设：符文、样式绑定与 JSX 一次编译完
export default defineConfig({ plugins: [vue(), ...vueTsxPro()] });`;

const tsconfig = `{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@vue-tsx-pro/tsx",
    "types": ["@vue-tsx-pro/tsx/runes"]
  }
}`;

const entry = `import { createUi, darkTheme, lightTheme } from '@vue-tsx-pro/ui';
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router';

app.use(
  createUi({
    theme: { light: lightTheme, dark: darkTheme }, // 跟随系统明暗
    router: vueRouterAdapter(router), // 站内链接不刷新页面地跳转
  }),
);`;

export default _component(() => () => (
  <DocPage meta={meta}>
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
  </DocPage>
));

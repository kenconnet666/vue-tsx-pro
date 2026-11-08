# @zerodep-dev/vue-tsx-pro-ui

用 `@zerodep-dev/vue-tsx-pro-tsx` 写的 Vue 3 组件库：按无障碍规范实现的基础、表单、浮层、数据展示、表格、图表与业务模式组件，十六套内置主题，运行时样式（使用方不用再编译组件库）。

```bash
pnpm add @zerodep-dev/vue-tsx-pro-tsx @zerodep-dev/vue-tsx-pro-ui @lucide/icons zod
```

```ts
// 应用入口
import { createUi, darkTheme, lightTheme } from '@zerodep-dev/vue-tsx-pro-ui';

app.use(createUi({ theme: { light: lightTheme, dark: darkTheme } }));
```

```tsx
import { Button, Card, Flex } from '@zerodep-dev/vue-tsx-pro-ui';

<Card>
  <Flex gap="sm">
    <Button>保存</Button>
    <Button variant="outline">取消</Button>
  </Flex>
</Card>;
```

- 组件的外观在一个入口统一改：`createUi({ components: { Button: { defaults, styles, variants } } })`（档位的默认值、追加的样式、新的档位），
  局部用 `<Provider components>`；一处覆盖用 `sx`，部件用 `propsXxx`。宿主不分层的 CSS 盖过整个组件库（组件的样式在 `@layer` 里）。
- 每个部件带 `data-scope` / `data-part`，宿主的 CSS 与端到端测试能稳定地选中部件。
- 图表（`@zerodep-dev/vue-tsx-pro-ui/charts`）、3D（`/three`）、代码高亮（`/shiki`）、Excel（`/xlsx`）等在子路径里，用到才安装对应的可选依赖。

要求 Vue 3.5+、Vite 8，并配好 `@zerodep-dev/vue-tsx-pro-tsx` 的 Vite 预设。文档与示例见文档站：<https://vue-tsx-pro.zerodep.dpdns.org>（[上手](https://vue-tsx-pro.zerodep.dpdns.org/guide/getting-started)），源码在 <https://github.com/kenconnet666/vue-tsx-pro>。

MIT License

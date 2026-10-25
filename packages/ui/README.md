# @vue-tsx-pro/ui

用 `@vue-tsx-pro/tsx` 写的 Vue 3 组件库：按无障碍规范实现的基础、表单、浮层、数据展示、表格、图表与业务模式组件，十二套内置主题，运行时样式（使用方不用再编译组件库）。

```bash
pnpm add @vue-tsx-pro/tsx @vue-tsx-pro/ui @lucide/icons zod
```

```ts
// 应用入口
import { createUi, darkTheme, lightTheme } from '@vue-tsx-pro/ui';

app.use(createUi({ theme: { light: lightTheme, dark: darkTheme } }));
```

```tsx
import { Button, Card, Flex } from '@vue-tsx-pro/ui';

<Card>
  <Flex gap="sm">
    <Button>保存</Button>
    <Button variant="outline">取消</Button>
  </Flex>
</Card>;
```

- 组件的默认外观用 `createUi({ defaults })` 统一改，样式用 `createUi({ styles })` 定制；一处覆盖用 `sx`，部件用 `propsXxx`。
- 每个部件带 `data-scope` / `data-part`，宿主的 CSS 与端到端测试能稳定地选中部件。
- 图表（`@vue-tsx-pro/ui/charts`）、3D（`/three`）、代码高亮（`/shiki`）、Excel（`/xlsx`）等在子路径里，用到才安装对应的可选依赖。

要求 Vue 3.5+、Vite 8，并配好 `@vue-tsx-pro/tsx` 的 Vite 预设。文档与示例见仓库：<https://github.com/kenconnet666/vue-tsx-pro>。

MIT License

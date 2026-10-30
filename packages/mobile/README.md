# @zerodep-dev/vue-tsx-pro-mobile

用 `@zerodep-dev/vue-tsx-pro-tsx` 写的 Vue 3 移动端组件库：H5 为主，同一份页面经 `@zerodep-dev/vue-tsx-pro-mini` 跑在微信、支付宝小程序里。
基础、表单、选择器、反馈与浮层、展示、导航六类组件，亮暗两套主题，运行时样式（使用方不用再编译组件库）。

```bash
# 新项目：H5 与两端小程序共用页面
npx @zerodep-dev/vue-tsx-pro-mini create my-app

# 已有项目
pnpm add @zerodep-dev/vue-tsx-pro-mobile @zerodep-dev/vue-tsx-pro-tsx vue @lucide/icons
```

```tsx
import { Button, Cell, CellGroup, ConfigProvider } from '@zerodep-dev/vue-tsx-pro-mobile';

<ConfigProvider theme="system">
  <CellGroup title="账户">
    <Cell title="昵称" value="小明" arrow />
  </CellGroup>
  <Button fullWidth>保存</Button>
</ConfigProvider>;
```

- 最外层一个 `ConfigProvider`：主题（light / dark / system）、语言包（zh-CN / en-US），也负责挂 `showToast`、`showDialog` 这类函数调用的浮层。
- 一处覆盖用 `sx`，部件用 `propsXxx`；受控与非受控都支持（`_value` 双向绑定）。
- 省市区数据在子路径 `@zerodep-dev/vue-tsx-pro-mobile/area`，用到才加载。
- 写法约束（小程序里能用的元素与样式条件）、各组件的取舍见仓库里的 `packages/mobile/MOBILE.md`。

文档与在线示例：仓库的文档站「移动端」分区。许可：MIT。

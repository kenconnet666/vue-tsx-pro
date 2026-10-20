/**
 * 文档站里的全部示例（src 下各个 demo、frames 目录里的 .tsx），给通用测试逐个挂载：
 * 每个示例都能渲染、没有警告（demos.test.ts），亮、暗两套主题下 axe 没有违规（a11y.browser.test.ts）。
 * 新加的示例自动纳入，不用登记。
 */
import type { Component } from 'vue';

// frames 目录里是整页示例（Example 的 frame），同样要能渲染
const modules = import.meta.glob<{ default: Component }>(
  ['../**/demo/*.tsx', '../**/frames/*.tsx'],
  {
    eager: true,
  },
);

/** 示例：相对 src 的路径 → 组件 */
export const demos: [string, Component][] = Object.entries(modules).map(([path, module]) => [
  path.replace(/^\.\.\//, ''),
  module.default,
]);

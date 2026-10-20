/**
 * 文档站里的全部示例（src 下各个 demo、frames 目录里的 .tsx），给通用测试逐个挂载：
 * 每个示例都能渲染、没有警告（demos.test.ts），亮、暗两套主题下 axe 没有违规（a11y.browser.test.ts）。
 * 新加的示例自动纳入，不用登记。
 *
 * 返回加载函数，由测试决定何时加载：无障碍测试在 beforeAll 里加载全部、等开发模式的样式到齐后再挂载。
 */
import type { Component } from 'vue';

// frames 目录里是整页示例（Example 的 frame），同样要能渲染
const modules = import.meta.glob<{ default: Component }>([
  '../**/demo/*.tsx',
  '../**/frames/*.tsx',
]);

/** 示例：相对 src 的路径 → 加载组件 */
export const demoLoaders: [string, () => Promise<Component>][] = Object.entries(modules).map(
  ([path, load]) => [path.replace(/^\.\.\//, ''), async () => (await load()).default],
);

/** 加载一组示例 */
export const loadDemos = (
  loaders: readonly [string, () => Promise<Component>][] = demoLoaders,
): Promise<[string, Component][]> =>
  Promise.all(loaders.map(async ([path, load]) => [path, await load()] as [string, Component]));

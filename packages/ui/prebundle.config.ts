/**
 * 仓库里的应用按源码使用组件库时（workspaceSource），Vite 要预构建的组件库第三方依赖（optimizeDeps.include）。
 *
 * 一开始就列全：Vite 扫描入口时找不全源码里的依赖，浏览器测试跑到一半才发现新依赖，会重新预构建并刷新页面，
 * 正在初始化的测试页随之失败（CI 冷启动时出现过）。写成“组件库 > 依赖”，从组件库的目录解析，应用自己不必安装。
 * 组件库源码新增依赖时 src/utils/.test/dependencies.test.ts 会提醒补到这里。
 */
export const UI_DEPENDENCIES = [
  '@floating-ui/dom',
  '@internationalized/date',
  '@lucide/icons',
  '@radix-ui/colors',
  '@unovis/ts',
  'animejs',
  'culori/fn',
  'shiki/core',
  'shiki/engine/javascript',
  'shiki/langs',
  'tabbable',
  'zod/v4/core',
];

/** 放进 optimizeDeps.include 的写法 */
export const uiPrebundle = UI_DEPENDENCIES.map((dependency) => `@vue-tsx-pro/ui > ${dependency}`);

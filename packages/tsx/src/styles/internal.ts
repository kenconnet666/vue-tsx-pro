/**
 * 样式引擎给工具链用的入口，不是给写样式、写组件的人用的：
 * 编译器包在顶层 create / recipe 外面的热更新（hotStyles，compiler/style-hot.ts 生成导入），
 * 小程序渲染器把组合类展开成行内样式（inlineStyle，packages/mini）。与 `./styles` 共用同一份引擎状态
 */
export { hotStyles } from './hot';
export { inlineStyle, type ConditionMatcher } from './inline';

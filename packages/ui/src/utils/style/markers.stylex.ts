/**
 * StyleX 的标记（defineMarker）：子元素按某个祖先的状态取样式，如 `stylex.when.ancestor(':hover', headingMarker)`。
 * StyleX 要求 defineMarker 写在 *.stylex.ts 文件里并导出。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 标题：悬停或内部聚焦时显示锚点链接 */
export const headingMarker = stylex.defineMarker();

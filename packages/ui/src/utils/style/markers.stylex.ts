/**
 * 标记（defineMarker）：挂到祖先上，子元素按它的状态取样式，如 `stylex.when.ancestor(':hover', headingMarker)`。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 标题：悬停或内部聚焦时显示锚点链接 */
export const headingMarker = stylex.defineMarker('vtp-heading');

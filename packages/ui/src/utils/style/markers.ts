/**
 * 标记（defineMarker）：挂到祖先上，子元素按它的状态取样式，如 `css.when.ancestor(':hover', headingMarker)`。
 */
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';

/** 标题：悬停或内部聚焦时显示锚点链接 */
export const headingMarker = css.defineMarker('vtp-heading');

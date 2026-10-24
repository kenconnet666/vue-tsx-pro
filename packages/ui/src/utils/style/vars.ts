/**
 * 组件之间约定的 CSS 变量（defineVars）：不属于主题，由外层组件设置、里面的组件读取。
 * 使用方从子路径 `@vue-tsx-pro/ui/vars` 导入（同 tokens），主入口不导出。
 */
import * as css from '@vue-tsx-pro/tsx/styles';

/** 布局变量 */
export const layoutVars = css.defineVars('vtp-layout', {
  /**
   * 页面顶部被粘性元素（AppShell 的顶栏）挡住的高度：标题的 scroll-margin、粘性侧栏的 top 据此让开，
   * 锚点跳转后标题不会藏在顶栏下面。AppShell 设置它，默认 0
   */
  stickyOffset: '0px',
});

/** 骨架扫光（shimmer.ts）的变量 */
export const shimmerVars = css.defineVars('vtp-shimmer', {
  /** 扫过的那道光带的颜色：默认跟随字色；Skeleton 改成正文色的淡色 */
  highlight: 'color-mix(in oklab, currentColor 12%, transparent)',
});

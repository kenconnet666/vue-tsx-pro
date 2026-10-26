/**
 * 占满到窗口底边：从自己的顶边一直到视口底边（留出 bottom 的间距），里面竖排。列表页让表格正好占满一屏、
 * 在表格里滚动，分页贴着窗口底边；收件箱的左右分栏占满剩下的高度。
 *
 *   <ViewportFill gap="md">
 *     <Toolbar />
 *     <DataTable propsRoot={{ sx: fillStyles.grow }} />     表格 flexGrow 撑满剩下的
 *     <Pagination />
 *   </ViewportFill>
 *
 * 顶边的位置量出来（上面的页头、页签、查询栏换行变高都跟着变），不用手算“视口高度减顶栏减内边距”。
 * 窗口太矮时不小于 minHeight，整页滚动。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted } from 'vue';
import { space } from '../config/theme/tokens';
import { useResizeObserver } from '../utils/dom/resize';
import { toElement } from '../utils/dom/element';
import { useEventListener } from '../utils/dom/event-listener';
import { Flex, type FlexProps } from './Flex';
import type { Space } from '../utils/style/styles';

/** 未声明的属性落到 Flex（div）上 */
export interface ViewportFillProps extends Omit<FlexProps, 'direction'> {
  /**
   * 离视口底边留多少（与外壳正文的内边距一致，分页不贴死在窗口边上）
   * @default 'md'
   */
  bottom?: Space;
  /**
   * 最小高度：窗口太矮时整页滚动
   * @default '24rem'
   */
  minHeight?: string;
}

/** ViewportFill 的样式：root */
export const viewportFillStyles = css.create({
  root: { minWidth: 0 },
});

/** ViewportFill 的动态样式：高度 */
export const viewportFillDynamicStyles = css.create({
  size: (top: number, bottom: string, min: string) => ({
    height: `calc(100dvh - ${top}px - ${bottom})`,
    minHeight: min,
  }),
});

/** 占满到窗口底边 */
export const ViewportFill = _component(
  ({ bottom = 'md', minHeight = '24rem', sx, ...rest }: ViewportFillProps) => {
    let element = _state.raw<HTMLElement | null>(null);
    // 顶边在文档里的位置（不随滚动变）
    let top = _state(0);
    const measure = () => {
      if (!element) return;
      const next = Math.round(element.getBoundingClientRect().top + window.scrollY);
      if (next !== top) top = next;
    };
    onMounted(measure);
    useEventListener(() => window, 'resize', measure);
    // 上面的内容变高（查询栏换行、提示出现）时文档的尺寸跟着变
    useResizeObserver(() => (element ? document.body : null), measure);
    return () => (
      <Flex
        {...rest}
        direction="column"
        ref={(value: unknown) => (element = toElement(value))}
        sx={[
          viewportFillStyles.root,
          viewportFillDynamicStyles.size(top, space[bottom], minHeight),
          sx,
        ]}
      />
    );
  },
);

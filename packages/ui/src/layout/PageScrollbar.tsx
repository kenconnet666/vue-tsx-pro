/**
 * 整页的浮层滚动条：页面照常由窗口滚动（前进后退恢复位置、手机上收起地址栏、粘性定位、锚点跳转都不变），
 * 只隐藏页面的原生滚动条，换成固定在视口一侧、半透明的 OverlayScrollbar：滚动时出现，停下后淡出，不占宽度。
 * 指针移到窗口边缘时显示，可以拖动、点击轨道翻页。AppShell 默认带着它。
 *
 *   <PageScrollbar />            放在应用里任意位置，挂载期间生效
 *
 * 模态框打开时页面滚动被锁住（overflow: hidden），滚动条随之隐藏。从右到左排版时在左侧（插入边的逻辑属性）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, onMounted } from 'vue';
import type { PartProps } from '../utils/props';
import { OverlayScrollbar, type ScrollbarTypes } from './ScrollArea';

/** PageScrollbar 的属性 */
export interface PageScrollbarProps {
  /** 什么时候显示，默认 scroll（滚动时；指针移到窗口边缘时也会显示） */
  type?: keyof ScrollbarTypes;
  /** 停止滚动后多久淡出（毫秒），默认 800 */
  hideDelay?: number;
  /** 轨道的部件属性 */
  propsScrollbar?: PartProps<'div', 'aria-hidden'>;
  /** 滑块的部件属性 */
  propsThumb?: PartProps<'div'>;
}

/** PageScrollbar 的样式：document（写在页面根元素上，隐藏原生滚动条） */
export const pageScrollbarStyles = stylex.create({
  document: { scrollbarWidth: 'none', '::-webkit-scrollbar': { display: 'none' } },
});

/** 整页的浮层滚动条：挂载期间隐藏页面的原生滚动条 */
export const PageScrollbar = _component(
  ({ type = 'scroll', hideDelay = 800, propsScrollbar, propsThumb }: PageScrollbarProps) => {
    let viewport = _state.raw<HTMLElement | null>(null);
    let content = _state.raw<HTMLElement | null>(null);
    const classes = (stylex.attrs(pageScrollbarStyles.document).class ?? '')
      .split(' ')
      .filter(Boolean);

    onMounted(() => {
      viewport = document.scrollingElement as HTMLElement;
      content = document.body;
      document.documentElement.classList.add(...classes);
    });
    onBeforeUnmount(() => document.documentElement.classList.remove(...classes));

    return () => (
      <OverlayScrollbar
        axis="y"
        viewport={viewport}
        content={content}
        type={type}
        hideDelay={hideDelay}
        fixed
        propsScrollbar={propsScrollbar}
        propsThumb={propsThumb}
      />
    );
  },
);

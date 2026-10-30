/**
 * 吸顶：内容随页面滚动，滚到顶部（或离顶部 offsetTop）时停住，直到所在的容器滚出去。用 CSS 的 position: sticky，
 * 两端都不用监听滚动。
 *
 *   <Sticky><Tabs …/></Sticky>
 *   <Sticky offsetTop="3.15em">…</Sticky>      停在固定的导航栏下面
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到根元素（div）上 */
export interface StickyProps extends PartProps<'div'> {
  /**
   * 停住时离顶部多远（CSS 长度）
   * @default 0
   */
  offsetTop?: string;
  /** 吸顶的内容 */
  children?: VNodeChild;
}

/** Sticky 的样式：root */
export const stickyStyles = css.create({
  root: { position: 'sticky', zIndex: 100 },
});

/** 吸顶（div） */
export const Sticky = _component(({ offsetTop = '0px', children, ...rest }: StickyProps) => () => (
  <div
    {...mergeAttrs<'div'>({ sx: stickyStyles.root, style: { insetBlockStart: offsetTop } }, rest)}
  >
    {children}
  </div>
));

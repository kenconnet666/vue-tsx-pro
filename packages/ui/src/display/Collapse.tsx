/**
 * 展开收起的内容区，带高度过渡。触发器另外写，或者用 Collapsible。
 *
 *   <Collapse _open={open}>内容</Collapse>
 *
 * 高度过渡用 grid-template-rows 0fr ↔ 1fr，各浏览器都能动画（interpolate-size 只有 Chromium）。
 * 收起并且过渡结束后：
 *   - 支持 hidden="until-found" 的浏览器加上它：页内搜索、锚点命中时浏览器自动展开，这里把 open 写回
 *   - 不支持的（Safari）加 inert：收起的内容不能被 Tab 聚焦，读屏也读不到
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLazyContent } from '../utils/motion/presence';
import { mergeAttrs, type PartProps } from '../utils/props';
import { afterTransitions } from '../utils/style/transitions';
import { t } from '../config/theme/tokens';

/** 未声明的属性落到外层的 div 上；要分区语义时在外面包 section */
export interface CollapseProps extends PartProps<'div', 'hidden' | 'inert'> {
  /** 是否展开：父级写 _open={x}；页内搜索命中收起的内容时自动展开并写回 */
  _open?: boolean;
  children?: VNodeChild;
  /** 内容层：外层负责高度过渡，内容层裁掉溢出 */
  propsContent?: PartProps<'div'>;
  /**
   * 第一次展开时才渲染内容，之后收起也保留（内容很重、多数人不会展开时用）。
   * 代价：还没展开过的内容页内搜索找不到
   */
  lazy?: boolean;
}

const supportsUntilFound =
  typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

/** Collapse 的样式：root、open、content */
export const collapseStyles = css.create({
  root: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transition: `grid-template-rows ${t.durations.md} ${t.easings.standard}`,
  },
  open: { gridTemplateRows: '1fr' },
  // 网格项默认的最小高度是内容高度，要设为 0 才能收到 0fr
  content: { minHeight: 0, overflow: 'hidden' },
});

/** 展开收起的内容区（div），带高度过渡；收起后可被页内搜索找到并自动展开 */
export const Collapse = _component(
  ({
    _open: open = _bindable(false),
    children,
    propsContent,
    lazy = false,
    ...rest
  }: CollapseProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    // 完全收起（过渡已结束）：这时才隐藏内容，收起的过程中内容仍要可见
    let collapsed = _state(_untrack(!open));
    const showContent = useLazyContent(
      () => open,
      () => lazy,
    );

    _effect(() => {
      if (open) {
        collapsed = false;
        return;
      }
      // 一开始就是收起的：没有过渡要等。不然每个收起的 Collapse 挂载时都要对整棵内容 getAnimations，
      // 一页十来个收起的源码就是十来次样式计算
      if (_untrack(collapsed)) return;
      let cancelled = false;
      void afterTransitions(root!).then(() => {
        if (!cancelled) collapsed = true;
      });
      return () => (cancelled = true);
    });

    return () => (
      <div
        {...mergeAttrs<'div'>({ sx: collapseStyles.root }, rest, {
          sx: open && collapseStyles.open,
          ref: _toRef(root),
          hidden: collapsed && supportsUntilFound ? 'until-found' : undefined,
          inert: collapsed && !supportsUntilFound ? true : undefined,
          onBeforematch: () => (open = true),
        })}
        data-state={open ? 'open' : 'closed'}
      >
        <div {...mergeAttrs<'div'>({ sx: collapseStyles.content }, propsContent)}>
          {showContent() && children}
        </div>
      </div>
    );
  },
);

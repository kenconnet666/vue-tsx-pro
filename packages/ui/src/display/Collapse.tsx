/**
 * 展开收起的内容区，带高度过渡。触发器另外写，或者用 Collapsible。
 *
 *   <Collapse open={_bind(open)}>内容</Collapse>
 *
 * 高度过渡用 grid-template-rows 0fr ↔ 1fr，各浏览器都能动画（interpolate-size 只有 Chromium）。
 * 收起并且过渡结束后：
 *   - 支持 hidden="until-found" 的浏览器加上它：页内搜索、锚点命中时浏览器自动展开，这里把 open 写回
 *   - 不支持的（Safari）加 inert：收起的内容不能被 Tab 聚焦，读屏也读不到
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { afterTransitions } from '../utils/transitions';

/** 未声明的属性落到外层的 div 上；要分区语义时在外面包 section */
export interface CollapseProps extends PartProps<'div', 'hidden' | 'inert'> {
  /** 是否展开：父级写 open={_bind(x)}；页内搜索命中收起的内容时自动展开并写回 */
  open?: boolean;
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

const styles = stylex.create({
  root: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transition: 'grid-template-rows _durations.md _easings.standard',
  },
  open: { gridTemplateRows: '1fr' },
  // 网格项默认的最小高度是内容高度，要设为 0 才能收到 0fr
  content: { minHeight: 0, overflow: 'hidden' },
});

/** 展开收起的内容区（div），带高度过渡；收起后可被页内搜索找到并自动展开 */
export const Collapse = _component(
  ({ open = _bindable(false), children, propsContent, lazy = false, ...rest }: CollapseProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    // 完全收起（过渡已结束）：这时才隐藏内容，收起的过程中内容仍要可见
    let collapsed = _state(!open);
    // 展开过：lazy 时从这以后一直渲染内容
    let opened = _state(false);

    _effect(() => {
      if (open) {
        collapsed = false;
        opened = true;
        return;
      }
      let cancelled = false;
      void afterTransitions(root!).then(() => {
        if (!cancelled) collapsed = true;
      });
      return () => (cancelled = true);
    });

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>({ sx: styles.root }, rest, {
            sx: open && styles.open,
            ref: _toRef(root),
            hidden: collapsed && supportsUntilFound ? 'until-found' : undefined,
            inert: collapsed && !supportsUntilFound ? true : undefined,
            onBeforematch: () => (open = true),
          }),
        )}
      >
        <div {...elementProps(mergeProps<'div'>({ sx: styles.content }, propsContent))}>
          {(!lazy || open || opened) && children}
        </div>
      </div>
    );
  },
);

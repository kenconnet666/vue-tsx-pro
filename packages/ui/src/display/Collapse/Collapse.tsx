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
import { elementProps, mergeProps, type AsProps, type PartProps } from '../../utils/props';
import { afterTransitions } from '../../utils/transitions';

type Tags = 'div' | 'section';

/** 未声明的属性落到外层元素上 */
export interface CollapseProps extends AsProps<Tags, 'hidden' | 'inert'> {
  /** 是否展开：父级写 open={_bind(x)}；页内搜索命中收起的内容时自动展开并写回 */
  open?: boolean;
  children?: VNodeChild;
  /** 内容层：外层负责高度过渡，内容层裁掉溢出 */
  propsContent?: PartProps<'div'>;
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

export const Collapse = _component(
  ({ as = 'div', open = _bindable(false), children, propsContent, ...rest }: CollapseProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    // 完全收起（过渡已结束）：这时才隐藏内容，收起的过程中内容仍要可见
    let collapsed = _state(!open);

    _effect(() => {
      if (open) {
        collapsed = false;
        return;
      }
      let cancelled = false;
      void afterTransitions(root!).then(() => {
        if (!cancelled) collapsed = true;
      });
      return () => (cancelled = true);
    });

    return () => {
      const Tag = as;
      return (
        <Tag
          {...elementProps(
            mergeProps<Tags>({ sx: styles.root }, rest, {
              sx: open && styles.open,
              ref: _toRef(root),
              hidden: collapsed && supportsUntilFound ? 'until-found' : undefined,
              inert: collapsed && !supportsUntilFound ? true : undefined,
              onBeforematch: () => (open = true),
            }),
          )}
        >
          <div {...elementProps(mergeProps<'div'>({ sx: styles.content }, propsContent))}>
            {children}
          </div>
        </Tag>
      );
    };
  },
);

/**
 * 固钉：滚动到某个位置后贴住视口（或滚动容器）的顶部、底部不走，如表单的提交栏、长表格上方的筛选条、文章的目录。
 *
 *   <Affix offsetTop={64}>
 *     <FilterBar … />
 *   </Affix>
 *   <Affix offsetBottom={0} onChange={(stuck) => …}><ActionBar … /></Affix>
 *
 * 用 CSS position: sticky：在所在的滚动容器里贴住，不脱离文档流（不用占位、不用量宽度），容器滚出去时跟着走。
 * 是否已经贴住由 IntersectionObserver 看一个零高度的哨兵（useIntersectionObserver）：贴住时加阴影（浮在内容上）、
 * 写 data-stuck，并报告 onChange。sticky 只在父元素的范围里生效：Affix 要放在跟着滚动的那一层里；
 * 祖先里有 overflow 不是 visible 的元素时，sticky 相对的是它（不是视口）：这时把它作为 target 传进来。
 * 部件：Root（div，sticky 的那层）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useIntersectionObserver } from '../utils/dom/intersection';
import { mergeAttrs, type PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** onChange 换成报告是否贴住 */
export type AffixManaged = 'onChange';

/** 未声明的属性落到 sticky 的 div 上 */
export interface AffixProps extends PartProps<'div', AffixManaged> {
  /** 贴住时离顶部多远（px），默认 0；与 offsetBottom 二选一 */
  offsetTop?: number;
  /** 贴住时离底部多远（px）：贴在底部 */
  offsetBottom?: number;
  /** 滚动的容器（sticky 相对的那个祖先）；不写时是视口 */
  target?: () => HTMLElement | null | undefined;
  /** 贴住时加阴影，默认 true */
  shadow?: boolean;
  /** 贴住、离开时调用 */
  onChange?: (stuck: boolean) => void;
  children?: VNodeChild;
}

/** Affix 的样式：root、stuck、sentinel */
export const affixStyles = css.create({
  root: {
    position: 'sticky',
    zIndex: 5,
    transition: `box-shadow ${t.durations.sm} ${t.easings.standard}`,
  },
  stuck: { boxShadow: '_md' },
  // 哨兵：贴住的位置上一个零高度的元素，滚过它就是贴住了
  sentinel: { height: 0, pointerEvents: 'none', visibility: 'hidden' },
});

/** 贴住的位置 */
export const affixPositionStyles = css.create({
  top: (offset: number) => ({ top: offset }),
  bottom: (offset: number) => ({ bottom: offset }),
});

/** 固钉：sticky + 是否贴住的检测 */
export const Affix = _component(
  ({ offsetTop, offsetBottom, target, shadow = true, onChange, children, ...rest }: AffixProps) => {
    let sentinel = _state.raw<HTMLElement | null>(null);
    let stuck = _state(false);
    const atBottom = () => offsetBottom != null && offsetTop == null;

    // 贴顶：哨兵在上方，滚到它离顶部不到 offsetTop 就是贴住了；贴底：哨兵在下方，同理看底部
    useIntersectionObserver(
      () => sentinel,
      ([entry]) => {
        const next =
          !entry!.isIntersecting &&
          (atBottom()
            ? entry!.boundingClientRect.top > (entry!.rootBounds?.bottom ?? 0)
            : entry!.boundingClientRect.bottom < (entry!.rootBounds?.top ?? 0));
        if (next === stuck) return;
        stuck = next;
        onChange?.(next);
      },
      () => ({
        root: target?.() ?? null,
        rootMargin: atBottom()
          ? `0px 0px ${-(offsetBottom ?? 0)}px 0px`
          : `${-(offsetTop ?? 0)}px 0px 0px 0px`,
        threshold: [0, 1],
      }),
    );

    return () => {
      const bottom = atBottom();
      const marker = (
        <div
          aria-hidden="true"
          ref={(element: unknown) => (sentinel = element instanceof HTMLElement ? element : null)}
          {...css.attrs(affixStyles.sentinel)}
        />
      );
      return (
        <>
          {!bottom && marker}
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  affixStyles.root,
                  bottom
                    ? affixPositionStyles.bottom(offsetBottom ?? 0)
                    : affixPositionStyles.top(offsetTop ?? 0),
                  shadow && stuck && affixStyles.stuck,
                ],
              },
              rest,
            )}
            data-stuck={stuck || undefined}
          >
            {children}
          </div>
          {bottom && marker}
        </>
      );
    };
  },
);

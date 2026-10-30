/**
 * 回到顶部：页面往下滚过一段之后，右下角出现一个圆按钮，点了平滑滚回顶部。
 *
 *   <BackTop />
 *   <BackTop offset={800} bottom="5em" />
 *
 * 滚动位置经宿主约定取（H5 是窗口，小程序是页面的 onPageScroll），浮在浮层根里。
 */
import { ArrowUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Teleport, onBeforeUnmount, type VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';
import { usePresence } from '../utils/presence';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到按钮上 */
export interface BackTopProps extends PartProps<'button', 'type'> {
  /**
   * 滚过多少（px）才出现
   * @default 200
   */
  offset?: number;
  /**
   * 离底部多远（CSS 长度，另加安全区）
   * @default '6em'
   */
  bottom?: string;
  /**
   * 离右边多远（CSS 长度）
   * @default '1.25em'
   */
  right?: string;
  /** 按钮里的内容（代替向上的箭头） */
  children?: VNodeChild;
}

/** BackTop 的样式：root */
export const backTopStyles = css.create({
  root: {
    position: 'fixed',
    zIndex: 1500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.85em',
    height: '2.85em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: '_full',
    backgroundColor: { default: '_surface', ':active': '_fillActive' },
    boxShadow: '_md',
    color: '_text',
    fontSize: '_md',
    cursor: 'pointer',
    opacity: { default: 0, '[data-state="open"]': 1 },
    transform: { default: 'scale(0.8)', '[data-state="open"]': 'none' },
    transitionProperty: 'opacity, transform',
    transitionDuration: '_md',
  },
});

/** 回到顶部（button，渲染到浮层根） */
export const BackTop = _component(
  ({ offset = 200, bottom = '6em', right = '1.25em', children, ...rest }: BackTopProps) => {
    const host = useHost();
    const config = useConfig();
    let shown = _state(host.scrollTop() > offset);
    const stop = host.onScroll((top) => (shown = top > offset));
    onBeforeUnmount(stop);
    const presence = usePresence(() => shown, 240);
    return () =>
      presence.mounted && (
        <Teleport to={host.overlayRoot() as never}>
          <button
            {...mergeAttrs<'button'>(
              {
                sx: [config.rootSx, backTopStyles.root],
                style: {
                  insetBlockEnd: `calc(${bottom} + env(safe-area-inset-bottom))`,
                  insetInlineEnd: right,
                },
              },
              rest,
              {
                type: 'button',
                'aria-label': config.lang.backTop,
                onClick: () => host.scrollTo(0, { smooth: true }),
                ...dataAttrs({ 'data-state': presence.visible ? 'open' : 'closed' }),
              },
            )}
          >
            {children ?? <Icon icon={ArrowUp} />}
          </button>
        </Teleport>
      );
  },
);

/**
 * 遮罩：盖住整个页面的半透明层，弹出层、对话框在它上面。打开时锁住页面滚动，点了默认关闭。
 *
 *   <Overlay _open={show} />
 *   <Overlay _open={loading} closeOnClick={false}><Loading … /></Overlay>
 *
 * 渲染到宿主的浮层根（H5 是 body，小程序是页面根节点下的浮层节点），进出场是淡入淡出。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Teleport, onBeforeUnmount, watch, type VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';
import { usePresence } from '../utils/presence';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到遮罩（div）上 */
export interface OverlayProps extends PartProps<'div'> {
  /** 是否显示；双向绑定写 `_open={x}` */
  _open?: boolean;
  /**
   * 点遮罩关闭
   * @default true
   */
  closeOnClick?: boolean;
  /**
   * 打开时锁住页面滚动
   * @default true
   */
  lockScroll?: boolean;
  /**
   * 渲染到宿主的浮层根；弹出层自己已经 Teleport 时传 false
   * @default true
   */
  teleport?: boolean;
  /** 点了遮罩（关闭之前） */
  onClick?: (event: Event) => void;
  /** 遮罩里居中显示的内容 */
  children?: VNodeChild;
}

/** Overlay 的样式：root */
export const overlayStyles = css.create({
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '_overlay',
    opacity: { default: 0, '[data-state="open"]': 1 },
    transitionProperty: 'opacity',
    transitionDuration: '_lg',
    transitionTimingFunction: '_standard',
  },
});

/** 在打开期间锁住页面滚动 */
export function useLockScroll(locked: () => boolean) {
  const host = useHost();
  let release: (() => void) | undefined;
  const update = (next: boolean) => {
    if (next && !release) release = host.lockScroll();
    else if (!next && release) {
      release();
      release = undefined;
    }
  };
  watch(locked, update, { immediate: true });
  onBeforeUnmount(() => update(false));
}

/** 遮罩（div，渲染到浮层根） */
export const Overlay = _component(
  ({
    _open: open = _bindable(false),
    closeOnClick = true,
    lockScroll = true,
    teleport = true,
    onClick,
    children,
    ...rest
  }: OverlayProps) => {
    const host = useHost();
    const config = useConfig();
    const presence = usePresence(() => open);
    useLockScroll(() => open && lockScroll);
    return () => {
      if (!presence.mounted) return null;
      const mask = (
        <div
          {...mergeAttrs<'div'>({ sx: [config.rootSx, overlayStyles.root] }, rest, {
            onClick: (event: Event) => {
              onClick?.(event);
              if (closeOnClick && !event.defaultPrevented) open = false;
            },
            ...dataAttrs({
              'data-state': presence.visible ? 'open' : 'closed',
              // 小程序里遮罩 catch 掉 touchmove，挡住下面页面的滚动
              'data-scroll-lock': true,
            }),
          })}
        >
          {children}
        </div>
      );
      return teleport ? <Teleport to={host.overlayRoot() as never}>{mask}</Teleport> : mask;
    };
  },
);

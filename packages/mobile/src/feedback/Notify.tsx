/**
 * 顶部通知：从页面顶部滑下的一条通知栏，过一会儿自己收起。用来提示操作结果、网络状态这类不打断操作的消息。
 *
 *   showNotify('网络连接已断开');
 *   showNotify({ message: '已保存', tone: 'success' });
 *   <Notify _open={show} tone="warning">余额不足</Notify>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Teleport, onBeforeUnmount, shallowReactive, watch, type VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';
import { usePresence } from '../utils/presence';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';

/** 通知的选项（组件的 props 与 showNotify 的参数共用） */
export interface NotifyOptions {
  /** 文字 */
  message?: VNodeChild;
  /**
   * 色调
   * @default 'danger'
   */
  tone?: 'danger' | 'success' | 'warning' | 'accent';
  /**
   * 显示多久（ms）；0 表示不自动收起
   * @default 3000
   */
  duration?: number;
  /** 点了通知 */
  onClick?: (event: Event) => void;
  /** 收起之后 */
  onClose?: () => void;
}

/** 未声明的属性落到通知栏（div）上 */
export interface NotifyProps extends NotifyOptions, Omit<PartProps<'div', 'role'>, 'onClick'> {
  /** 是否显示；双向绑定写 `_open={x}` */
  _open?: boolean;
  /** 文字（与 message 二选一） */
  children?: VNodeChild;
}

/** Notify 的样式：root、各色调 */
export const notifyStyles = css.create({
  root: {
    boxSizing: 'border-box',
    position: 'fixed',
    insetBlockStart: 0,
    insetInline: 0,
    zIndex: 3000,
    paddingBlock: '0.6em',
    paddingInline: '_lg',
    // 刘海屏顶部的安全区
    paddingBlockStart: `max(0.6em, env(safe-area-inset-top))`,
    fontSize: '_md',
    lineHeight: '1.5',
    textAlign: 'center',
    overflowWrap: 'anywhere',
    transform: { default: 'translateY(-100%)', '[data-state="open"]': 'none' },
    transitionProperty: 'transform',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
  danger: { color: '_dangerContrast', backgroundColor: '_danger' },
  success: { color: '_successContrast', backgroundColor: '_success' },
  warning: { color: '_warningContrast', backgroundColor: '_warning' },
  accent: { color: '_accentContrast', backgroundColor: '_accent' },
});

/** 顶部通知（div[role=alert]，渲染到浮层根） */
export const Notify = _component(
  ({
    _open: open = _bindable(false),
    message,
    tone = 'danger',
    duration = 3000,
    onClick,
    onClose,
    children,
    ...rest
  }: NotifyProps) => {
    const host = useHost();
    const config = useConfig();
    const presence = usePresence(() => open, 240);
    let timer: ReturnType<typeof setTimeout> | undefined;
    watch(
      () => [open, message, tone, duration],
      () => {
        clearTimeout(timer);
        if (open && duration > 0)
          timer = setTimeout(() => {
            open = false;
            onClose?.();
          }, duration);
      },
      { immediate: true },
    );
    onBeforeUnmount(() => clearTimeout(timer));
    return () =>
      presence.mounted && (
        <Teleport to={host.overlayRoot() as never}>
          <div
            {...mergeAttrs<'div'>(
              { sx: [config.rootSx, notifyStyles.root, notifyStyles[tone]] },
              rest,
              {
                role: 'alert',
                onClick,
                ...dataAttrs({ 'data-state': presence.visible ? 'open' : 'closed' }),
              },
            )}
          >
            {message ?? children}
          </div>
        </Teleport>
      );
  },
);

/** 命令式通知的状态：ConfigProvider 里的出口按它渲染 */
export const notifyState = shallowReactive<{ open: boolean; options: NotifyOptions }>({
  open: false,
  options: {},
});

/** 显示一条顶部通知；同一时间只有一条 */
export function showNotify(options: NotifyOptions | string) {
  notifyState.options = typeof options === 'string' ? { message: options } : options;
  notifyState.open = true;
}

/** 收起当前的顶部通知 */
export function closeNotify() {
  notifyState.open = false;
}

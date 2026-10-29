/**
 * 轻提示：屏幕中间（或上、下）的一小块黑底文字，过一会儿自己消失。有文字、加载中、成功、失败四种。
 *
 *   showToast('已复制');
 *   const toast = showLoadingToast('提交中…');   …   toast.close();
 *   showSuccessToast('保存成功');
 *   <Toast _open={show} type="fail">网络不太好</Toast>
 *
 * 命令式的写法渲染在 ConfigProvider 里（页面要包一层）；同一时间只有一个，后一个替换前一个。
 */
import { CircleCheck, CircleX } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Teleport, onBeforeUnmount, shallowReactive, watch, type VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';
import { usePresence } from '../utils/presence';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { Loading } from './Loading';

/** 轻提示的类型 */
export interface ToastTypes {
  /** 只有文字 */
  text: unknown;
  /** 加载中：旋转指示，不自动关闭 */
  loading: unknown;
  /** 成功：对勾 */
  success: unknown;
  /** 失败：叉 */
  fail: unknown;
}

/** 显示的位置 */
export interface ToastPositions {
  /** 屏幕中间 */
  middle: unknown;
  /** 靠上 */
  top: unknown;
  /** 靠下 */
  bottom: unknown;
}

/** 轻提示的选项（组件的 props 与 showToast 的参数共用） */
export interface ToastOptions {
  /** 文字 */
  message?: VNodeChild;
  /**
   * 类型
   * @default 'text'
   */
  type?: keyof ToastTypes;
  /** 自定义图标（代替类型自带的） */
  icon?: IconData;
  /**
   * 显示多久（ms）；0 表示不自动关闭。加载中默认不自动关闭
   * @default 2000
   */
  duration?: number;
  /**
   * 位置
   * @default 'middle'
   */
  position?: keyof ToastPositions;
  /** 显示期间挡住页面的点击（加载中常用） */
  forbidClick?: boolean;
  /** 关闭之后 */
  onClose?: () => void;
}

/** 未声明的属性落到提示框（div）上 */
export interface ToastProps extends ToastOptions, PartProps<'div', 'role'> {
  /** 是否显示；双向绑定写 `_open={x}`，到时间自动关闭时写回 false */
  _open?: boolean;
  /** 文字（与 message 二选一） */
  children?: VNodeChild;
}

/** Toast 的样式：root、withIcon、各位置、icon、blocker */
export const toastStyles = css.create({
  root: {
    boxSizing: 'border-box',
    position: 'fixed',
    insetInlineStart: '50%',
    zIndex: 3000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '_sm',
    maxWidth: '70%',
    paddingBlock: '0.6em',
    paddingInline: '1em',
    borderRadius: '_lg',
    backgroundColor: '_inverseSurface',
    color: '_inverseText',
    fontSize: '_md',
    lineHeight: '1.4',
    textAlign: 'center',
    overflowWrap: 'anywhere',
    pointerEvents: 'none',
    opacity: { default: 0, '[data-state="open"]': 1 },
    transitionProperty: 'opacity, transform',
    transitionDuration: '_md',
  },
  withIcon: { minWidth: '7.5em', minHeight: '7.5em', justifyContent: 'center', padding: '_lg' },
  middle: {
    insetBlockStart: '50%',
    transform: {
      default: 'translate(-50%, -50%) scale(0.92)',
      '[data-state="open"]': 'translate(-50%, -50%)',
    },
  },
  top: { insetBlockStart: '20%', transform: 'translateX(-50%)' },
  bottom: { insetBlockEnd: '20%', transform: 'translateX(-50%)' },
  icon: { fontSize: '2.5em' },
  blocker: { position: 'fixed', inset: 0, zIndex: 3000 },
});

const ICONS = { success: CircleCheck, fail: CircleX } as const;

/** 轻提示（div[role=status]，渲染到浮层根） */
export const Toast = _component(
  ({
    _open: open = _bindable(false),
    message,
    type = 'text',
    icon,
    duration,
    position = 'middle',
    forbidClick = false,
    onClose,
    children,
    ...rest
  }: ToastProps) => {
    const host = useHost();
    const config = useConfig();
    const presence = usePresence(() => open, 240);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      const wait = duration ?? (type === 'loading' ? 0 : 2000);
      if (open && wait > 0)
        timer = setTimeout(() => {
          open = false;
          onClose?.();
        }, wait);
    };
    // 打开、换了文字或类型时重新计时（命令式的后一个替换前一个）
    watch(() => [open, message, type, duration], schedule, { immediate: true });
    onBeforeUnmount(() => clearTimeout(timer));
    return () => {
      if (!presence.mounted) return null;
      const glyph =
        type === 'loading' ? (
          <Loading size={36} />
        ) : icon || type !== 'text' ? (
          <Icon icon={icon ?? ICONS[type as 'success' | 'fail']} sx={toastStyles.icon} />
        ) : null;
      return (
        <Teleport to={host.overlayRoot() as never}>
          {forbidClick && <div {...mergeAttrs<'div'>({ sx: toastStyles.blocker })} />}
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  config.rootSx,
                  toastStyles.root,
                  toastStyles[position],
                  glyph && toastStyles.withIcon,
                ],
              },
              rest,
              {
                role: 'status',
                ...dataAttrs({ 'data-state': presence.visible ? 'open' : 'closed' }),
              },
            )}
          >
            {glyph}
            {message ?? children}
          </div>
        </Teleport>
      );
    };
  },
);

/** 命令式轻提示的状态：ConfigProvider 里的出口按它渲染 */
export const toastState = shallowReactive<{ open: boolean; options: ToastOptions }>({
  open: false,
  options: {},
});

/** 命令式轻提示的控制器 */
export interface ToastHandle {
  /** 关闭这个提示（已经被后一个替换时什么也不做） */
  close(): void;
}

/** 显示一个轻提示；同一时间只有一个，后一个替换前一个 */
export function showToast(options: ToastOptions | string): ToastHandle {
  const next = typeof options === 'string' ? { message: options } : options;
  toastState.options = next;
  toastState.open = true;
  return {
    close() {
      if (toastState.options === next) toastState.open = false;
    },
  };
}

/** 加载中的轻提示：不自动关闭，默认挡住点击；用返回的 close() 关 */
export const showLoadingToast = (options: ToastOptions | string = {}) =>
  showToast({
    forbidClick: true,
    ...(typeof options === 'string' ? { message: options } : options),
    type: 'loading',
  });

/** 成功的轻提示 */
export const showSuccessToast = (options: ToastOptions | string) =>
  showToast({ ...(typeof options === 'string' ? { message: options } : options), type: 'success' });

/** 失败的轻提示 */
export const showFailToast = (options: ToastOptions | string) =>
  showToast({ ...(typeof options === 'string' ? { message: options } : options), type: 'fail' });

/** 关闭当前的轻提示 */
export function closeToast() {
  toastState.open = false;
}

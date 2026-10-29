/**
 * 弹出层：从底部（或顶部、两侧）滑入，或在中间弹出的面板，下面有遮罩。动作面板、选择器、对话框都建在它上面。
 *
 *   <Popup _open={show} position="bottom" round>…</Popup>
 *   <Popup _open={show} closeable onOpenChange={(open, { reason }) => …}>…</Popup>
 *
 * 点遮罩、点右上角的关闭按钮会关闭（onOpenChange 带原因）；底部弹出时留出安全区。
 */
import { X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Teleport, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { useConfig } from '../config/context';
import { t } from '../theme/tokens';
import { useHost } from '../utils/host';
import { usePresence } from '../utils/presence';
import { dataAttrs, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Overlay, type OverlayProps } from './Overlay';

/** 弹出的位置 */
export interface PopupPositions {
  /** 屏幕中间，缩放淡入 */
  center: unknown;
  /** 从底部滑入 */
  bottom: unknown;
  /** 从顶部滑入 */
  top: unknown;
  /** 从起始边（左）滑入，占满高度 */
  left: unknown;
  /** 从结束边（右）滑入，占满高度 */
  right: unknown;
}

/** 关闭的原因 */
export type PopupCloseReason = 'overlay' | 'close';

/** 角色与模态由组件管理 */
export type PopupManaged = 'role' | 'aria-modal';

/** 未声明的属性落到面板（div）上 */
export interface PopupProps extends PartProps<'div', PopupManaged> {
  /** 是否打开；双向绑定写 `_open={x}` */
  _open?: boolean;
  /**
   * 位置
   * @default 'center'
   */
  position?: keyof PopupPositions;
  /** 圆角（底部弹出时只有上面两个角） */
  round?: boolean;
  /** 右上角显示关闭按钮 */
  closeable?: boolean;
  /**
   * 显示遮罩
   * @default true
   */
  overlay?: boolean;
  /**
   * 点遮罩关闭
   * @default true
   */
  closeOnOverlay?: boolean;
  /**
   * 底部弹出时留出安全区（全面屏底部的横条）
   * @default true
   */
  safeArea?: boolean;
  /** 打开或关闭；关闭时带原因（点遮罩、点关闭按钮） */
  onOpenChange?: (open: boolean, details: { reason: PopupCloseReason }) => void;
  /** 面板的内容 */
  children?: VNodeChild;
  /** 遮罩的部件属性 */
  propsOverlay?: Partial<OverlayProps>;
  /** 关闭按钮的部件属性 */
  propsClose?: PartProps<'button'>;
}

/** Popup 的样式：panel、各位置、round、safeArea、close */
export const popupStyles = css.create({
  panel: {
    boxSizing: 'border-box',
    position: 'fixed',
    zIndex: 2000,
    maxHeight: '100%',
    overflowY: 'auto',
    backgroundColor: '_surface',
    color: '_text',
    transitionProperty: 'transform, opacity',
    transitionDuration: '_lg',
    transitionTimingFunction: { default: '_exit', '[data-state="open"]': '_enter' },
  },
  center: {
    insetBlockStart: '50%',
    insetInlineStart: '50%',
    width: 'max-content',
    maxWidth: `calc(100% - ${t.space.xxl})`,
    transform: {
      default: 'translate(-50%, -50%) scale(0.9)',
      '[data-state="open"]': 'translate(-50%, -50%) scale(1)',
    },
    opacity: { default: 0, '[data-state="open"]': 1 },
  },
  bottom: {
    insetInline: 0,
    insetBlockEnd: 0,
    maxHeight: '80%',
    transform: { default: 'translateY(100%)', '[data-state="open"]': 'none' },
  },
  top: {
    insetInline: 0,
    insetBlockStart: 0,
    maxHeight: '80%',
    transform: { default: 'translateY(-100%)', '[data-state="open"]': 'none' },
  },
  left: {
    insetBlock: 0,
    insetInlineStart: 0,
    width: '80%',
    transform: { default: 'translateX(-100%)', '[data-state="open"]': 'none' },
  },
  right: {
    insetBlock: 0,
    insetInlineEnd: 0,
    width: '80%',
    transform: { default: 'translateX(100%)', '[data-state="open"]': 'none' },
  },
  roundCenter: { borderRadius: '_xl' },
  roundBottom: { borderStartStartRadius: '_xl', borderStartEndRadius: '_xl' },
  roundTop: { borderEndStartRadius: '_xl', borderEndEndRadius: '_xl' },
  safeArea: { paddingBlockEnd: 'env(safe-area-inset-bottom)' },
  close: {
    position: 'absolute',
    insetBlockStart: '_md',
    insetInlineEnd: '_md',
    zIndex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    padding: 0,
    borderWidth: 0,
    borderRadius: '_full',
    backgroundColor: { default: 'transparent', ':active': '_fill' },
    color: '_textMuted',
    fontSize: '_xl',
    cursor: 'pointer',
  },
});

/** 弹出层（遮罩 + 面板 div[role=dialog]，渲染到浮层根） */
export const Popup = _component(
  ({
    _open: open = _bindable(false),
    position = 'center',
    round = false,
    closeable = false,
    overlay = true,
    closeOnOverlay = true,
    safeArea = true,
    onOpenChange,
    children,
    propsOverlay,
    propsClose,
    ...rest
  }: PopupProps) => {
    const host = useHost();
    const config = useConfig();
    const presence = usePresence(() => open);
    const close = (reason: PopupCloseReason) => {
      open = false;
      onOpenChange?.(false, { reason });
    };
    return () => {
      if (!presence.mounted) return null;
      const rounded =
        round &&
        (position === 'center'
          ? popupStyles.roundCenter
          : position === 'bottom'
            ? popupStyles.roundBottom
            : position === 'top' && popupStyles.roundTop);
      return (
        <Teleport to={host.overlayRoot() as never}>
          {overlay && (
            <Overlay
              {...mergePartProps<OverlayProps>(
                {
                  _open: open,
                  teleport: false,
                  closeOnClick: false,
                  onClick: () => closeOnOverlay && close('overlay'),
                },
                propsOverlay,
              )}
            />
          )}
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  config.rootSx,
                  popupStyles.panel,
                  popupStyles[position],
                  rounded,
                  safeArea && position === 'bottom' && popupStyles.safeArea,
                ],
              },
              rest,
              {
                role: 'dialog',
                'aria-modal': overlay ? 'true' : undefined,
                ...dataAttrs({
                  'data-state': presence.visible ? 'open' : 'closed',
                  'data-position': position,
                }),
              },
            )}
          >
            {closeable && (
              <button
                {...mergeAttrs<'button'>({ sx: popupStyles.close }, propsClose, {
                  type: 'button',
                  'aria-label': config.lang.close,
                  onClick: () => close('close'),
                })}
              >
                <Icon {...mergePartProps<IconProps>({ icon: X }, undefined)} />
              </button>
            )}
            {children}
          </div>
        </Teleport>
      );
    };
  },
);

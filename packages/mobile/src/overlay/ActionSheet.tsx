/**
 * 动作面板：从底部弹出的一列操作（标题、操作项、隔开的取消），用来让用户从几个操作里选一个。
 *
 *   <ActionSheet
 *     _open={show}
 *     title="分享到"
 *     actions={[{ name: '微信' }, { name: '朋友圈' }, { name: '删除', tone: 'danger' }]}
 *     onSelect={(action, index) => …}
 *   />
 *
 * 选了之后默认关闭；有 children 时显示自定义内容，不渲染操作项。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { useConfig } from '../config/context';
import { Loading } from '../feedback/Loading';
import {
  dataAttrs,
  hasContent,
  mergeAttrs,
  mergePartProps,
  mergeProps,
  type PartProps,
} from '../utils/props';
import { Popup, type PopupProps } from './Popup';

/** 一个操作项 */
export interface ActionSheetAction {
  /** 名称 */
  name: VNodeChild;
  /** 名称下的说明 */
  description?: VNodeChild;
  /** 名称前的图标 */
  icon?: IconData;
  /** 色调：删除这类操作用 danger */
  tone?: 'accent' | 'danger';
  /** 禁用 */
  disabled?: boolean;
  /** 加载中：显示转圈，不能选 */
  loading?: boolean;
}

/** 关闭的原因 */
export type ActionSheetCloseReason = 'select' | 'cancel' | 'overlay';

/** 未声明的属性落到面板（弹出层的 div）上 */
export interface ActionSheetProps extends Omit<PartProps<'div', 'role'>, 'title' | 'onSelect'> {
  /** 是否打开；双向绑定写 `_open={x}` */
  _open?: boolean;
  /** 操作项 */
  actions?: ActionSheetAction[];
  /** 标题 */
  title?: VNodeChild;
  /** 标题下的说明 */
  description?: VNodeChild;
  /**
   * 显示取消
   * @default true
   */
  showCancel?: boolean;
  /** 取消的文字；不给时用语言包的"取消" */
  cancelText?: VNodeChild;
  /**
   * 选了之后关闭
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * 点遮罩关闭（等于取消）
   * @default true
   */
  closeOnOverlay?: boolean;
  /** 选了一项 */
  onSelect?: (action: ActionSheetAction, index: number) => void;
  /** 点了取消（或点遮罩关闭） */
  onCancel?: () => void;
  /** 关闭时带原因 */
  onOpenChange?: (open: boolean, details: { reason: ActionSheetCloseReason }) => void;
  /** 自定义内容（代替操作项） */
  children?: VNodeChild;
  /** 弹出层的部件属性 */
  propsPopup?: Partial<PopupProps>;
  /** 每个操作项（button）的部件属性 */
  propsAction?: PartProps<'button'>;
  /** 取消（button）的部件属性 */
  propsCancel?: PartProps<'button'>;
}

/** ActionSheet 的样式：header、title、description、action、各色调、actionDescription、gap、cancel */
export const actionSheetStyles = css.create({
  header: {
    paddingBlock: '1em',
    paddingInline: '_lg',
    textAlign: 'center',
    borderBlockEndWidth: '_hairline',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
  },
  title: { fontSize: '_lg', fontWeight: '_semibold', lineHeight: '_tight', color: '_text' },
  description: { marginBlockStart: '0.4em', fontSize: '_sm', color: '_textMuted' },
  action: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '3.5em',
    paddingBlock: '0.7em',
    paddingInline: '_lg',
    margin: 0,
    borderWidth: 0,
    backgroundColor: {
      default: '_surface',
      ':active:not([data-disabled]):not([data-loading])': '_fillActive',
    },
    color: '_text',
    fontFamily: 'inherit',
    fontSize: '_lg',
    lineHeight: '1.4',
    textAlign: 'center',
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
    opacity: { default: 1, '[data-disabled]': '_disabled' },
    transitionProperty: 'background-color',
    transitionDuration: '_xs',
  },
  accent: { color: '_accentText' },
  danger: { color: '_dangerText' },
  name: { display: 'inline-flex', alignItems: 'center', gap: '0.4em' },
  actionDescription: { marginBlockStart: '0.2em', fontSize: '_xs', color: '_textMuted' },
  gap: { height: '0.5em', backgroundColor: '_background' },
});

/** 动作面板（弹出层 > 标题 + 操作项 + 取消） */
export const ActionSheet = _component(
  ({
    _open: open = _bindable(false),
    actions = [],
    title,
    description,
    showCancel = true,
    cancelText,
    closeOnSelect = true,
    closeOnOverlay = true,
    onSelect,
    onCancel,
    onOpenChange,
    children,
    propsPopup,
    propsAction,
    propsCancel,
    ...rest
  }: ActionSheetProps) => {
    const config = useConfig();
    const close = (reason: ActionSheetCloseReason) => {
      open = false;
      onOpenChange?.(false, { reason });
    };
    const cancel = (reason: 'cancel' | 'overlay') => {
      onCancel?.();
      close(reason);
    };
    const select = (action: ActionSheetAction, index: number) => {
      if (action.disabled || action.loading) return;
      onSelect?.(action, index);
      if (closeOnSelect) close('select');
    };
    return () => (
      <Popup
        {...mergePartProps<PopupProps>(
          {
            _open: open,
            position: 'bottom',
            round: true,
            closeOnOverlay,
            onOpenChange: (next, { reason }) => !next && reason === 'overlay' && cancel('overlay'),
          },
          mergeProps<PopupProps>(rest as Partial<PopupProps>, propsPopup) as Partial<PopupProps>,
        )}
      >
        {(hasContent(title) || hasContent(description)) && (
          <div {...mergeAttrs<'div'>({ sx: actionSheetStyles.header })}>
            {hasContent(title) && (
              <div {...mergeAttrs<'div'>({ sx: actionSheetStyles.title })}>{title}</div>
            )}
            {hasContent(description) && (
              <div {...mergeAttrs<'div'>({ sx: actionSheetStyles.description })}>{description}</div>
            )}
          </div>
        )}
        {hasContent(children)
          ? children
          : actions.map((action, index) => (
              <button
                {...mergeAttrs<'button'>(
                  { sx: [actionSheetStyles.action, action.tone && actionSheetStyles[action.tone]] },
                  propsAction,
                  {
                    type: 'button',
                    'aria-disabled': action.disabled ? 'true' : undefined,
                    'aria-busy': action.loading ? 'true' : undefined,
                    onClick: () => select(action, index),
                    ...dataAttrs({
                      'data-disabled': action.disabled,
                      'data-loading': action.loading,
                    }),
                  },
                )}
              >
                {action.loading ? (
                  <Loading size={20} />
                ) : (
                  <span {...mergeAttrs<'span'>({ sx: actionSheetStyles.name })}>
                    {action.icon && <Icon icon={action.icon} />}
                    {action.name}
                  </span>
                )}
                {hasContent(action.description) && !action.loading && (
                  <span {...mergeAttrs<'span'>({ sx: actionSheetStyles.actionDescription })}>
                    {action.description}
                  </span>
                )}
              </button>
            ))}
        {showCancel && [
          <div {...mergeAttrs<'div'>({ sx: actionSheetStyles.gap })} />,
          <button
            {...mergeAttrs<'button'>({ sx: actionSheetStyles.action }, propsCancel, {
              type: 'button',
              onClick: () => cancel('cancel'),
            })}
          >
            {cancelText ?? config.lang.cancel}
          </button>,
        ]}
      </Popup>
    );
  },
);

/**
 * 气泡确认（role="alertdialog"）：在触发按钮旁边问一句再执行，比确认对话框轻（删除一行、撤回、移出成员）。
 * 建在 Popover 上：点击外部、Esc 等于取消，关闭后焦点回到触发器；打开时焦点落在“取消”上，误按 Enter 不会执行。
 *
 *   <Popconfirm
 *     title="删除这条记录？"
 *     description="删除后无法恢复"
 *     tone="danger"
 *     confirmText="删除"
 *     onConfirm={() => api.remove(row.id)}
 *     trigger={(props) => <IconButton {...props} icon={Trash2} aria-label="删除" />}
 *   />
 *
 * onConfirm 返回 Promise 时确认按钮加载中，完成后关闭；返回 false（或 resolve 成 false）、失败时保持打开，由调用方提示原因。
 * 后果严重、要多写几句说明或填理由的操作用 AlertDialog / useConfirm。
 * 部件：Root（Popover 的弹出层）、Icon、Title、Description、Footer（Flex）、Cancel、Confirm（Button）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useLang } from '../config/context';
import { Flex, type FlexProps } from '../layout/Flex';
import { openSetter } from '../utils/dom/open-change';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { statusIcons, type StatusTone } from '../utils/style/tone-styles';
import { toneStyles } from '../utils/style/typography';
import { Popover, type PopoverProps } from './Popover';

/** 未声明的属性落到弹出层的 div 上；位置、箭头、触发器同 Popover */
export interface PopconfirmProps extends Omit<PopoverProps, 'role' | 'children' | 'title'> {
  /** 问题，同时是弹出层的无障碍名称 */
  title: VNodeChild;
  /** 补充说明（aria-describedby） */
  description?: VNodeChild;
  /** 确认按钮与图标的色调，默认 warning；删除这类破坏性操作用 danger */
  tone?: StatusTone;
  /** 图标；不写时按色调选，false 不显示 */
  icon?: IconData | false;
  /** 确认：返回 Promise 时等它完成再关闭；返回 false、失败时保持打开 */
  onConfirm: () => unknown;
  /** 取消（含 Esc、点击外部） */
  onCancel?: () => void;
  /** 确认按钮的文字，默认取语言包（确定） */
  confirmText?: VNodeChild;
  /** 取消按钮的文字，默认取语言包（取消） */
  cancelText?: VNodeChild;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'div'>;
  /** 按钮行的部件属性 */
  propsFooter?: Partial<FlexProps>;
  /** 确认按钮的部件属性 */
  propsConfirm?: Partial<ButtonProps>;
  /** 取消按钮的部件属性 */
  propsCancel?: Partial<ButtonProps>;
}

/** Popconfirm 的样式：body、icon、title、description、footer */
export const popconfirmStyles = stylex.create({
  body: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    columnGap: '_sm',
    rowGap: '_xs',
    maxWidth: '20rem',
  },
  icon: { gridRow: 'span 2', marginBlockStart: '0.15em' },
  title: { gridColumn: '2', fontWeight: '_semibold', lineHeight: '_tight' },
  description: { gridColumn: '2', color: '_textMuted', fontSize: '_sm' },
  footer: { gridColumn: '1 / -1', marginBlockStart: '_sm' },
});

/** 气泡确认：Popover + 问题 + 取消 / 确认 */
export const Popconfirm = _component(
  ({
    open = _bindable(false),
    onOpenChange,
    placement = 'top',
    trigger,
    title,
    description,
    tone = 'warning',
    icon,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    propsIcon,
    propsTitle,
    propsDescription,
    propsFooter,
    propsConfirm,
    propsCancel,
    ...rest
  }: PopconfirmProps) => {
    const lang = useLang();
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;
    let pending = _state(false);
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );
    // 确认后关闭的不算取消；Esc、点击外部、取消按钮关闭的都是取消
    let confirmed = false;
    watch(
      () => open,
      (now) => {
        if (now) confirmed = false;
        else if (!confirmed) onCancel?.();
      },
    );

    async function confirm() {
      if (pending) return;
      pending = true;
      try {
        if ((await onConfirm()) === false) return;
      } catch (error) {
        // 调用方负责提示失败原因；这里只保持打开，并留下记录
        console.error('Popconfirm 的 onConfirm 失败，保持打开', error);
        return;
      } finally {
        pending = false;
      }
      confirmed = true;
      setOpen(false, 'confirm');
    }

    return () => {
      const shownIcon = icon === false ? undefined : (icon ?? statusIcons[tone]);
      return (
        <Popover
          {...mergePartProps<Partial<PopoverProps>>(
            {
              'aria-labelledby': titleId,
              'aria-describedby': hasContent(description) ? descriptionId : undefined,
            },
            rest,
            { placement, role: 'alertdialog' },
          )}
          trigger={trigger}
          open={_bind(open)}
          onOpenChange={onOpenChange}
        >
          <div {...stylex.attrs(popconfirmStyles.body)}>
            {shownIcon && (
              <Icon
                {...mergePartProps<IconProps>(
                  { icon: shownIcon, sx: [popconfirmStyles.icon, toneStyles[tone]] },
                  propsIcon,
                )}
              />
            )}
            <div
              {...mergeAttrs<'div'>({ sx: popconfirmStyles.title }, propsTitle, { id: titleId })}
            >
              {title}
            </div>
            {hasContent(description) && (
              <div
                {...mergeAttrs<'div'>({ sx: popconfirmStyles.description }, propsDescription, {
                  id: descriptionId,
                })}
              >
                {description}
              </div>
            )}
            <Flex
              {...mergePartProps<FlexProps>(
                { justify: 'end', gap: 'sm', sx: popconfirmStyles.footer },
                propsFooter,
              )}
            >
              <Button
                {...mergePartProps<ButtonProps>(
                  { size: 'sm', variant: 'soft', tone: 'neutral' },
                  propsCancel,
                  // 打开时焦点落在取消上：误按 Enter 不会执行
                  {
                    autofocus: true,
                    disabled: pending,
                    onClick: (event: MouseEvent) => setOpen(false, 'close', event),
                  },
                )}
              >
                {cancelText ?? lang.cancel}
              </Button>
              <Button
                {...mergePartProps<ButtonProps>({ size: 'sm', tone }, propsConfirm, {
                  loading: pending,
                  onClick: () => void confirm(),
                })}
              >
                {confirmText ?? lang.confirm}
              </Button>
            </Flex>
          </div>
        </Popover>
      );
    };
  },
);

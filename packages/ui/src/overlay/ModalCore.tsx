/**
 * 模态面板的内核（原生 dialog + showModal）：Dialog、Drawer、AlertDialog 都建在它上面，只各自给出外观。
 *
 * 顶层渲染、背景 inert、Esc 关闭由浏览器负责；组件补上浏览器不做或不一致的（utils/dom/overlay）：
 * 打开前记下焦点来源、关闭后还回去，焦点循环，锁定页面滚动，点击遮罩关闭
 * （原生的 closedby="any" 到 2026 年 Safari 仍不支持，所以仍用 dismissOnBackdrop）。
 * 初始焦点：浏览器聚焦第一个可聚焦元素，有 autofocus 的优先（参考 Radix Dialog、React Aria Modal）。
 *
 * 写了 onConfirm 时页脚有“取消 / 确认”两个按钮（在 footer 之后）：确认返回 Promise 时按钮加载中、这期间关不掉，
 * 完成后关闭；返回 false 或失败时保持打开（同 Ant Design Modal 的 onOk）。表单在正文里时，确认按钮写
 * propsConfirm={{ type: 'submit', form: 表单的 id }}，在输入框里按 Enter 也是确认。
 *
 * 部件：Header（标题行，Flex）、Title（H2）、Close（CloseButton）、Description（Paragraph）、
 * Body（ScrollArea：内容长时只滚正文，标题与页脚固定）、Footer（Flex，靠结束边排列）、Cancel、Confirm（Button，写了 onConfirm 时）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { CloseButton, type PresetIconButtonProps } from '../base/CloseButton';
import { H2, type HeadingProps } from '../base/Heading';
import { Paragraph, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { Flex, type FlexProps } from '../layout/Flex';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { openModalDialog } from '../utils/dom/overlay';
import { useLazyContent, type LazyContentOptions } from '../utils/motion/presence';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { transitions } from '../utils/style/transitions';
import { t } from '../config/theme/tokens';

/** 打开、关闭与无障碍关联由组件管理；原生的 title 属性（悬停提示）让给标题 */
export type ModalManaged =
  'open' | 'role' | 'title' | 'aria-labelledby' | 'aria-describedby' | 'aria-modal';

/** Dialog、Drawer、AlertDialog 共有的 props；未声明的属性落到 dialog 上 */
export interface ModalProps extends PartProps<'dialog', ModalManaged>, LazyContentOptions {
  /** 是否打开：父级写 open={_bind(x)}；Esc、点击遮罩、关闭按钮都会关闭并写回 */
  open?: boolean;
  /** 标题，同时是对话框的无障碍名称 */
  title: VNodeChild;
  /** 标题下的说明，读屏打开时一并念出（aria-describedby） */
  description?: VNodeChild;
  /** 底部操作区 */
  footer?: VNodeChild;
  /** 标题行右侧的关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true；需要用户明确选择时设为 false（Esc 仍可关闭） */
  dismissible?: boolean;
  /**
   * 用户要关闭时（关闭按钮、Esc、点遮罩）先问它：返回 false（或 resolve 成 false）就不关，
   * 如表单有未保存的改动时先确认。父级把 open 改成 false 不经过它
   */
  beforeClose?: () => boolean | Promise<boolean>;
  /**
   * 确认：写了就在页脚（footer 之后）放“取消”与“确认”两个按钮。返回 Promise 时确认按钮加载中，
   * 取消、Esc、遮罩、关闭按钮暂不可用，完成后关闭；返回 false（或 resolve 成 false）、失败（reject）时保持打开，
   * 校验没过、提交失败由调用方提示原因
   */
  onConfirm?: () => unknown;
  /** 确认按钮的文字，默认取语言包（确定） */
  confirmText?: VNodeChild;
  /** 取消按钮的文字，默认取语言包（取消） */
  cancelText?: VNodeChild;
  /** 确认按钮的色调，默认 accent；删除、驳回这类破坏性操作用 danger */
  tone?: StatusTone;
  /** 确认按钮的部件属性（表单的 type="submit" 与 form 写在这里） */
  propsConfirm?: Partial<ButtonProps>;
  /** 取消按钮的部件属性 */
  propsCancel?: Partial<ButtonProps>;
  /** 标题行的部件属性 */
  propsHeader?: Partial<FlexProps>;
  /** 标题的部件属性 */
  propsTitle?: Partial<HeadingProps>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 关闭按钮的部件属性 */
  propsClose?: Partial<PresetIconButtonProps>;
  /** 正文（滚动区域）的部件属性 */
  propsBody?: Partial<ScrollAreaProps>;
  /** 页脚的部件属性 */
  propsFooter?: Partial<FlexProps>;
  children?: VNodeChild;
}

/** 内核额外需要的：外观由各组件给出；AlertDialog 改角色 */
export interface ModalCoreProps extends ModalProps {
  /** dialog 的外观：尺寸、圆角、进出场过渡 */
  panelSx: StyleXStyles;
  /** AlertDialog 改为 alertdialog；不写时是原生 dialog 的隐含角色 */
  role?: 'alertdialog';
  /** 直接放在 dialog 里、不随正文滚动的内容（抽屉边上的宽度调整手柄） */
  edge?: VNodeChild;
  /** 标题行、说明、正文、页脚共同的样式（抽屉拖窄时内容保持最小宽度、被裁掉而不是挤成一列） */
  contentSx?: StyleXStyles;
}

/** 模态面板共有的样式：面板、标题行、标题、关闭按钮、说明、正文、页脚 */
export const modalStyles = stylex.create({
  panel: {
    boxSizing: 'border-box',
    // 只在模态打开时排版；关闭时回到 none，离场过渡由 display 的 allow-discrete 撑住
    display: { default: 'none', ':modal': 'flex' },
    flexDirection: 'column',
    padding: 0,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    backgroundColor: '_surfaceRaised',
    color: '_text',
    boxShadow: '_xl',
    lineHeight: '_normal',
  },
  header: { paddingBlockStart: '_xl', paddingInline: '_xl' },
  title: { flexGrow: 1, minWidth: 0, margin: 0 },
  close: {
    flexShrink: 0,
    marginBlock: `calc(-1 * ${t.space.xs})`,
    marginInlineEnd: `calc(-1 * ${t.space.sm})`,
  },
  description: { marginBlockStart: '_xs', paddingInline: '_xl', color: '_textMuted' },
  body: { flexGrow: 1, minHeight: 0 },
  bodyContent: { paddingBlock: '_lg', paddingInline: '_xl' },
  footer: { paddingBlockEnd: '_xl', paddingInline: '_xl' },
});

/** Dialog、Drawer、AlertDialog 的内核：原生模态 dialog 的打开、关闭、焦点与滚动 */
export const ModalCore = _component(
  ({
    open = _bindable(false),
    title,
    description,
    footer,
    closable = true,
    dismissible = true,
    beforeClose,
    onConfirm,
    confirmText,
    cancelText,
    tone = 'accent',
    propsConfirm,
    propsCancel,
    panelSx,
    role,
    propsHeader,
    propsTitle,
    propsDescription,
    propsClose,
    propsBody,
    propsFooter,
    lazy = true,
    edge,
    contentSx,
    children,
    ...rest
  }: ModalCoreProps) => {
    const lang = useLang();
    const id = useId();
    const showContent = useLazyContent(
      () => open,
      () => lazy,
    );
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;
    let dialog = _state.raw<HTMLDialogElement | null>(null);
    let release: (() => void) | undefined;
    // 等确认的结果：这期间关不掉
    let pending = _state(false);

    /** 用户要关闭：先问 beforeClose，同意了才关 */
    async function requestClose() {
      if (pending || (beforeClose && !(await beforeClose()))) return;
      dialog?.close();
    }

    async function confirm() {
      if (pending) return;
      pending = true;
      try {
        if ((await onConfirm?.()) === false) return;
      } catch (error) {
        // 调用方负责提示失败原因；这里只保持打开，并留下记录
        console.error('对话框的 onConfirm 失败，保持打开', error);
        return;
      } finally {
        pending = false;
      }
      dialog?.close();
    }

    function show() {
      if (!dialog || dialog.open) return;
      release = openModalDialog(dialog, {
        dismissOnBackdrop: dismissible,
        onDismiss: () => void requestClose(),
      });
    }

    // Esc：原生 dialog 先发 cancel；等确认时不关，有 beforeClose 时拦下来，问过再关
    function onCancel(event: Event) {
      if (!pending && !beforeClose) return;
      event.preventDefault();
      void requestClose();
    }

    // 不论以什么方式关闭（Esc、遮罩、关闭按钮、open 改为 false），都会触发原生 close 事件；
    // 使用方的 onClose（原生事件）照常落到 dialog 上，先于这里执行
    function onClose() {
      release?.();
      release = undefined;
      open = false;
    }

    // DOM 更新后执行（首次在挂载后 dialog 已就位）
    _effect(() => {
      if (open) show();
      else if (dialog?.open) dialog.close();
    });
    onBeforeUnmount(() => release?.());

    return () => (
      <dialog
        {...mergeAttrs<'dialog'>({ sx: [modalStyles.panel, panelSx, transitions.backdrop] }, rest, {
          ref: _toRef(dialog),
          role,
          'aria-labelledby': titleId,
          'aria-describedby': hasContent(description) ? descriptionId : undefined,
          onClose,
          onCancel,
        })}
      >
        <Flex
          {...mergePartProps<FlexProps>(
            { align: 'start', gap: 'md', sx: [contentSx, modalStyles.header] },
            propsHeader,
          )}
        >
          <H2
            {...mergePartProps<HeadingProps>({ size: 'lg', sx: modalStyles.title }, propsTitle, {
              id: titleId,
            })}
          >
            {title}
          </H2>
          {closable && (
            <CloseButton
              {...mergePartProps<PresetIconButtonProps>({ sx: modalStyles.close }, propsClose, {
                disabled: pending,
                onClick: () => void requestClose(),
              })}
            />
          )}
        </Flex>
        {hasContent(description) && (
          <Paragraph
            {...mergePartProps<TextProps>(
              { sx: [contentSx, modalStyles.description] },
              propsDescription,
              {
                id: descriptionId,
              },
            )}
          >
            {description}
          </Paragraph>
        )}
        <ScrollArea
          {...mergePartProps<ScrollAreaProps>(
            { sx: [contentSx, modalStyles.body], propsContent: { sx: modalStyles.bodyContent } },
            propsBody,
          )}
        >
          {showContent() && children}
        </ScrollArea>
        {(hasContent(footer) || onConfirm) && (
          <Flex
            {...mergePartProps<FlexProps>(
              { justify: 'end', gap: 'sm', wrap: true, sx: [contentSx, modalStyles.footer] },
              propsFooter,
            )}
          >
            {footer}
            {onConfirm && (
              <>
                <Button
                  {...mergePartProps<ButtonProps>(
                    { variant: 'soft', tone: 'neutral' },
                    propsCancel,
                    {
                      disabled: pending,
                      onClick: () => void requestClose(),
                    },
                  )}
                >
                  {cancelText ?? lang.cancel}
                </Button>
                <Button
                  {...mergePartProps<ButtonProps>({ tone }, propsConfirm, {
                    loading: pending,
                    onClick: () => void confirm(),
                  })}
                >
                  {confirmText ?? lang.confirm}
                </Button>
              </>
            )}
          </Flex>
        )}
        {edge}
      </dialog>
    );
  },
  { name: 'ModalCore' },
);

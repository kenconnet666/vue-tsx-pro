/**
 * 模态对话框（原生 dialog + showModal）与抽屉：同一个内核，Dialog 居中，Drawer 贴着视口一侧滑入。
 *
 *   <Dialog open={_bind(editing)} title="编辑资料" footer={<Button onClick={save}>保存</Button>}>…</Dialog>
 *   <Drawer open={_bind(filtering)} side="end" title="筛选">…</Drawer>
 *
 * 顶层渲染、背景 inert、Esc 关闭由浏览器负责；组件补上浏览器不做或不一致的（utils/overlay）：
 * 打开前记下焦点来源、关闭后还回去，焦点循环，锁定页面滚动，点击遮罩关闭
 * （原生的 closedby="any" 到 2026 年 Safari 仍不支持，所以仍用 dismissOnBackdrop）。
 * 初始焦点：浏览器聚焦第一个可聚焦元素，有 autofocus 的优先（参考 Radix Dialog、React Aria Modal）。
 *
 * 部件：Header（标题行，Flex）、Title（H2）、Close（CloseButton）、Description（Paragraph）、
 * Body（ScrollArea：内容长时只滚正文，标题与页脚固定）、Footer（Flex，靠结束边排列）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { CloseButton, type PresetIconButtonProps } from '../base/CloseButton';
import { H2, type HeadingProps } from '../base/Heading';
import { Paragraph, type TextProps } from '../base/Text';
import { Flex, type FlexProps } from '../layout/Flex';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import type { ContainerSizes } from '../layout/Container';
import { useDefaults } from '../config/defaults';
import {
  dismissOnBackdrop,
  focusOrigin,
  lockScroll,
  returnFocus,
  trackModal,
  trapFocus,
} from '../utils/overlay';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { transitions } from '../utils/transitions';

/** 打开、关闭与无障碍关联由组件管理；原生的 title 属性（悬停提示）让给标题 */
type Managed = 'open' | 'role' | 'title' | 'aria-labelledby' | 'aria-describedby' | 'aria-modal';

/** Dialog、Drawer、AlertDialog 共有的 props；未声明的属性落到 dialog 上 */
export interface ModalProps extends PartProps<'dialog', Managed> {
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
}

const styles = stylex.create({
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
    marginBlock: 'calc(-1 * _space.xs)',
    marginInlineEnd: 'calc(-1 * _space.sm)',
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
    panelSx,
    role,
    propsHeader,
    propsTitle,
    propsDescription,
    propsClose,
    propsBody,
    propsFooter,
    children,
    ...rest
  }: ModalCoreProps) => {
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;
    let dialog = _state.raw<HTMLDialogElement | null>(null);
    let release: (() => void) | undefined;

    function show() {
      if (!dialog || dialog.open) return;
      const opener = focusOrigin();
      dialog.showModal();
      const target = dialog;
      const cleanups = [
        trackModal(target),
        lockScroll(),
        trapFocus(target),
        dismissible ? dismissOnBackdrop(target, () => target.close()) : undefined,
      ];
      release = () => {
        for (const cleanup of cleanups) cleanup?.();
        returnFocus(target, opener);
      };
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
        {...elementProps(
          mergeProps<'dialog'>({ sx: [styles.panel, panelSx, transitions.backdrop] }, rest, {
            ref: _toRef(dialog),
            role,
            'aria-labelledby': titleId,
            'aria-describedby': description != null ? descriptionId : undefined,
            onClose,
          }),
        )}
      >
        <Flex
          {...mergePartProps<FlexProps>(
            { align: 'start', gap: 'md', sx: styles.header },
            propsHeader,
          )}
        >
          <H2
            {...mergePartProps<HeadingProps>({ size: 'lg', sx: styles.title }, propsTitle, {
              id: titleId,
            })}
          >
            {title}
          </H2>
          {closable && (
            <CloseButton
              {...mergePartProps<PresetIconButtonProps>({ sx: styles.close }, propsClose, {
                onClick: () => dialog?.close(),
              })}
            />
          )}
        </Flex>
        {description != null && (
          <Paragraph
            {...mergePartProps<TextProps>({ sx: styles.description }, propsDescription, {
              id: descriptionId,
            })}
          >
            {description}
          </Paragraph>
        )}
        <ScrollArea
          {...mergePartProps<ScrollAreaProps>(
            { sx: styles.body, propsContent: { sx: styles.bodyContent } },
            propsBody,
          )}
        >
          {children}
        </ScrollArea>
        {footer != null && (
          <Flex
            {...mergePartProps<FlexProps>(
              { justify: 'end', gap: 'sm', wrap: true, sx: styles.footer },
              propsFooter,
            )}
          >
            {footer}
          </Flex>
        )}
      </dialog>
    );
  },
  { name: 'ModalCore' },
);

/** 对话框的宽度档位，与 Container 相同（30–80rem），另加 full 占满视口 */
export interface DialogSizes extends ContainerSizes {
  /** 占满视口（四周留出 1em） */
  full: unknown;
}

/** 对话框的外观选项；可以用 createUi / Provider 的 defaults.Dialog 统一改默认值（AlertDialog 也用它） */
export interface DialogOptions {
  /** 宽度档位，默认 xs（30rem）；窄屏时不超出视口 */
  size?: keyof DialogSizes;
}

/** 未声明的属性落到 dialog 上 */
export interface DialogProps extends ModalProps, DialogOptions {}

const dialogStyles = stylex.create({
  panel: {
    width: '_full',
    // 原生 dialog 已限制 max-width / max-height 不超出视口；这里只把高度上限放到四周各留 1em
    maxHeight: 'calc(100dvh - 2em)',
    borderRadius: '_xl',
  },
  full: { maxWidth: 'calc(100vw - 2em)', height: 'calc(100dvh - 2em)' },
});

const dialogSizes = stylex.create({
  xs: { maxWidth: 'min(_xs, calc(100vw - 2em))' },
  sm: { maxWidth: 'min(_sm, calc(100vw - 2em))' },
  md: { maxWidth: 'min(_md, calc(100vw - 2em))' },
  lg: { maxWidth: 'min(_lg, calc(100vw - 2em))' },
  xl: { maxWidth: 'min(_xl, calc(100vw - 2em))' },
});

/** 居中对话框的外观（Dialog、AlertDialog 共用）：宽度档位、圆角、淡入放大 */
export function dialogPanelSx(size: keyof DialogSizes): StyleXStyles {
  return [
    dialogStyles.panel,
    size === 'full' ? dialogStyles.full : dialogSizes[size],
    transitions.scale,
  ] as StyleXStyles;
}

/** 模态对话框：居中显示，淡入放大 */
export const Dialog = _component(({ open = _bindable(false), size, ...rest }: DialogProps) => {
  const defaults = useDefaults('Dialog');
  return () => (
    <ModalCore
      {...rest}
      open={_bind(open)}
      panelSx={dialogPanelSx(size ?? defaults.size ?? 'xs')}
    />
  );
});

/** 抽屉从哪一侧滑入；start / end 是逻辑方向，从右到左排版下左右互换 */
export interface DrawerSides {
  /** 起始边（从左到右排版时是左侧）：导航菜单 */
  start: unknown;
  /** 结束边（默认，从左到右排版时是右侧）：详情、筛选、表单 */
  end: unknown;
  /** 顶部 */
  top: unknown;
  /** 底部：手机上的操作面板 */
  bottom: unknown;
}

/** 抽屉的外观选项；可以用 createUi / Provider 的 defaults.Drawer 统一改默认值 */
export interface DrawerOptions {
  /** 宽度（左右两侧）档位，与 Container 相同，默认 xs（30rem）；上下两侧时高度由内容决定，最多到视口高度 */
  size?: keyof ContainerSizes;
}

/** 未声明的属性落到 dialog 上 */
export interface DrawerProps extends ModalProps, DrawerOptions {
  /** 从哪一侧滑入，默认 end */
  side?: keyof DrawerSides;
}

const drawerStyles = stylex.create({
  panel: {
    margin: 0,
    maxWidth: '100vw',
    maxHeight: '100dvh',
    borderRadius: 0,
    // 进场从所在一侧滑入（@starting-style），离场淡出（allow-discrete，目前只有 Chromium）：
    // 离场不滑回去，方向只需在进场的起始值里区分一次；“减少动态效果”时时长为 0。
    // 平时 translate 是 none 而不是 0 0：否则抽屉会成为 fixed 子元素（移进来的 Toaster）的包含块
    opacity: { default: 0, ':modal': 1 },
    transition: {
      default:
        'opacity _durations.sm _easings.exit, display _durations.sm allow-discrete, overlay _durations.sm allow-discrete',
      ':modal':
        'translate _durations.lg _easings.enter, display _durations.lg allow-discrete, overlay _durations.lg allow-discrete',
    },
  },
  inline: { insetBlock: 0, width: '_full', height: '100dvh' },
  block: { insetInline: 0, width: '100vw', height: 'auto' },
  // 位置用逻辑属性，从右到左排版自动换边；translate 是物理方向，用 :dir() 区分
  start: {
    insetInlineStart: 0,
    insetInlineEnd: 'auto',
    borderInlineStartWidth: 0,
    translate: {
      default: 'none',
      ':modal': {
        default: 'none',
        '@starting-style': { default: '-100% 0', ':dir(rtl)': '100% 0' },
      },
    },
  },
  end: {
    insetInlineStart: 'auto',
    insetInlineEnd: 0,
    borderInlineEndWidth: 0,
    translate: {
      default: 'none',
      ':modal': {
        default: 'none',
        '@starting-style': { default: '100% 0', ':dir(rtl)': '-100% 0' },
      },
    },
  },
  top: {
    top: 0,
    bottom: 'auto',
    borderBlockStartWidth: 0,
    translate: { default: 'none', ':modal': { default: 'none', '@starting-style': '0 -100%' } },
  },
  bottom: {
    top: 'auto',
    bottom: 0,
    borderBlockEndWidth: 0,
    translate: { default: 'none', ':modal': { default: 'none', '@starting-style': '0 100%' } },
  },
});

const drawerSizes = stylex.create({
  xs: { maxWidth: 'min(_xs, 100vw)' },
  sm: { maxWidth: 'min(_sm, 100vw)' },
  md: { maxWidth: 'min(_md, 100vw)' },
  lg: { maxWidth: 'min(_lg, 100vw)' },
  xl: { maxWidth: 'min(_xl, 100vw)' },
});

/** 抽屉：贴着视口一侧滑入的模态面板 */
export const Drawer = _component(
  ({ open = _bindable(false), side = 'end', size, ...rest }: DrawerProps) => {
    const defaults = useDefaults('Drawer');
    return () => {
      const inline = side === 'start' || side === 'end';
      return (
        <ModalCore
          {...rest}
          open={_bind(open)}
          panelSx={[
            drawerStyles.panel,
            inline ? drawerStyles.inline : drawerStyles.block,
            drawerStyles[side],
            inline && drawerSizes[size ?? defaults.size ?? 'xs'],
          ]}
          data-side={side}
        />
      );
    };
  },
);

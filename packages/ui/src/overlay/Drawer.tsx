/**
 * 抽屉：贴着视口一侧滑入的模态面板。内核见 Modal.tsx（与 Dialog、AlertDialog 共用）。
 *
 *   <Drawer open={_bind(filtering)} side="end" title="筛选">…</Drawer>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { ContainerSizes } from '../layout/Container';
import { useDefaults } from '../config/defaults';
import { ModalCore, type ModalProps } from './Modal';

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

/** 抽屉的面板样式：去掉居中、按所在一侧定位与滑入 */
export const drawerStyles = stylex.create({
  panel: {
    margin: 0,
    maxWidth: '100vw',
    maxHeight: '100dvh',
    borderRadius: 0,
    // 进场从所在一侧滑入（@starting-style），离场滑回去（allow-discrete，离场过渡目前只有 Chromium）；
    // “减少动态效果”时时长为 0。打开时 translate 是 none 而不是 0 0：否则抽屉会成为 fixed 子元素
    // （移进来的 Toaster）的包含块；关闭时不显示，移到所在一侧之外没有这个问题
    transition: {
      default:
        'translate _durations.md _easings.exit, display _durations.md allow-discrete, overlay _durations.md allow-discrete',
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
      default: '-100% 0',
      ':dir(rtl)': '100% 0',
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
      default: '100% 0',
      ':dir(rtl)': '-100% 0',
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
    translate: { default: '0 -100%', ':modal': { default: 'none', '@starting-style': '0 -100%' } },
  },
  bottom: {
    top: 'auto',
    bottom: 0,
    borderBlockEndWidth: 0,
    translate: { default: '0 100%', ':modal': { default: 'none', '@starting-style': '0 100%' } },
  },
});

/** 抽屉（左右两侧）的宽度档位 */
export const drawerSizeStyles = stylex.create({
  xs: { maxWidth: 'min(_xs, 100vw)' },
  sm: { maxWidth: 'min(_sm, 100vw)' },
  md: { maxWidth: 'min(_md, 100vw)' },
  lg: { maxWidth: 'min(_lg, 100vw)' },
  xl: { maxWidth: 'min(_xl, 100vw)' },
});

/** 抽屉：贴着视口一侧滑入的模态面板 */
export const Drawer = _component(
  ({ open = _bindable(false), side = 'end', size, ...rest }: DrawerProps) => {
    const appearance = useDefaults('Drawer', () => ({ size }), { size: 'xs' });
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
            inline && drawerSizeStyles[appearance().size],
          ]}
          data-side={side}
        />
      );
    };
  },
);

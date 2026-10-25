/**
 * 抽屉：贴着视口一侧滑入的模态面板。内核见 Modal.tsx（与 Dialog、AlertDialog 共用）。
 *
 *   <Drawer _open={filtering} side="end" title="筛选">…</Drawer>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { ContainerSizes } from '../layout/Container';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { ResizeHandle, type ResizeHandleProps } from '../layout/ResizeHandle';
import {
  useDetachedOverlay,
  type DetachedOverlayHandle,
  type DetachedOverlayOptions,
} from './detached';
import { ModalCore, modalPartStyles, type ModalProps } from './ModalCore';
import { t } from '../config/theme/tokens';

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
  /**
   * 靠正文的一边可以拖动调整宽度（也能聚焦后用 ← / →，双击回到初始宽度），能一直拖到只剩一窄条、
   * 让出后面的页面；只用于左右两侧
   * @default true
   */
  resizable?: boolean;
}

/** 未声明的属性落到 dialog 上 */
export interface DrawerProps extends ModalProps, DrawerOptions {
  /** 从哪一侧滑入，默认 end */
  side?: keyof DrawerSides;
  /** 宽度（px，左右两侧）：写了就不按 size 的档位；父级写 _width={x} 记住拖动后的宽度 */
  _width?: number | null;
  /**
   * 拖动时的最小宽度（px）：默认只留一窄条（几乎关上，还能拖回来）；比内容窄时内容被裁掉，不挤成一列
   * @default 48
   */
  minWidth?: number;
  /** 宽度调整手柄的部件属性 */
  propsResizeHandle?: Partial<ResizeHandleProps>;
}

/**
 * 抽屉的配方：部件同 ModalCore（base 并进了 modalPartStyles）；root 是 dialog 元素（去掉居中、按所在一侧定位与滑入），
 * 能拖动调整宽度时标题行、说明、正文、页脚保持最小宽度
 */
export const drawerRecipe = css.recipe({
  name: 'Drawer',
  parts: ['root', 'header', 'title', 'close', 'description', 'body', 'bodyContent', 'footer'],
  base: {
    ...modalPartStyles,
    root: {
      ...modalPartStyles.root,
      margin: 0,
      // 给了 width 时宽度写在行内，最多到视口宽
      maxWidth: '100vw',
      maxHeight: '100dvh',
      borderRadius: 0,
      // 进场从所在一侧滑入（@starting-style），离场滑回去（allow-discrete，离场过渡目前只有 Chromium）；
      // “减少动态效果”时时长为 0。打开时 translate 是 none 而不是 0 0：否则抽屉会成为 fixed 子元素
      // （移进来的 Toaster）的包含块；关闭时不显示，移到所在一侧之外没有这个问题
      transition: {
        default: `translate ${t.durations.md} ${t.easings.exit}, display ${t.durations.md} allow-discrete, overlay ${t.durations.md} allow-discrete`,
        ':modal': `translate ${t.durations.lg} ${t.easings.enter}, display ${t.durations.lg} allow-discrete, overlay ${t.durations.lg} allow-discrete`,
      },
    },
  },
  variants: {
    // 左右两侧占满视口高度、宽度看档位，上下两侧占满视口宽度、高度由内容决定。
    // 位置用逻辑属性，从右到左排版自动换边；translate 是物理方向，用 :dir() 区分
    side: {
      start: {
        root: {
          insetBlock: 0,
          width: '_full',
          height: '100dvh',
          overflow: 'hidden',
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
      },
      end: {
        root: {
          insetBlock: 0,
          width: '_full',
          height: '100dvh',
          overflow: 'hidden',
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
      },
      top: {
        root: {
          insetInline: 0,
          width: '100vw',
          height: 'auto',
          top: 0,
          bottom: 'auto',
          borderBlockStartWidth: 0,
          translate: {
            default: '0 -100%',
            ':modal': { default: 'none', '@starting-style': '0 -100%' },
          },
        },
      },
      bottom: {
        root: {
          insetInline: 0,
          width: '100vw',
          height: 'auto',
          top: 'auto',
          bottom: 0,
          borderBlockEndWidth: 0,
          translate: {
            default: '0 100%',
            ':modal': { default: 'none', '@starting-style': '0 100%' },
          },
        },
      },
    },
    // 左右两侧、没给 width 时的宽度档位
    size: {
      xs: { root: { maxWidth: `min(${t.sizes.xs}, 100vw)` } },
      sm: { root: { maxWidth: `min(${t.sizes.sm}, 100vw)` } },
      md: { root: { maxWidth: `min(${t.sizes.md}, 100vw)` } },
      lg: { root: { maxWidth: `min(${t.sizes.lg}, 100vw)` } },
      xl: { root: { maxWidth: `min(${t.sizes.xl}, 100vw)` } },
    },
    // 能拖动调整宽度（左右两侧）：拖窄以后内容保持能读的最小宽度，多出来的被面板裁掉
    resizable: {
      true: {
        header: { minWidth: 'min(20rem, 100vw - 3rem)' },
        description: { minWidth: 'min(20rem, 100vw - 3rem)' },
        body: { minWidth: 'min(20rem, 100vw - 3rem)' },
        footer: { minWidth: 'min(20rem, 100vw - 3rem)' },
      },
    },
  },
});

/** 抽屉的部件（createUi / Provider 的 styles.Drawer 按它定制） */
export type DrawerPart = (typeof drawerRecipe.parts)[number];

/** 抽屉：贴着视口一侧滑入的模态面板 */
export const Drawer = _component(
  ({
    _open: open = _bindable(false),
    side = 'end',
    size,
    _width: width = _bindable<number | null>(null),
    resizable,
    minWidth = 48,
    propsResizeHandle,
    ...rest
  }: DrawerProps) => {
    const appearance = useDefaults('Drawer', () => ({ size, resizable }), {
      size: 'xs',
      resizable: true,
    });
    const messages = useLang();
    const recipe = useRecipe(drawerRecipe);
    // 双击回到打开时的宽度
    const initialWidth = _untrack(width);
    return () => {
      const inline = side === 'start' || side === 'end';
      const resizing = inline && appearance().resizable;
      const s = recipe({
        side,
        size: inline && width == null ? appearance().size : undefined,
        resizable: resizing,
      });
      return (
        <ModalCore
          {...rest}
          _open={open}
          parts={s}
          style={inline && width != null ? { width: `${width}px` } : undefined}
          data-side={side}
          edge={
            resizing && (
              <ResizeHandle
                aria-label={messages.drawerResize}
                minWidth={minWidth}
                maxWidth={typeof window === 'undefined' ? undefined : window.innerWidth - 48}
                defaultWidth={initialWidth ?? undefined}
                {...propsResizeHandle}
                edge={side === 'end' ? 'start' : 'end'}
                width={width ?? undefined}
                onWidthChange={(next: number) => (width = next)}
              />
            )
          }
        />
      );
    };
  },
);

/** useDrawer 返回的：open 打开一个抽屉 */
export interface DrawerApi {
  /** 打开抽屉：属性同 Drawer（open 由句柄管理），content 是正文；返回句柄 */
  open(options: DetachedOverlayOptions<DrawerProps>): DetachedOverlayHandle<DrawerProps>;
}

/**
 * 命令式抽屉：在组件 setup 里调用，用法同 useDialog。从表格的一行打开详情、编辑时不必在页面里放一个 Drawer 再管 open：
 *
 *   const drawer = useDrawer();
 *   drawer.open({ title: `订单 ${row.id}`, size: 'md', content: (handle) => <OrderForm id={row.id} onSaved={handle.close} /> });
 */
export function useDrawer(): DrawerApi {
  const open = useDetachedOverlay<DrawerProps>((props, host, children) => (
    <Drawer {...props} _open={host.open}>
      {children}
    </Drawer>
  ));
  return { open };
}

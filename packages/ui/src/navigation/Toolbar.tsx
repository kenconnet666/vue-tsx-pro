/**
 * 工具栏（role="toolbar"）：一组相关的按钮、链接。整组只占一个 Tab 位置，组内用方向键移动（漫游焦点），
 * 键盘用户不必一个个 Tab 过去（WAI-ARIA 的 Toolbar 模式）。名称写 aria-label。
 *
 *   <Toolbar aria-label="文字格式">
 *     <IconButton icon={Bold} aria-label="加粗" />
 *     <IconButton icon={Italic} aria-label="斜体" />
 *   </Toolbar>
 *   <Toolbar docked="top" variant="surface" aria-label="主工具栏">…<Flex grow />…</Toolbar>   停在区域顶上的工具条
 *   <Toolbar docked="bottom" variant="surface" size="sm" aria-label="状态栏">…</Toolbar>      状态栏
 *
 * 里面的输入框不参与方向键移动（左右键要用来移动光标），用 Tab 进出。
 * 里面的 ToggleGroup 不再自己管焦点，它的按钮和其他按钮一起用方向键移动（同 WAI-ARIA 的文字格式工具栏示例）。
 *
 * docked 是停在所在区域的哪条边上（IDE、编辑器的主工具条、面板顶上的工具条、状态栏）：朝里的那条边画分隔线、留出内边距、
 * 不折行、不被挤小；把后面的项推到结束边用 `<Flex grow />`。size 是停靠时的字号档位（状态栏用 sm）。
 */
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useComponent } from '../config/components';
import { mergeAttrs, type PartProps } from '../utils/props';
import { rovingFocus } from '../utils/dom/roving-focus';
import { gapStyles, variantOf, type Space } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 工具栏方向 */
export interface ToolbarOrientations {
  /** 横排（默认），左右键移动 */
  horizontal: unknown;
  /** 竖排，上下键移动 */
  vertical: unknown;
}

/** 工具栏的外观 */
export interface ToolbarVariants {
  /** 没有底色（默认）：放在别的表面里的一组按钮 */
  plain: unknown;
  /** 抬高一层的表面色：停在工作区边上的工具条、状态栏 */
  surface: unknown;
}

/** 停在所在区域的哪条边上：朝里的那条边画分隔线 */
export interface ToolbarDocks {
  /** 顶边（主工具条、面板顶上的工具条），分隔线在下 */
  top: unknown;
  /** 底边（状态栏），分隔线在上 */
  bottom: unknown;
  /** 起始边（竖排的工具条），分隔线在结束边一侧 */
  start: unknown;
  /** 结束边，分隔线在起始边一侧 */
  end: unknown;
}

/** Toolbar 的外观选项：可以在 ComponentDefaults 里统一设置 */
export interface ToolbarOptions {
  /** 外观，默认 plain */
  variant?: keyof ToolbarVariants;
  /** 停在所在区域的哪条边上；不写时是普通的一组按钮（不画分隔线、没有内边距） */
  docked?: keyof ToolbarDocks;
  /** 放不下时折行；默认不停靠时折行、停靠时不折行（停靠的工具条高度固定） */
  wrap?: boolean;
  /** 字号档位，里面的按钮、文字随之缩放；不写时继承上下文字号 */
  size?: TextSize;
}

/** 角色与方向由组件管理 */
export type ToolbarManaged = 'role' | 'aria-orientation';

/** 未声明的属性落到 div 上；aria-label 是工具栏的名称 */
export interface ToolbarProps extends PartProps<'div', ToolbarManaged>, ToolbarOptions {
  /** 方向，默认 horizontal */
  orientation?: keyof ToolbarOrientations;
  /** 到两端后是否从另一端继续，默认 true */
  loop?: boolean;
  /** 项之间的间距档位，默认 xs */
  gap?: Space;
  /** 参与方向键移动的项的选择器，默认按钮与链接 */
  items?: string;
  children?: VNodeChild;
}

/** 工具栏的配方：方向、外观、停靠的边、折行、字号、间距是档位 */
export const toolbarRecipe = css.recipe({
  name: 'Toolbar',
  parts: ['root'],
  base: { root: { display: 'flex', alignItems: 'center', boxSizing: 'border-box', minWidth: 0 } },
  variants: {
    orientation: {
      horizontal: {},
      vertical: { root: { flexDirection: 'column', alignItems: 'stretch' } },
    },
    variant: {
      plain: {},
      surface: { root: { backgroundColor: '_surfaceRaised', color: '_text' } },
    },
    docked: {
      top: {
        root: {
          flexShrink: 0,
          paddingInline: '_xs',
          paddingBlock: '_xxs',
          borderBlockEndWidth: '_xs',
          borderBlockEndStyle: 'solid',
          borderBlockEndColor: '_borderMuted',
        },
      },
      bottom: {
        root: {
          flexShrink: 0,
          paddingInline: '_xs',
          paddingBlock: '_xxs',
          borderBlockStartWidth: '_xs',
          borderBlockStartStyle: 'solid',
          borderBlockStartColor: '_borderMuted',
        },
      },
      start: {
        root: {
          flexShrink: 0,
          paddingInline: '_xxs',
          paddingBlock: '_xs',
          borderInlineEndWidth: '_xs',
          borderInlineEndStyle: 'solid',
          borderInlineEndColor: '_borderMuted',
        },
      },
      end: {
        root: {
          flexShrink: 0,
          paddingInline: '_xxs',
          paddingBlock: '_xs',
          borderInlineStartWidth: '_xs',
          borderInlineStartStyle: 'solid',
          borderInlineStartColor: '_borderMuted',
        },
      },
    },
    wrap: {
      true: { root: { flexWrap: 'wrap' } },
      // 停靠的工具条放不下时项不换行、文字截断，不把工具条撑高
      false: { root: { flexWrap: 'nowrap', whiteSpace: 'nowrap' } },
    },
    size: variantOf(fontSizeStyles, 'root'),
    gap: variantOf(gapStyles, 'root'),
  },
});

/** 工具栏的部件（createUi / Provider 的 styles.Toolbar 按它定制） */
export type ToolbarPart = (typeof toolbarRecipe.parts)[number];

/** 默认参与方向键移动的项：按钮、链接、自定义的 role="button" */
const DEFAULT_ITEMS = 'button, a[href], [role="button"]';

/** 工具栏交给里面的组件的状态 */
export interface ToolbarState {
  /** 方向 */
  readonly orientation: keyof ToolbarOrientations;
}

/** 工具栏的上下文：里面自带漫游焦点的组件（ToggleGroup）据此把焦点交给工具栏统一管理 */
export const ToolbarContext = createContext<ToolbarState>('Toolbar');

/** 工具栏：一个 Tab 位置，组内方向键移动 */
export const Toolbar = _component(
  ({
    orientation = 'horizontal',
    loop = true,
    gap = 'xs',
    items = DEFAULT_ITEMS,
    variant,
    docked,
    wrap,
    size,
    children,
    ...rest
  }: ToolbarProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    const ui = useComponent(
      toolbarRecipe,
      () => ({ orientation, variant, docked, wrap: wrap ?? docked === undefined, size, gap }),
      { variant: 'plain' },
    );
    // Tab 进入时落在上次聚焦的项，没有就是第一项：不跳到按下的切换按钮上（那是标签页的习惯）
    _effect(() =>
      root
        ? rovingFocus(root, { items, orientation, loop, initial: (enabled) => enabled[0] })
        : undefined,
    );
    ToolbarContext.provide({
      get orientation() {
        return orientation;
      },
    });

    return () => (
      <div
        {...mergeAttrs<'div'>(ui().parts.root, rest, {
          ref: _toRef(root),
          role: 'toolbar',
          'aria-orientation': orientation,
        })}
        data-orientation={orientation}
        data-docked={docked}
      >
        {children}
      </div>
    );
  },
);

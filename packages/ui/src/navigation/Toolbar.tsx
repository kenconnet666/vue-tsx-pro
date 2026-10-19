/**
 * 工具栏（role="toolbar"）：一组相关的按钮、链接。整组只占一个 Tab 位置，组内用方向键移动（漫游焦点），
 * 键盘用户不必一个个 Tab 过去（WAI-ARIA 的 Toolbar 模式）。名称写 aria-label。
 *
 *   <Toolbar aria-label="文字格式">
 *     <IconButton icon={Bold} aria-label="加粗" />
 *     <IconButton icon={Italic} aria-label="斜体" />
 *   </Toolbar>
 *
 * 里面的输入框不参与方向键移动（左右键要用来移动光标），用 Tab 进出。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { rovingFocus } from '../utils/dom/roving-focus';
import { gapStyles, type Space } from '../utils/style/styles';

/** 工具栏方向 */
export interface ToolbarOrientations {
  /** 横排（默认），左右键移动 */
  horizontal: unknown;
  /** 竖排，上下键移动 */
  vertical: unknown;
}

/** 角色与方向由组件管理 */
type Managed = 'role' | 'aria-orientation';

/** 未声明的属性落到 div 上；aria-label 是工具栏的名称 */
export interface ToolbarProps extends PartProps<'div', Managed> {
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

const styles = stylex.create({
  root: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
  vertical: { flexDirection: 'column', alignItems: 'stretch' },
});

/** 默认参与方向键移动的项：按钮、链接、自定义的 role="button" */
const DEFAULT_ITEMS = 'button, a[href], [role="button"]';

/** 工具栏：一个 Tab 位置，组内方向键移动 */
export const Toolbar = _component(
  ({
    orientation = 'horizontal',
    loop = true,
    gap = 'xs',
    items = DEFAULT_ITEMS,
    children,
    ...rest
  }: ToolbarProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    _effect(() => (root ? rovingFocus(root, { items, orientation, loop }) : undefined));

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>(
            { sx: [styles.root, orientation === 'vertical' && styles.vertical, gapStyles[gap]] },
            rest,
            { ref: _toRef(root), role: 'toolbar', 'aria-orientation': orientation },
          ),
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    );
  },
);

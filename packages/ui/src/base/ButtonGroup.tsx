/**
 * 按钮组（div，role="group"）：几个相关的按钮连成一条，共用外观。分段操作、拆分按钮、翻页、对齐方式这类工具栏。
 *
 *   <ButtonGroup variant="outline" tone="neutral" aria-label="文字对齐">
 *     <IconButton icon={AlignLeft} aria-label="左对齐" />
 *     <IconButton icon={AlignCenter} aria-label="居中" />
 *   </ButtonGroup>
 *
 * 组里的按钮家族（Button、LinkButton、IconButton…）经 AttachedContext 得知自己在组里：去掉相邻一侧的圆角、边框叠在一起；
 * 组上写的 variant、tone、size、radius 是组里按钮的默认值，按钮自己写的优先。
 * 实底（solid）的相邻按钮之间没有分隔，连成一条时用 outline、surface 更清楚。
 * 只是排一排、不相连的按钮用 Flex。选中其中一项（单选、多选）用 ToggleGroup。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import { AttachedContext, type AttachedOrientations } from '../utils/style/attached';
import { ButtonGroupContext, type ButtonOptions } from './button-core';

/** 角色由组件管理 */
export type ButtonGroupManaged = 'role';

/** 未声明的属性落到 div 上；aria-label 是这组操作的名称 */
export interface ButtonGroupProps
  extends
    PartProps<'div', ButtonGroupManaged>,
    Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'> {
  /**
   * 排列方向
   * @default 'horizontal'
   */
  orientation?: keyof AttachedOrientations;
  /** 按钮 */
  children?: VNodeChild;
}

/** ButtonGroup 的样式：root、vertical */
export const buttonGroupStyles = css.create({
  root: { display: 'inline-flex', alignItems: 'stretch' },
  vertical: { flexDirection: 'column' },
});

/** 按钮组：相连的一排（或一列）按钮，共用外观 */
export const ButtonGroup = _component(
  ({
    variant,
    tone,
    size,
    radius,
    orientation = 'horizontal',
    children,
    ...rest
  }: ButtonGroupProps) => {
    ButtonGroupContext.provide({
      get appearance() {
        return { variant, tone, size, radius };
      },
    });
    AttachedContext.provide({
      get orientation() {
        return orientation;
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [buttonGroupStyles.root, orientation === 'vertical' && buttonGroupStyles.vertical],
          },
          rest,
          { role: 'group' },
        )}
      >
        {children}
      </div>
    );
  },
);

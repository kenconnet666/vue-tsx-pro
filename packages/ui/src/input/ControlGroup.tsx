/**
 * 组合输入（div，role="group"）：输入框、选择框、按钮连成一条，共用边框：币种 + 金额、协议 + 域名、搜索框 + 搜索按钮。
 *
 *   <ControlGroup aria-label="金额">
 *     <Select items={currencies} value={_bind(currency)} aria-label="币种" style="width: 6rem" />
 *     <NumberField value={_bind(amount)} aria-label="金额" />
 *   </ControlGroup>
 *
 * 里面的输入框外壳与按钮家族经 AttachedContext 得知自己在组里：去掉相邻一侧的圆角、边框叠在一起，
 * 聚焦的那个浮到上面，焦点环完整。输入框默认占满剩余宽度，选择框、按钮按内容宽。
 * 只有文字的前后缀（单位、https://）用输入框自己的 prefix / suffix，不必拆成两个控件。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import { AttachedContext, type AttachedOrientations } from '../utils/style/attached';

/** 角色由组件管理 */
export type ControlGroupManaged = 'role';

/** 未声明的属性落到 div 上；aria-label 是这组输入的名称 */
export interface ControlGroupProps extends PartProps<'div', ControlGroupManaged> {
  /**
   * 排列方向
   * @default 'horizontal'
   */
  orientation?: keyof AttachedOrientations;
  /** 不占满一行（行内排列），默认占满 */
  inline?: boolean;
  /** 输入框、选择框、按钮 */
  children?: VNodeChild;
}

/** ControlGroup 的样式：root、inline、vertical */
export const controlGroupStyles = stylex.create({
  // 输入框外壳（:not(button)）分掉剩余宽度；按钮、选择框的触发器按内容宽
  root: { display: 'flex', alignItems: 'stretch', width: '100%' },
  inline: { display: 'inline-flex', width: 'auto' },
  vertical: { flexDirection: 'column' },
});

/** 组合输入：相连的一排输入框与按钮 */
export const ControlGroup = _component(
  ({ orientation = 'horizontal', inline = false, children, ...rest }: ControlGroupProps) => {
    AttachedContext.provide({
      get orientation() {
        return orientation;
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              controlGroupStyles.root,
              inline && controlGroupStyles.inline,
              orientation === 'vertical' && controlGroupStyles.vertical,
            ],
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

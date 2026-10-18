/**
 * 标记（span）：状态、计数、分类等短文字。只展示，不可交互；可以关闭或选择的用 Tag。
 *
 *   <Badge tone="success">已发货</Badge>
 *   <Badge variant="solid" tone="danger" radius="full">12</Badge>
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { badgeSx, type BadgeOptions } from './badge-styles';
import { Icon, type IconData, type IconProps } from './Icon';

/** 未声明的属性落到 span 上 */
export interface BadgeProps extends PartProps<'span'>, BadgeOptions {
  /** 文字前的图标 */
  icon?: IconData;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  children?: VNodeChild;
}

/** 标记（span）：状态色调 × 样式，字号默认 xs */
export const Badge = _component(
  ({ variant, tone, size, radius, icon, propsIcon, children, ...rest }: BadgeProps) => {
    const defaults = useDefaults('Badge');
    return () => (
      <span
        {...elementProps(
          mergeProps<'span'>(
            {
              sx: badgeSx({
                variant: variant ?? defaults.variant,
                tone: tone ?? defaults.tone,
                size: size ?? defaults.size,
                radius: radius ?? defaults.radius,
              }),
            },
            rest,
          ),
        )}
      >
        {icon && <Icon {...(mergeProps<IconProps>({ icon }, propsIcon) as IconProps)} />}
        {children}
      </span>
    );
  },
);

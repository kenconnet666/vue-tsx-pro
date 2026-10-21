/**
 * 标记（span）：状态、计数、分类等短文字。只展示，不可交互；可以关闭或选择的用 Tag。
 *
 *   <Badge tone="success">已发货</Badge>
 *   <Badge variant="solid" tone="danger" radius="full">12</Badge>
 *   <Badge tone="warning" dot>待审核</Badge>          文字前一个同色的圆点：表格里的状态
 *   <StatusBadge statuses={taskStatuses} value="verifying" />   名字与色调取自状态映射（createStatusMap）
 *
 * 部件：Root（span）、Icon、Dot（span，dot 时）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import type { StatusMap } from '../utils/data/status';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { badgeSx, type BadgeOptions } from './badge-styles';
import { Icon, type IconData, type IconProps } from './Icon';

/** 未声明的属性落到 span 上 */
export interface BadgeProps extends PartProps<'span'>, BadgeOptions {
  /** 文字前的图标 */
  icon?: IconData;
  /** 文字前一个同色的圆点（没有图标时）：表格、列表里的状态，比整块底色更轻 */
  dot?: boolean;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 圆点的部件属性 */
  propsDot?: PartProps<'span', 'aria-hidden'>;
  children?: VNodeChild;
}

/** Badge 的样式：dot */
export const badgeDotStyles = stylex.create({
  // 跟着文字色：soft、outline 是色调色，solid 是反白
  dot: {
    flexShrink: 0,
    width: '0.5em',
    height: '0.5em',
    borderRadius: '_full',
    backgroundColor: 'currentColor',
  },
});

/** 标记（span）：状态色调 × 样式，字号默认 xs */
export const Badge = _component(
  ({
    variant,
    tone,
    size,
    radius,
    icon,
    dot = false,
    propsIcon,
    propsDot,
    children,
    ...rest
  }: BadgeProps) => {
    const appearance = useDefaults('Badge', () => ({ variant, tone, size, radius }));
    return () => (
      <span {...mergeAttrs<'span'>({ sx: badgeSx(appearance()) }, rest)}>
        {icon ? (
          <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />
        ) : (
          dot && (
            <span
              {...mergeAttrs<'span'>({ sx: badgeDotStyles.dot }, propsDot, { 'aria-hidden': true })}
            />
          )
        )}
        {children}
      </span>
    );
  },
);

/** 名字、色调、图标由状态映射决定；其余同 Badge */
export interface StatusBadgeProps<K extends string> extends Omit<
  BadgeProps,
  'tone' | 'icon' | 'children'
> {
  /** 状态映射（createStatusMap） */
  statuses: StatusMap<K>;
  /** 当前状态；不认识的 key 显示成中性色、名字就是 key */
  value: K | (string & {});
}

/** 状态标记：按状态映射显示名字与色调，没有图标的状态前画圆点 */
export const StatusBadge = _component(
  <K extends string>({ statuses, value, dot = true, ...rest }: StatusBadgeProps<K>) =>
    () => {
      const status = statuses.get(value);
      return (
        <Badge
          {...mergePartProps<BadgeProps>({ tone: status.tone, icon: status.icon, dot }, rest)}
          data-status={value}
        >
          {status.label}
        </Badge>
      );
    },
);

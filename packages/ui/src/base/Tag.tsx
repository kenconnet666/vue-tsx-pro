/**
 * 标签（span）：外观同 Badge，可以带移除按钮（筛选条件、已选项、输入的关键词）。
 *
 *   <Tag onRemove={() => remove(item)}>{item.name}</Tag>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { focusAfterRemoval } from '../utils/dom/focus';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { plainText } from '../utils/data/text';
import { badgeSx, type BadgeOptions } from './badge-styles';
import { CloseButton, type PresetIconButtonProps } from './CloseButton';
import { Icon, type IconData, type IconProps } from './Icon';
import type { StyleTable } from '../utils/style/styles';

/** 未声明的属性落到 span 上 */
export interface TagProps extends PartProps<'span'>, BadgeOptions {
  /** 文字前的图标 */
  icon?: IconData;
  /** 给了就显示移除按钮，点击时调用；标签随后被移除时，焦点交给同组的下一个（没有就上一个）可聚焦元素 */
  onRemove?: () => void;
  /** 移除按钮的无障碍名称，默认“移除”加上标签文字（内容只有文字时） */
  removeLabel?: string;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 移除按钮的部件属性 */
  propsRemove?: Partial<PresetIconButtonProps>;
  children?: VNodeChild;
}

/** Tag 的样式：removable、remove */
export const tagStyles: StyleTable<'removable' | 'remove'> = stylex.create({
  // 移除按钮紧贴右侧，比独立的图标按钮紧凑（标签之间留有间距，满足目标尺寸的间距例外）
  removable: { paddingInlineEnd: '_xs' },
  remove: {
    width: '1.5em',
    minHeight: '1.5em',
    marginBlock: 'calc(-1 * _space.xs)',
    color: 'inherit',
  },
});

/** 标签（span）：外观同 Badge，可以带移除按钮 */
export const Tag = _component(
  ({
    variant,
    tone,
    size,
    radius,
    icon,
    onRemove,
    removeLabel,
    propsIcon,
    propsRemove,
    children,
    ...rest
  }: TagProps) => {
    const lang = useLang();
    const defaults = useDefaults('Badge');
    return () => {
      const text = plainText(children);
      const label = removeLabel ?? (text ? `${lang.remove} ${text}` : lang.remove);
      return (
        <span
          {...elementProps(
            mergeProps<'span'>(
              {
                sx: [
                  badgeSx({
                    variant: variant ?? defaults.variant,
                    tone: tone ?? defaults.tone,
                    size: size ?? defaults.size,
                    radius: radius ?? defaults.radius,
                  }),
                  onRemove && tagStyles.removable,
                ],
              },
              rest,
            ),
          )}
        >
          {icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />}
          {children}
          {onRemove && (
            <CloseButton
              {...mergeProps<PresetIconButtonProps>(
                { sx: tagStyles.remove, 'aria-label': label, radius: 'full' },
                propsRemove,
                {
                  onClick: (event: MouseEvent) => {
                    focusAfterRemoval((event.currentTarget as HTMLElement).parentElement!);
                    onRemove();
                  },
                },
              )}
            />
          )}
        </span>
      );
    };
  },
);

/**
 * 标签（span）：外观同 Badge，可以带移除按钮（筛选条件、已选项、输入的关键词）。
 *
 *   <Tag onRemove={() => remove(item)}>{item.name}</Tag>
 *
 * 移除时标签先淡出缩小（usePresence），离场结束才调用 onRemove。其余标签平移补位交给所在容器：
 *   const layout = useLayoutAnimation(() => list);
 *   <Tag onRemove={() => layout.change(() => remove(item))}>…</Tag>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useDismissible } from '../utils/motion/presence';
import { mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { plainText } from '../utils/data/text';
import { badgeParts, badgeRecipe, type BadgeOptions } from './badge-styles';
import { partAttrs, useRecipe } from '../config/styles';
import { CloseButton, type PresetIconButtonProps } from './CloseButton';
import { Icon, type IconData, type IconProps } from './Icon';
import { t } from '../config/theme/tokens';

/** 未声明的属性落到 span 上 */
export interface TagProps extends PartProps<'span'>, BadgeOptions {
  /** 文字前的图标 */
  icon?: IconData;
  /** 给了就显示移除按钮：点击后标签先淡出缩小，离场结束再调用；标签随后被移除时，焦点交给同组的下一个（没有就上一个）可聚焦元素；没被移除就重新显示 */
  onRemove?: () => void;
  /** 移除按钮的无障碍名称，默认“移除”加上标签文字（内容只有文字时） */
  removeLabel?: string;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 移除按钮的部件属性 */
  propsRemove?: Partial<PresetIconButtonProps>;
  children?: VNodeChild;
}

/** Tag 的样式：root、removable、remove、removing */
export const tagStyles = css.create({
  // 移除被拒绝（使用方没移除）时从离场状态过渡回来
  root: {
    transition: `opacity ${t.durations.sm} ${t.easings.enter}, scale ${t.durations.sm} ${t.easings.enter}`,
  },
  // 移除按钮紧贴右侧，比独立的图标按钮紧凑（标签之间留有间距，满足目标尺寸的间距例外）
  removable: { paddingInlineEnd: '_xs' },
  remove: {
    width: '1.5em',
    minHeight: '1.5em',
    marginBlock: `calc(-1 * ${t.space.xs})`,
    color: 'inherit',
  },
  removing: {
    opacity: 0,
    scale: 0.8,
    transition: `opacity ${t.durations.sm} ${t.easings.exit}, scale ${t.durations.sm} ${t.easings.exit}`,
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
    const appearance = useDefaults('Badge', () => ({ variant, tone, size, radius }));
    const recipe = useRecipe(badgeRecipe);
    // 离场结束才交给使用方移除；使用方没移除（如拒绝删除）时标签重新出现
    const dismissible = useDismissible(() => onRemove?.());
    return () => {
      const text = plainText(children);
      const label = removeLabel ?? (text ? `${lang.remove} ${text}` : lang.remove);
      return (
        <span
          {...mergeAttrs<'span'>(
            {
              ...partAttrs(badgeRecipe, 'root'),
              sx: [
                badgeParts(appearance(), recipe).root.sx,
                tagStyles.root,
                onRemove && tagStyles.removable,
                dismissible.dismissing && tagStyles.removing,
              ],
            },
            rest,
            { ref: dismissible.ref },
          )}
          data-state={dismissible.state}
        >
          {icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />}
          {children}
          {onRemove && (
            <CloseButton
              {...mergeProps<PresetIconButtonProps>(
                { sx: tagStyles.remove, 'aria-label': label, radius: 'full' },
                propsRemove,
                { onClick: dismissible.dismiss },
              )}
            />
          )}
        </span>
      );
    };
  },
);

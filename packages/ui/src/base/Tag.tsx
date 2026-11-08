/**
 * 标签（span）：外观同 Badge，可以带移除按钮（筛选条件、已选项、输入的关键词）。
 *
 *   <Tag onRemove={() => remove(item)}>{item.name}</Tag>
 *
 * 移除时标签先淡出缩小（usePresence），离场结束才调用 onRemove。其余标签平移补位交给所在容器：
 *   const layout = useLayoutAnimation(() => list);
 *   <Tag onRemove={() => layout.change(() => remove(item))}>…</Tag>
 *
 * 可选中（筛选条件的一排标签）：写了 _selected 时整个标签是按钮（aria-pressed），点一下切换；
 * 没选中时有描边（surface），选中时是实底色并在前面加一个对勾（不只靠颜色），不写色调时用 accent、字号默认 sm（点击区域够大）。
 * 可选中的标签不带移除按钮。一排放在 role="group" 加名称的容器里。
 *   <Tag _selected={filters.urgent}>加急</Tag>
 */
import { Check } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { useComponent } from '../config/components';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDismissible } from '../utils/motion/presence';
import { mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { plainText } from '../utils/data/text';
import { badgeRecipe, type BadgeOptions } from './badge-styles';
import { ButtonBase, type ButtonBaseProps } from './ButtonBase';
import { CloseButton, type PresetIconButtonProps } from './CloseButton';
import { Icon, type IconData, type IconProps } from './Icon';
import { t } from '../config/theme/tokens';
import { stateLayerStyles } from '../utils/style/styles';

/** 未声明的属性落到 span 上 */
export interface TagProps extends PartProps<'span'>, BadgeOptions {
  /** 文字前的图标 */
  icon?: IconData;
  /** 可选中：父级写 _selected={x}，标签是按钮（aria-pressed），点一下切换；选中时实底色、前面一个对勾 */
  _selected?: boolean;
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
const tagStyles = css.create({
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
  // 可选中：手形指针；颜色随选中切换时过渡（悬停的状态层见 stateLayerStyles.overlay）
  selectable: {
    cursor: 'pointer',
    transition: `background-color ${t.durations.sm} ${t.easings.standard}, color ${t.durations.sm} ${t.easings.standard}, border-color ${t.durations.sm} ${t.easings.standard}`,
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
    _selected: selected = _bindable<boolean | undefined>(undefined),
    onRemove,
    removeLabel,
    propsIcon,
    propsRemove,
    children,
    ...rest
  }: TagProps) => {
    const lang = useLang();
    const ui = useComponent(badgeRecipe, () =>
      selected === undefined
        ? { variant, tone, size, radius }
        : {
            variant: selected ? 'solid' : (variant ?? 'surface'),
            tone: tone ?? 'accent',
            size: size ?? 'sm',
            radius,
          },
    );
    // 离场结束才交给使用方移除；使用方没移除（如拒绝删除）时标签重新出现
    const dismissible = useDismissible(() => onRemove?.());
    return () => {
      if (selected !== undefined) {
        const root = ui().parts.root;
        return (
          <ButtonBase
            {...mergeProps<ButtonBaseProps>(
              { ...root, sx: [root.sx, tagStyles.selectable, stateLayerStyles.overlay] },
              rest as Partial<ButtonBaseProps>,
              { 'aria-pressed': selected, onClick: () => (selected = !selected) },
            )}
          >
            {(selected || icon) && (
              <Icon {...mergePartProps<IconProps>({ icon: selected ? Check : icon! }, propsIcon)} />
            )}
            {children}
          </ButtonBase>
        );
      }
      const text = plainText(children);
      const label = removeLabel ?? (text ? `${lang.remove} ${text}` : lang.remove);
      return (
        <span
          {...mergeAttrs<'span'>(
            {
              ...ui().parts.root,
              sx: [
                ui().parts.root.sx,
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
                // 悬停、按下的底色取标签的文字色：各色调的标签上都协调
                {
                  sx: [tagStyles.remove, stateLayerStyles.ghost],
                  'aria-label': label,
                  radius: 'full',
                },
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

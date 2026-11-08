/**
 * 列表行的外观：菜单项、下拉选项、侧边导航项、树节点共用的悬停、高亮、选中、当前、危险、不可用。
 * 各组件只在这些之上补自己的差别（导航项的字重与内边距、菜单项的焦点环），状态的颜色只在这里定义。
 * 状态跟着元素上的属性走（条件别名），组件写对 aria / data 属性即可，不按条件拼样式：
 *
 *   sx: [itemStyles.row, itemStyles.hoverable, itemStyles.states]
 *   <div role="option" aria-selected={selected} aria-disabled={disabled} data-highlighted={active || undefined}>
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../../config/theme/tokens';

/** 列表行的布局与各状态的颜色 */
export const itemStyles = css.create({
  /** 一行：图标、文字、尾部内容横排；按钮、链接、div 都能用（去掉了按钮与链接的默认外观） */
  row: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    width: '_full',
    minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
    margin: 0,
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderWidth: 0,
    borderRadius: '_sm',
    backgroundColor: 'transparent',
    color: '_text',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: '_normal',
    textAlign: 'start',
    textDecoration: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${t.durations.sm} ${t.easings.standard}, color ${t.durations.sm} ${t.easings.standard}`,
  },
  /** 指针悬停时浅色底 */
  hoverable: { backgroundColor: { default: 'transparent', _hover: '_fillHover' } },
  /**
   * 各状态，按元素上的属性：data-highlighted 键盘高亮（aria-activedescendant 指着的，与悬停同色）；aria-selected 已选
   * （品牌色文字）；aria-current / data-current 当前（导航的当前页、树的选中节点：品牌色浅底，悬停深一档，文字悬停也不变）；
   * disabled / aria-disabled 不可用（变淡；悬停的条件本来就排除了不可用）。放在 hoverable、danger 之后
   */
  states: {
    backgroundColor: {
      default: null,
      _highlighted: '_fillHover',
      _current: { default: '_accentSoft', _hover: '_accentSoftHover' },
    },
    color: {
      default: null,
      _selected: '_accentText',
      _current: { default: '_accentText', _hover: '_accentText' },
    },
    opacity: { default: null, _disabled: '_disabled' },
    cursor: { default: null, _disabled: 'not-allowed' },
  },
  /** 危险操作（删除）：红色文字，悬停浅红底 */
  danger: {
    color: '_dangerText',
    backgroundColor: { default: 'transparent', _hover: '_dangerSoft' },
  },
  /** 文字部分：占满剩余宽度，一行放不下时省略 */
  label: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

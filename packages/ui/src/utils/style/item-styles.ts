/**
 * 列表行的外观：菜单项、下拉选项、侧边导航项、表格行共用的悬停、高亮、选中、当前、危险、不可用。
 * 各组件只在这些之上补自己的差别（导航项的字重与内边距、菜单项的焦点环），状态的颜色只在这里定义。
 *
 *   sx: [itemStyles.row, itemStyles.hoverable, active && itemStyles.highlighted, disabled && itemStyles.disabled]
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 列表行的布局与各状态的颜色 */
export const itemStyles = stylex.create({
  /** 一行：图标、文字、尾部内容横排；按钮、链接、div 都能用（去掉了按钮与链接的默认外观） */
  row: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    width: '_full',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
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
    transition:
      'background-color _durations.sm _easings.standard, color _durations.sm _easings.standard',
  },
  /** 指针悬停时浅色底 */
  hoverable: { backgroundColor: { default: 'transparent', ':hover': '_fillHover' } },
  /** 键盘高亮（aria-activedescendant 指着的选项）：与悬停同色 */
  highlighted: { backgroundColor: '_fillHover' },
  /** 已选（下拉选项）：品牌色文字 */
  selected: { color: '_accentText' },
  /** 当前（导航的当前页、表格的选中行）：品牌色浅底 */
  current: {
    backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' },
    color: '_accentText',
  },
  /** 危险操作（删除）：红色文字，悬停浅红底 */
  danger: {
    color: '_dangerText',
    backgroundColor: { default: 'transparent', ':hover': '_dangerSoft' },
  },
  /** 不可用：不响应悬停（盖掉 hoverable、danger 的 :hover 底色；放在它们后面） */
  disabled: { opacity: '_disabled', cursor: 'not-allowed', backgroundColor: 'transparent' },
  /** 文字部分：占满剩余宽度，一行放不下时省略 */
  label: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

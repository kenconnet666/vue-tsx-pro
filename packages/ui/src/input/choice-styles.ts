/**
 * 勾选类控件（Checkbox、Radio、Switch）共用的样式与结构：
 *
 *   label（Root，整块可点）> span（Control，叠放层）> input（原生，appearance: none 画成方框 / 圆 / 轨道）
 *                                               + 标记（图标或滑块，叠在 input 上，不接收指针）
 *                        > span（Label，文字）
 *
 * 用原生 input：键盘（空格切换、单选组的方向键）、表单提交与重置、label 点击、读屏语义都是浏览器的；
 * 组件只画外观。勾选状态的样式由组件按自己的状态加（StyleX 不能写兄弟选择器）。尺寸用 em。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';

type Table<Key extends string> = Readonly<Record<Key, StyleXStyles>>;

/** 勾选类控件各部分的样式 */
export const choiceStyles: Table<
  'root' | 'disabled' | 'control' | 'input' | 'checked' | 'invalid' | 'mark' | 'label'
> = stylex.create({
  /** 外层 label：控件与文字一行，整块可点；点击区域不小于 24px（WCAG 2.5.8） */
  root: {
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: '_sm',
    minHeight: '_sizes.minTarget',
    lineHeight: '_normal',
    color: '_text',
    cursor: 'pointer',
    userSelect: 'none',
  },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  /** 叠放层：input 与标记放在同一个网格格子里；与第一行文字垂直居中（行高 1.5em） */
  control: {
    display: 'inline-grid',
    placeItems: 'center',
    flexShrink: 0,
    minHeight: '1.5em',
  },
  /** 原生 input：去掉浏览器外观，由各组件给出形状 */
  input: {
    gridArea: '1 / 1',
    appearance: 'none',
    boxSizing: 'border-box',
    margin: 0,
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: '_borderStrong',
    backgroundColor: '_surface',
    cursor: 'inherit',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: '_borderWidths.sm',
    transition:
      'background-color _durations.sm _easings.standard, border-color _durations.sm _easings.standard',
  },
  /** 已勾选（或部分勾选）：实底品牌色 */
  checked: { borderColor: '_accent', backgroundColor: '_accent' },
  invalid: { borderColor: '_danger', outlineColor: '_danger' },
  /** 标记（对勾、圆点、开关滑块）：叠在 input 上，点击穿透到 input */
  mark: { gridArea: '1 / 1', pointerEvents: 'none' },
  /** 文字 */
  label: { minWidth: 0 },
});

/** 复选组、单选组的排列方向 */
export interface ChoiceOrientations {
  /** 竖排（默认） */
  vertical: unknown;
  /** 横排，放不下时换行 */
  horizontal: unknown;
}

/** 复选组、单选组的排列 */
export const choiceGroupStyles: Table<keyof ChoiceOrientations> = stylex.create({
  vertical: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  horizontal: { display: 'flex', flexWrap: 'wrap', columnGap: '_lg', rowGap: '_xs' },
});

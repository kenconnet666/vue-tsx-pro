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
import { nextTick } from 'vue';
import { useDefaults } from '../config/defaults';
import { toneFillStyles, type StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

/** 勾选类控件的外观选项；可以用 createUi / Provider 的 defaults.Choice 统一改默认值 */
export interface ChoiceOptions {
  /** 字号档位（方框、圆、开关随之缩放）；不写时继承上下文字号 */
  size?: TextSize;
  /**
   * 选中时的色调（与 Button、Badge 等同一套）
   * @default 'accent'
   */
  tone?: StatusTone;
}

/** 合并后的外观：tone 总有值，size 不写时继承字号 */
export type ChoiceAppearance = Pick<ChoiceOptions, 'size'> & Required<Pick<ChoiceOptions, 'tone'>>;

/** 勾选类控件的外观：显式写的 > defaults.Choice > 默认。在 setup 里调用，返回的函数在渲染时调用 */
export function useChoiceAppearance(read: () => ChoiceOptions): () => ChoiceAppearance {
  return useDefaults('Choice', read, { tone: 'accent' });
}

/** 外层 label 的样式：字号、色调（经 toneFillStyles 的变量传给方框、圆点、轨道）、不可用、只读 */
export function choiceRootSx(
  { size, tone }: ChoiceAppearance,
  disabled: boolean,
  readonly = false,
): StyleXStyles {
  return [
    choiceStyles.root,
    toneFillStyles[tone],
    size && fontSizeStyles[size],
    readonly && choiceStyles.readonly,
    disabled && choiceStyles.disabled,
  ] as StyleXStyles;
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * 只读的原生勾选框要拦住的事件：点击（空格键也是点击）不改勾选，单选组的方向键不换选中项。
 * 原生 checkbox 没有 readonly 属性；这样焦点照常能到，读屏经 aria-readonly 念“只读”，值也照常随表单提交
 */
export const readonlyChoiceHandlers = {
  onClick: (event: Event) => event.preventDefault(),
  onKeydown: (event: KeyboardEvent) => {
    if (ARROW_KEYS.has(event.key)) event.preventDefault();
  },
};

/**
 * 受控的勾选：改值之后，父级没接受（或改成了别的值）时把原生 input 的 checked 改回去。
 * 浏览器在点击时已经改了 checked（单选还取消了同组原来选中的那个），而 Vue 比较的是 prop：
 * 父级的值没变就不会去动 DOM，界面和值就对不上了（切换要等接口的开关、只能选几项的复选框）
 */
export function syncChecked(
  inputs: readonly HTMLInputElement[],
  isChecked: (input: HTMLInputElement) => boolean,
): void {
  void nextTick(() => {
    for (const input of inputs) {
      const checked = isChecked(input);
      if (input.checked !== checked) input.checked = checked;
    }
  });
}

/** 勾选类控件各部分的样式 */
export const choiceStyles = stylex.create({
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
  /** 只读：外观照常（看得清选了什么），只是不像能点 */
  readonly: { cursor: 'default' },
  /** 叠放层：input 与标记放在同一个网格格子里；与第一行文字垂直居中（行高 1.5em） */
  control: {
    display: 'inline-grid',
    placeItems: 'center',
    flexShrink: 0,
    minHeight: '1.5em',
  },
  /** 原生 input：去掉浏览器外观，由各组件给出形状；焦点环用 focusRingStyles.tight（排在它后面） */
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
    transition: `background-color ${t.durations.sm} ${t.easings.standard}, border-color ${t.durations.sm} ${t.easings.standard}`,
  },
  /** 已勾选（或部分勾选）：色调的实底色，见 choiceRootSx */
  checked: { borderColor: 'var(--tone-fill)', backgroundColor: 'var(--tone-fill)' },
  invalid: { borderColor: '_danger', outlineColor: '_danger' },
  /** 标记（对勾、圆点、开关滑块）：叠在 input 上，点击穿透到 input */
  mark: { gridArea: '1 / 1', pointerEvents: 'none' },
  /** 文字（有说明时文字在上、说明在下） */
  label: { minWidth: 0, display: 'grid' },
  /** 文字下方的说明：次要颜色、小一号 */
  description: { color: '_textMuted', fontSize: '0.875em' },
});

/** 复选组、单选组的排列方向 */
export interface ChoiceOrientations {
  /** 竖排（默认） */
  vertical: unknown;
  /** 横排，放不下时换行 */
  horizontal: unknown;
}

/** 复选组、单选组的排列 */
export const choiceGroupStyles = stylex.create({
  vertical: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  horizontal: { display: 'flex', flexWrap: 'wrap', columnGap: '_lg', rowGap: '_xs' },
});

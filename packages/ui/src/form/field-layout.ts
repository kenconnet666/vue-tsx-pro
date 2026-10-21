/**
 * 一组字段共同的布局与状态：标签放在上方还是起始边（左侧）、标签宽度与对齐、整组只读或不可用。
 * Form、FormSection 设置，Field 与控件读取；层层叠加，里层没写的项沿用外层，Field 与控件上显式写的优先。
 *
 *   <Form controller={form} labelPlacement="start" labelWidth="8em">…</Form>
 *   <Form controller={form} readonly>…</Form>   // 整张表单只读（查看详情）
 */
import { createContext } from '@vue-tsx-pro/tsx';

/** 标签放在哪 */
export interface FieldLabelPlacements {
  /** 控件上方（默认）：窄容器、移动端、标签很长时 */
  top: unknown;
  /** 控件的起始边（从左到右排版时在左侧）：宽屏的长表单，标签一列对齐、省纵向空间 */
  start: unknown;
}

/** 标签在起始边时，标签文字在标签列里的对齐 */
export interface FieldLabelAligns {
  /** 靠起始边 */
  start: unknown;
  /** 靠结束边、贴着控件（默认）：标签长短不一时，标签与控件之间的距离一致 */
  end: unknown;
}

/** 一组字段共同的设置；没写的项沿用外层 */
export interface FieldLayout {
  /** 标签放在哪，默认 top */
  labelPlacement?: keyof FieldLabelPlacements;
  /** 标签在起始边时标签列的宽度：数字是 px，也可以写 CSS 长度如 `'8em'`；默认 `'8em'` */
  labelWidth?: number | string;
  /** 标签在起始边时文字的对齐，默认 end */
  labelAlign?: keyof FieldLabelAligns;
  /** 整组不可用：里面的字段与控件都不可用 */
  disabled?: boolean;
  /** 整组只读：里面的字段与控件都只读（查看详情、审批时） */
  readonly?: boolean;
}

/** 字段布局的上下文：Form、FormSection 用 provideFieldLayout 提供，Field、useFieldControl 读取 */
export const FieldLayoutContext = createContext<Readonly<FieldLayout>>('FieldLayout');

/**
 * 在 setup 里调用：把 read() 给出的设置叠在外层的设置上提供下去。
 * 标签的三项里层优先；不可用与只读只要有一层是 true 就是 true（不可用的表单里没有可用的分组）
 */
export function provideFieldLayout(read: () => FieldLayout): void {
  const outer = FieldLayoutContext.inject(null);
  FieldLayoutContext.provide({
    get labelPlacement() {
      return read().labelPlacement ?? outer?.labelPlacement;
    },
    get labelWidth() {
      return read().labelWidth ?? outer?.labelWidth;
    },
    get labelAlign() {
      return read().labelAlign ?? outer?.labelAlign;
    },
    get disabled() {
      return Boolean(read().disabled || outer?.disabled);
    },
    get readonly() {
      return Boolean(read().readonly || outer?.readonly);
    },
  });
}

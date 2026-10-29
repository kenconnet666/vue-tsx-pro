/**
 * Web 标签与小程序模板的对应：组件照常写 div / span / button，渲染器按这张表选模板，
 * 补上浏览器默认的显示方式（小程序的 view 都是块级）。
 */

/**
 * 模板类型（数据里的 t 字段，也是模板名的一段）：v 是 view，x 是文本，n 是不渲染的注释；
 * lock 是 catch 掉 touchmove 的 view（遮罩，挡住页面滚动），touch 是收 touchmove 的 view（手势：滑动、拖动）。
 * 后两种按元素上的 data-scroll-lock、data-touch-move 选，普通 view 不绑 touchmove，滚动时不往逻辑层发事件
 */
export type TemplateType = 'v' | 'x' | 'n' | 'svg' | 'image' | 'input' | 'lock' | 'touch';

/** 标签 → 模板类型；没列出的都是 view */
const TEMPLATES: Readonly<Record<string, TemplateType>> = {
  '#text': 'x',
  '#comment': 'n',
  svg: 'svg',
  img: 'image',
  input: 'input',
};

export const templateOf = (tag: string): TemplateType => TEMPLATES[tag] ?? 'v';

/** 浏览器里默认行内的标签：映射成 view 后挂 vtp-inline */
const INLINE = new Set([
  'a',
  'abbr',
  'b',
  'code',
  'em',
  'i',
  'kbd',
  'label',
  'mark',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
]);
/** 浏览器里默认行内块的标签 */
const INLINE_BLOCK = new Set(['button', 'select', 'textarea']);

/** 标签的默认显示方式对应的基础类（app 样式表里定义，见 build/styles.ts） */
export function baseClassOf(tag: string): string {
  if (INLINE.has(tag)) return 'vtp-inline';
  if (INLINE_BLOCK.has(tag)) return 'vtp-inline-block';
  return '';
}

/** 浏览器里禁用后不派发 click 的表单控件 */
export const FORM_CONTROLS = new Set(['button', 'input', 'select', 'textarea', 'fieldset']);

/** HTML 的布尔属性：值为 false 时等于没有这个属性（同 Vue 的 includeBooleanAttr） */
export const BOOLEAN_ATTRS = new Set([
  'checked',
  'disabled',
  'hidden',
  'multiple',
  'open',
  'readonly',
  'required',
  'selected',
]);

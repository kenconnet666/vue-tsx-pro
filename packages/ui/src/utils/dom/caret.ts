/**
 * 文本框里某个字符位置在视口中的坐标：@ 提及、斜杠命令这类跟着光标弹出的列表用它定位。
 *
 *   const anchor = caretAnchor(textarea, () => textarea.selectionStart);
 *   anchorFloating(anchor, panel, { placement: 'bottom-start' });
 *
 * 做法同 textarea-caret-position（component/textarea-caret）：在页面外放一个镜像 div，复制影响排版的样式，
 * 写入位置之前的文字和一个标记 span，量标记的位置，再减去文本框的滚动。input 不换行，textarea 按 pre-wrap 换行。
 */
import type { VirtualElement } from '@floating-ui/dom';

/** 影响文字排版的样式：镜像 div 照抄 */
const MIRRORED = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'fontFeatureSettings',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
] as const;

/** 文本框里第 index 个字符之前（光标在那里时）的位置：视口坐标，宽 0、高一行 */
export function caretRect(element: HTMLTextAreaElement | HTMLInputElement, index: number): DOMRect {
  const style = getComputedStyle(element);
  const mirror = document.createElement('div');
  for (const property of MIRRORED) mirror.style[property] = style[property];
  Object.assign(mirror.style, {
    position: 'absolute',
    visibility: 'hidden',
    top: '0',
    left: '-9999px',
    overflow: 'hidden',
    whiteSpace: element instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre',
    overflowWrap: 'break-word',
  });
  mirror.textContent = element.value.slice(0, index);
  const marker = document.createElement('span');
  // 标记里放后面的文字（至少一个字符）：行末的光标按下一个字的位置换行
  marker.textContent = element.value.slice(index) || '.';
  mirror.append(marker);
  document.body.append(mirror);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
  const top = marker.offsetTop + parseFloat(style.borderTopWidth) - element.scrollTop;
  const left = marker.offsetLeft + parseFloat(style.borderLeftWidth) - element.scrollLeft;
  mirror.remove();
  const box = element.getBoundingClientRect();
  return new DOMRect(box.left + left, box.top + top, 0, lineHeight);
}

/** 跟着光标的锚点（给 anchorFloating / useAnchoredPopover）：每次定位时按 index() 重新测量，文本框滚动时跟着更新 */
export function caretAnchor(
  element: HTMLTextAreaElement | HTMLInputElement,
  index: () => number,
): VirtualElement {
  return { getBoundingClientRect: () => caretRect(element, index()), contextElement: element };
}

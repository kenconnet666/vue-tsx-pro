/**
 * 小程序没有 SVG 元素：svg 子树序列化成 data URI 当遮罩（mask-image），底色取 currentColor，
 * 图标、加载指示照样跟着文字颜色走；尺寸、动画仍由组合类展开的行内样式给。
 * 遮罩只看不透明度，描边、填充里的 currentColor 换成黑色即可。
 */
import type { MiniNode } from './node.ts';

/** svg 节点的行内样式：遮罩加底色，排在组合类展开的样式前面（尺寸、动画由后者给） */
export function svgMaskStyle(svg: MiniNode): string {
  const uri = `url("data:image/svg+xml,${encode(markup(svg, true))}")`;
  return [
    'display:inline-block',
    'background-color:currentColor',
    `-webkit-mask:${uri} center/100% 100% no-repeat`,
    `mask:${uri} center/100% 100% no-repeat`,
  ].join(';');
}

function markup(node: MiniNode, root: boolean): string {
  if (node.tag === '#text') return escapeText(node.text);
  if (node.tag === '#comment') return '';
  const attrs = root ? [' xmlns="http://www.w3.org/2000/svg"'] : [];
  for (const name of node.attrs.keys()) {
    if (name === 'innerHTML' || name === 'class' || name === 'style' || name.startsWith('aria-'))
      continue;
    const value = node.attribute(name);
    if (value === undefined || value === 'false') continue;
    const text = value === 'currentColor' ? '#000' : value;
    attrs.push(` ${svgName(name)}="${escapeAttribute(text)}"`);
  }
  // 描边宽度在网页里由样式（stroke-width 变量）给，遮罩图片读不到页面的变量：没写属性时按图标的默认 2
  if (root && !node.attrs.has('stroke-width') && !node.attrs.has('strokeWidth'))
    attrs.push(' stroke-width="2"');
  // 图标组件把路径整段放在 innerHTML 里（ui 的 Icon），原样拼进去
  const inner = node.attrs.get('innerHTML');
  const children =
    typeof inner === 'string' ? inner : node.children.map((child) => markup(child, false)).join('');
  return `<${node.tag}${attrs.join('')}>${children}</${node.tag}>`;
}

/** 属性名：camelCase 转连字符，SVG 自己区分大小写的（viewBox）保留 */
const svgName = (name: string) =>
  name === 'viewBox' ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const escapeAttribute = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const escapeText = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

/** data URI 里只转义必须转义的字符，比 encodeURIComponent 短，可读 */
const encode = (svg: string) =>
  svg.replace(/["%#<>{}]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

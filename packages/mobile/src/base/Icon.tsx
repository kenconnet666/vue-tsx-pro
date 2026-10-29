/**
 * 图标：渲染 Lucide 格式的图标数据，按名导入可摇树：
 *
 *   <Icon icon={Search} />                  装饰性：对读屏隐藏
 *   <Icon icon={Trash2} aria-label="删除" /> 有名称：role="img"
 *
 * 大小默认 1em、颜色跟随文字（currentColor）。小程序里由渲染运行时画成遮罩，大小、颜色同样跟随。
 * 自定义图标按同一格式写 `{ size?, node: [[标签, 属性, 子节点?], …] }`。
 */
import type { LucideIconData } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 图标数据：Lucide 的标准格式 */
export type IconData = LucideIconData;

/** 绘制与无障碍相关的属性由组件管理 */
export type IconManaged =
  | 'viewBox'
  | 'fill'
  | 'stroke'
  | 'stroke-width'
  | 'stroke-linecap'
  | 'stroke-linejoin'
  | 'role'
  | 'aria-hidden';

/** 未声明的属性落到 svg 上；传了 aria-label 才对读屏可见 */
export interface IconProps extends PartProps<'svg', IconManaged> {
  /** 图标数据：`import { Search } from '@lucide/icons'` */
  icon: IconData;
  /** 大小（px）；不写时为 1em，跟随所在文字 */
  size?: number;
  /**
   * 线宽（24 格画布上的单位）
   * @default 2
   */
  strokeWidth?: number;
  /** 实心：轮廓里也填上文字颜色（评分的星、选中的心） */
  filled?: boolean;
}

/** Icon 的样式：icon */
export const iconStyles = css.create({
  icon: {
    width: '1em',
    height: '1em',
    flexShrink: 0,
    // 与文字基线对齐
    verticalAlign: '-0.125em',
  },
});

/** 图标（svg）：不传 aria-label 时是装饰性的 */
export const Icon = _component(
  ({ icon, size, strokeWidth = 2, filled = false, ...rest }: IconProps) =>
    () => {
      const labelled = rest['aria-label'] != null;
      return (
        <svg
          {...mergeAttrs<'svg'>({ sx: iconStyles.icon }, rest, {
            style: size == null ? undefined : { fontSize: `${size}px` },
            viewBox: viewBox(icon),
            fill: filled ? 'currentColor' : 'none',
            stroke: 'currentColor',
            // 写成属性而不是样式：小程序把 svg 画成遮罩图片，读不到页面的样式
            'stroke-width': strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            role: labelled ? 'img' : undefined,
            'aria-hidden': labelled ? undefined : 'true',
          })}
          innerHTML={iconMarkup(icon)}
        />
      );
    },
);

function viewBox(icon: IconData) {
  const width = icon.width ?? icon.size ?? 24;
  const height = icon.height ?? icon.size ?? 24;
  return `0 0 ${width} ${height}`;
}

/** Lucide 图标数据里的一个节点：[标签, 属性, 子节点] */
type IconNode = IconData['node'][number];

const markupCache = new WeakMap<IconData, string>();

/** 图标的子元素拼成的 SVG 标记，按图标数据缓存，作为 svg 的 innerHTML（不为每条路径建虚拟节点） */
export function iconMarkup(icon: IconData): string {
  let markup = markupCache.get(icon);
  if (markup === undefined) markupCache.set(icon, (markup = icon.node.map(nodeMarkup).join('')));
  return markup;
}

function nodeMarkup([tag, attrs, children]: IconNode): string {
  if (!/^[a-z][a-z0-9-]*$/i.test(tag)) throw new Error(`图标数据里的标签名不合法：${tag}`);
  // 节点里的 key 是给虚拟节点用的，不是 SVG 属性
  const attributes = Object.entries(attrs)
    .filter(([name]) => name !== 'key')
    .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
    .join('');
  return `<${tag}${attributes}>${children?.map(nodeMarkup).join('') ?? ''}</${tag}>`;
}

const escapeAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

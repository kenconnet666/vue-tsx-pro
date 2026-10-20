/**
 * 图标：渲染 Lucide 格式的图标数据。使用方安装 @lucide/icons 后按名导入（可摇树）：
 *
 *   <Icon icon={Search} />                  装饰性：对读屏隐藏
 *   <Icon icon={Trash} aria-label="删除" />  有名称：role="img"
 *
 * 自定义图标按同一格式写 `{ size?, node: [[标签, 属性, 子节点?], …] }` 即可。
 */
import type { LucideIconData } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { createDrawable, utils } from 'animejs';
import { h, onMounted, watch, type VNode } from 'vue';
import { useAnimate } from '../utils/motion/animation';
import { mergeAttrs, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

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

/** 未声明的属性落到 svg 上；传了 aria-label 或 aria-labelledby 才对读屏可见 */
export interface IconProps extends PartProps<'svg', IconManaged> {
  /** 图标数据：`import { Search } from '@lucide/icons'` */
  icon: IconData;
  /** 不写时为 1em，跟随所在文字；档位对应主题字号，数字为像素 */
  size?: TextSize | number;
  /** 线宽（24 格画布上的单位），默认取主题的 strokeWidths.md */
  strokeWidth?: number;
  /** 从右到左排版时水平翻转：箭头、chevron 这类有方向的图标 */
  flipInRtl?: boolean;
  /**
   * 描线动画（一笔画出）：挂载时为 true 就在挂载时播，之后每次由 false 变为 true 再播（Anime.js 的 createDrawable，
   * 时长取主题，减少动态效果时直接画好）。要在挂载时就给出（true / false），不给的图标不建动画
   */
  draw?: boolean;
}

/** Icon 的样式：icon、flip */
export const iconStyles = stylex.create({
  icon: {
    width: '1em',
    height: '1em',
    flexShrink: 0,
    // 与文字基线对齐
    verticalAlign: '-0.125em',
    // 写成 CSS 而不是 stroke-width 属性：主题能统一调整，子元素照常继承
    strokeWidth: '_md',
  },
  flip: { transform: { default: null, ':dir(rtl)': 'scaleX(-1)' } },
});

/** 图标（svg）：渲染 Lucide 格式的图标数据；不传 aria-label 时是装饰性的，对读屏隐藏 */
export const Icon = _component(
  ({ icon, size, strokeWidth, flipInRtl = false, draw, ...rest }: IconProps) => {
    let svg = _state.raw<SVGSVGElement | null>(null);
    // 大多数图标不描线：不给 draw 时不建监听与动画
    if (_untrack(draw) !== undefined)
      useDraw(
        () => svg,
        () => draw === true,
      );
    return () => {
      const labelled = rest['aria-label'] != null || rest['aria-labelledby'] != null;
      return (
        <svg
          {...mergeAttrs<'svg'>(
            {
              sx: [
                iconStyles.icon,
                typeof size === 'string' && fontSizeStyles[size],
                flipInRtl && iconStyles.flip,
              ],
            },
            rest,
            {
              style: {
                fontSize: typeof size === 'number' ? `${size}px` : undefined,
                strokeWidth,
              },
              viewBox: viewBox(icon),
              fill: 'none',
              stroke: 'currentColor',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              role: labelled ? 'img' : undefined,
              'aria-hidden': labelled ? undefined : 'true',
              ref: _toRef(svg),
            },
          )}
        >
          {icon.node.map(renderIconNode)}
        </svg>
      );
    };
  },
);

/** 描线：draw 变为 true（含挂载时）就从无到有画出每一笔 */
function useDraw(element: () => SVGSVGElement | null, draw: () => boolean) {
  const animate = useAnimate();
  const play = () => {
    const svg = element();
    if (!svg || !draw()) return;
    const strokes = createDrawable([...svg.children] as SVGGeometryElement[]);
    // 先擦掉再画：挂载时在浏览器绘制前就擦掉，不会先闪一下完整的图标
    void utils.set(strokes, { draw: '0 0' });
    void animate(strokes, { draw: '0 1' }, { duration: 'xl', ease: 'enter', scope: svg });
  };
  onMounted(play);
  watch(draw, play, { flush: 'post' });
}

/** Lucide 图标默认画在 24×24 的画布上；自定义图标可以给出自己的 size 或 width / height */
function viewBox(icon: IconData) {
  const width = icon.width ?? icon.size ?? 24;
  const height = icon.height ?? icon.size ?? 24;
  return `0 0 ${width} ${height}`;
}

/** Lucide 图标数据里的一个节点：[标签, 属性, 子节点] */
export type IconNode = IconData['node'][number];

/** 标签名来自数据（path、circle…），TSX 里没有对应的属性类型，用 h() 渲染；节点里的 key 正好作为 vnode 的 key */
export function renderIconNode([tag, attrs, children]: IconNode): VNode {
  return h(tag, attrs, children?.map(renderIconNode));
}

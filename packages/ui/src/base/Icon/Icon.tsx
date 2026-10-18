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
import { h, type VNode } from 'vue';
import { controls, fontSizes } from '../../config/theme/tokens.stylex';
import { elementProps, mergeProps, type PartProps } from '../../utils/props';
import type { Size } from '../../utils/styles';

/** 图标数据：Lucide 的标准格式 */
export type IconData = LucideIconData;

/** 绘制与无障碍相关的属性由组件管理 */
type Managed =
  | 'viewBox'
  | 'fill'
  | 'stroke'
  | 'stroke-width'
  | 'stroke-linecap'
  | 'stroke-linejoin'
  | 'role'
  | 'aria-hidden';

/** 未声明的属性落到 svg 上；传了 aria-label 或 aria-labelledby 才对读屏可见 */
export interface IconProps extends PartProps<'svg', Managed> {
  /** 图标数据：`import { Search } from '@lucide/icons'` */
  icon: IconData;
  /** 不写时为 1em，跟随所在文字；档位对应主题字号，数字为像素 */
  size?: Size | number;
  /** 线宽（24 格画布上的单位），默认取主题的 controls.iconStrokeWidth */
  strokeWidth?: number;
  /** 从右到左排版时水平翻转：箭头、chevron 这类有方向的图标 */
  flipInRtl?: boolean;
}

const styles = stylex.create({
  icon: {
    width: '1em',
    height: '1em',
    flexShrink: 0,
    // 与文字基线对齐
    verticalAlign: '-0.125em',
    // 写成 CSS 而不是 stroke-width 属性：主题能统一调整，子元素照常继承
    strokeWidth: controls.iconStrokeWidth,
  },
  flip: { transform: { default: null, ':dir(rtl)': 'scaleX(-1)' } },
  xs: { fontSize: fontSizes.xs },
  sm: { fontSize: fontSizes.sm },
  md: { fontSize: fontSizes.md },
  lg: { fontSize: fontSizes.lg },
  xl: { fontSize: fontSizes.xl },
});

export const Icon = _component(
  ({ icon, size, strokeWidth, flipInRtl = false, ...rest }: IconProps) =>
    () => {
      const labelled = rest['aria-label'] != null || rest['aria-labelledby'] != null;
      return (
        <svg
          {...elementProps(
            mergeProps<'svg'>(
              {
                sx: [
                  styles.icon,
                  typeof size === 'string' && styles[size],
                  flipInRtl && styles.flip,
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
              },
            ),
          )}
        >
          {icon.node.map(renderNode)}
        </svg>
      );
    },
);

/** Lucide 图标默认画在 24×24 的画布上；自定义图标可以给出自己的 size 或 width / height */
function viewBox(icon: IconData) {
  const width = icon.width ?? icon.size ?? 24;
  const height = icon.height ?? icon.size ?? 24;
  return `0 0 ${width} ${height}`;
}

type IconNode = IconData['node'][number];

/** 标签名来自数据（path、circle…），TSX 里没有对应的属性类型，用 h() 渲染；节点里的 key 正好作为 vnode 的 key */
function renderNode([tag, attrs, children]: IconNode): VNode {
  return h(tag, attrs, children?.map(renderNode));
}

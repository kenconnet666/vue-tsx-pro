/**
 * 间距：一组元素横排或竖排，之间留同样的空；横排时可换行。
 *
 *   <Space><Button>甲</Button><Button>乙</Button></Space>
 *   <Space direction="vertical" gap="lg" fill>…</Space>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 排列方向 */
export interface SpaceDirections {
  /** 横排（默认换行） */
  horizontal: unknown;
  /** 竖排 */
  vertical: unknown;
}

/** 交叉轴上的对齐 */
export interface SpaceAligns {
  /** 起始边 */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 结束边 */
  end: unknown;
  /** 文字基线 */
  baseline: unknown;
  /** 拉伸 */
  stretch: unknown;
}

/** 未声明的属性落到根元素（div）上 */
export interface SpaceProps extends PartProps<'div'> {
  /**
   * 方向
   * @default 'horizontal'
   */
  direction?: keyof SpaceDirections;
  /**
   * 间距档位（随字号缩放）
   * @default 'sm'
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 交叉轴上的对齐；横排默认居中 */
  align?: keyof SpaceAligns;
  /**
   * 横排时放不下就换行
   * @default true
   */
  wrap?: boolean;
  /** 占满容器宽度（竖排时子元素也撑满） */
  fill?: boolean;
  /** 内容 */
  children?: VNodeChild;
}

/** Space 的样式：root、vertical、wrap、fill、各间距与对齐 */
export const spaceStyles = css.create({
  root: { display: 'inline-flex', alignItems: 'center' },
  vertical: { flexDirection: 'column', alignItems: 'stretch' },
  wrap: { flexWrap: 'wrap' },
  fill: { display: 'flex', width: '100%' },
  xs: { gap: '_xs' },
  sm: { gap: '_sm' },
  md: { gap: '_md' },
  lg: { gap: '_lg' },
  xl: { gap: '_xl' },
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  baseline: { alignItems: 'baseline' },
  stretch: { alignItems: 'stretch' },
});

/** 间距（div，弹性布局） */
export const Space = _component(
  ({
    direction = 'horizontal',
    gap = 'sm',
    align,
    wrap = true,
    fill = false,
    children,
    ...rest
  }: SpaceProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              spaceStyles.root,
              spaceStyles[gap],
              direction === 'vertical' && spaceStyles.vertical,
              direction === 'horizontal' && wrap && spaceStyles.wrap,
              fill && spaceStyles.fill,
              align && spaceStyles[align],
            ],
          },
          rest,
        )}
      >
        {children}
      </div>
    ),
);

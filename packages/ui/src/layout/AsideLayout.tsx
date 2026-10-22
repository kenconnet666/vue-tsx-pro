/**
 * 主栏 + 侧栏：详情页常用的两栏，主栏放长内容（概览、明细、流程），侧栏放要一直看得见的（金额、状态、清单）。
 * 宽的时候侧栏定宽、粘在顶栏下面（AppShell 的 stickyOffset），滚动主栏时它不动；窄了（容器不到 56rem）叠成一列，侧栏在后。
 *
 *   <AsideLayout aside={<><BenefitCard /><ClosingCard /></>} asideLabel="收益与关闭">
 *     <OverviewCard />
 *     <PartsCard />
 *   </AsideLayout>
 *
 * 按容器宽度而不是窗口宽度决定叠不叠：放在抽屉、分栏里也对。两栏里的块按 gap 竖排。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import { gapStyles, type Space } from '../utils/style/styles';
import { space } from '../config/theme/tokens.stylex';
import { layoutVars } from '../utils/style/vars.stylex';

/** 未声明的属性落到外层 div 上 */
export interface AsideLayoutProps extends PartProps<'div'> {
  /** 侧栏的内容 */
  aside: VNodeChild;
  /** 侧栏的名称（aside 的 aria-label） */
  asideLabel?: string;
  /**
   * 侧栏的宽度（CSS 长度）
   * @default '26rem'
   */
  asideWidth?: string;
  /**
   * 侧栏粘在顶栏下面
   * @default true
   */
  sticky?: boolean;
  /**
   * 两栏之间、栏里各块之间的间距
   * @default 'md'
   */
  gap?: Space;
  /** 主栏（div）的部件属性 */
  propsMain?: PartProps<'div'>;
  /** 侧栏（aside）的部件属性 */
  propsAside?: PartProps<'aside'>;
  /** 主栏的内容 */
  children?: VNodeChild;
}

/** AsideLayout 的样式：root、grid、column、sticky */
export const asideLayoutStyles = stylex.create({
  // 容器查询的容器：按自己的宽度决定叠不叠
  root: { containerType: 'inline-size', minWidth: 0 },
  grid: { display: 'grid', alignItems: 'start' },
  column: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  sticky: {
    position: { default: null, '@container (min-width: 56rem)': 'sticky' },
    top: `calc(${layoutVars.stickyOffset} + ${space.md})`,
  },
});

/** AsideLayout 的动态样式：侧栏的宽度 */
export const asideLayoutDynamicStyles = stylex.create({
  columns: (asideWidth: string) => ({
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@container (min-width: 56rem)': `minmax(0, 1fr) ${asideWidth}`,
    },
  }),
});

/** 主栏 + 侧栏 */
export const AsideLayout = _component(
  ({
    aside,
    asideLabel,
    asideWidth = '26rem',
    sticky = true,
    gap = 'md',
    propsMain,
    propsAside,
    children,
    ...rest
  }: AsideLayoutProps) =>
    () => (
      <div {...mergeAttrs<'div'>({ sx: asideLayoutStyles.root }, rest)}>
        <div
          {...stylex.attrs(
            asideLayoutStyles.grid,
            gapStyles[gap],
            asideLayoutDynamicStyles.columns(asideWidth),
          )}
        >
          <div
            {...mergeAttrs<'div'>({ sx: [asideLayoutStyles.column, gapStyles[gap]] }, propsMain)}
          >
            {children}
          </div>
          <aside
            {...mergeAttrs<'aside'>(
              {
                sx: [asideLayoutStyles.column, gapStyles[gap], sticky && asideLayoutStyles.sticky],
              },
              propsAside,
              { 'aria-label': asideLabel },
            )}
          >
            {aside}
          </aside>
        </div>
      </div>
    ),
);

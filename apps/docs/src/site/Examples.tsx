/**
 * 一组示例，分左右两列：每页在代码里写定哪些示例在左列、哪些在右列（ExampleColumn），不按高度自动分。
 * 宽度放得下两列（每列至少 26rem）时并排，否则左列在上、右列在下；阅读、Tab 与本页目录的顺序都是先左列后右列。
 *
 *   <Examples>
 *     <ExampleColumn>
 *       <Example id="basic" title="基础用法" demo={Basic} />
 *       <Example id="sizes" title="尺寸" demo={Sizes} />
 *     </ExampleColumn>
 *     <ExampleColumn>
 *       <Example id="variants" title="样式" demo={Variants} />
 *     </ExampleColumn>
 *   </Examples>
 *
 * 宽的示例（流程图、看板）放进 <ExampleColumn wide>：占满整行，排在它前后的两列之间。
 *
 * 写死而不自动平衡：首屏之外的示例推迟渲染（见 Example），高度要等渲染完才知道，按高度平衡会让已经看到的示例换列。
 * 两列各自往下排，不按行对齐：展开代码、示例自己变高，只把同一列下面的示例往下推。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { ExampleColumnContext } from './Example';

/** 列间距与上下两个示例的间距 */
const COLUMN_GAP = '2rem';
const ROW_GAP = '3rem';

const styles = css.create({
  root: { containerType: 'inline-size' },
  grid: {
    display: 'grid',
    alignItems: 'start',
    columnGap: COLUMN_GAP,
    rowGap: ROW_GAP,
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      // 两列各至少 26rem，加上列间距
      '@container (min-width: 54rem)': 'repeat(2, minmax(0, 1fr))',
    },
  },
  column: { display: 'flex', flexDirection: 'column', gap: ROW_GAP, minWidth: 0 },
  wide: { gridColumn: '1 / -1' },
});

/** 一组示例：两个 ExampleColumn，宽屏时并排 */
export const Examples = _component(({ children }: { children?: VNodeChild }) => () => (
  <div {...css.attrs(styles.root)}>
    <div {...css.attrs(styles.grid)}>{children}</div>
  </div>
));

/** 一列示例：列里的序号交给 Example（每列前几个立即渲染，其余推迟）；wide 时占满整行 */
export const ExampleColumn = _component(
  ({ wide = false, children }: { wide?: boolean; children?: VNodeChild }) => {
    let count = 0;
    ExampleColumnContext.provide({ next: () => count++ });
    return () => <div {...css.attrs(styles.column, wide && styles.wide)}>{children}</div>;
  },
);

/**
 * 一组示例：宽屏时两列，窄屏时一列（每列至少 26rem，放得下两列才分两列）。
 *
 *   <Examples>
 *     <Example id="basic" title="基础用法" demo={Basic} />
 *     <Example id="variants" title="样式" demo={Variants} />
 *   </Examples>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Grid } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

const styles = stylex.create({
  // 上下两行示例之间比左右两列之间留得更开：一眼看出哪段说明属于哪张卡片
  grid: { rowGap: '3rem' },
});

/** 一组示例：按宽度自动分成一列或两列 */
export const Examples = _component(({ children }: { children?: VNodeChild }) => () => (
  // 各示例高度不同：顶端对齐，不拉伸
  <Grid minItemWidth="26rem" gap="xl" align="start" sx={styles.grid}>
    {children}
  </Grid>
));

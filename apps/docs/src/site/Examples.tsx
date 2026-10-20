/**
 * 一组示例：宽屏时两列，窄屏时一列（每列至少 26rem，放得下两列才分两列）。
 * 两列各自往下排（CSS 多列），不按行对齐：高矮不一的示例不会在矮的旁边留下大片空白。
 *
 *   <Examples>
 *     <Example id="basic" title="基础用法" demo={Basic} />
 *     <Example id="variants" title="样式" demo={Variants} />
 *   </Examples>
 */
import { _component, createContext } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';

const styles = stylex.create({
  columns: { columnWidth: '26rem', columnGap: '2rem' },
});

/** Examples 里的 Example 据此不跨列断开、彼此留出间距 */
export const ExamplesContext = createContext<{ readonly columns: true }>('Examples');

/** 一组示例：按宽度自动分成一列或两列 */
export const Examples = _component(({ children }: { children?: VNodeChild }) => {
  ExamplesContext.provide({ columns: true });
  return () => <div {...stylex.attrs(styles.columns)}>{children}</div>;
});

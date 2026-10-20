/**
 * 一组示例：宽屏时两列，窄屏时一列（每列至少 26rem，放得下两列才分两列）。
 * 两列各自往下排，不按行对齐：高矮不一的示例不会在矮的旁边留下大片空白。
 *
 *   <Examples>
 *     <Example id="basic" title="基础用法" demo={Basic} />
 *     <Example id="variants" title="样式" demo={Variants} />
 *   </Examples>
 *
 * 和 CSS 多列一样，前一段示例在左列、后一段在右列（阅读、Tab 与本页目录的顺序都是示例的顺序），
 * 分界点按量出的高度选在两列最接近的地方。分界只在排版时定一次：之后展开代码、示例自己变高，
 * 只把同一列下面的示例往下推，另一列不动（CSS 多列会把所有示例重新分配）。窗口变宽变窄、列数变了时才重新分。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useResizeObserver } from '@vue-tsx-pro/ui';
import { onMounted, onUpdated, type VNode, type VNodeChild } from 'vue';

/** 一列的最小宽度与列间距（rem） */
const COLUMN_WIDTH = 26;
const COLUMN_GAP = 2;

const styles = stylex.create({
  root: { display: 'flex', alignItems: 'flex-start', gap: `${COLUMN_GAP}rem` },
  column: { display: 'flex', flexDirection: 'column', gap: '3rem', flex: '1 1 0', minWidth: 0 },
});

/** 子节点摊平成一个个示例（JSX 的数组、Fragment 里的都算） */
function items(children: VNodeChild): VNode[] {
  if (Array.isArray(children)) return children.flatMap((child) => items(child as VNodeChild));
  return children != null && typeof children === 'object' ? [children as VNode] : [];
}

/** 一组示例：按宽度分成一列或两列，示例所在的列排好后固定 */
export const Examples = _component(({ children }: { children?: VNodeChild }) => {
  let root = _state.raw<HTMLElement | null>(null);
  let columns = _state(1);
  // 右列从第几个示例开始；null 表示还没量过，先按个数对半分
  let split = _state.raw<number | null>(null);

  function fit(width: number) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const next = width >= (COLUMN_WIDTH * 2 + COLUMN_GAP) * rem ? 2 : 1;
    if (next === columns) return;
    columns = next;
    split = null;
  }
  useResizeObserver(
    () => root,
    ([entry]) => fit(entry?.contentRect.width ?? 0),
  );

  /** 量出各示例的高度，找两列高度最接近的分界点 */
  function place() {
    if (split != null || columns === 1 || !root) return;
    const heights = [...root.querySelectorAll<HTMLElement>('[data-example]')]
      .sort((a, b) => Number(a.dataset.example) - Number(b.dataset.example))
      .map((element) => element.offsetHeight);
    const total = heights.reduce((sum, height) => sum + height, 0);
    let best = 0;
    let bestTaller = Infinity;
    let left = 0;
    for (let index = 0; index <= heights.length; index++) {
      const taller = Math.max(left, total - left);
      if (taller < bestTaller) [best, bestTaller] = [index, taller];
      left += heights[index] ?? 0;
    }
    split = best;
  }
  // 挂载时（浏览器绘制之前）就定下列数并分好列：第一帧就是最终布局，不先闪一列，锚点也不会被挤走
  onMounted(() => {
    if (root) fit(root.clientWidth);
    place();
  });
  onUpdated(place);

  return () => {
    const list = items(children);
    const boundary = split ?? Math.ceil(list.length / 2);
    const columnOf = (index: number) => (columns === 1 || index < boundary ? 0 : 1);
    return (
      <div ref={_toRef(root)} {...stylex.attrs(styles.root)}>
        {Array.from({ length: columns }, (_, column) => (
          <div key={column} {...stylex.attrs(styles.column)}>
            {list.map((item, index) =>
              columnOf(index) === column ? (
                <div key={index} data-example={index}>
                  {item}
                </div>
              ) : null,
            )}
          </div>
        ))}
      </div>
    );
  };
});

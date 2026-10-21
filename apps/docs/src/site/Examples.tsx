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
 * 分界点按量出的高度选在两列最接近的地方。用户动手之后分界就固定：展开代码、示例自己变高，
 * 只把同一列下面的示例往下推，另一列不动（CSS 多列会把所有示例重新分配）；窗口变宽变窄、列数变了时才重新分。
 * 动手之前（示例还在加载字体、图标、高亮而长高）高度变了会重新分。
 *
 * 排法：所有示例在同一个竖排、可换列的 flex 容器里，分界处放一个占满整列高度的空元素，后面的示例就换到第二列；
 * 容器的高度取两列中高的那列。重新分界只改这个空元素的 order，示例本身的 DOM 不动：
 * 原来两列各是一个容器，示例换列要卸载重建（演示、源码都重新渲染，状态也丢了）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useResizeObserver } from '@vue-tsx-pro/ui';
import { onBeforeUnmount, onMounted, onUpdated, type VNode, type VNodeChild } from 'vue';

/** 一列的最小宽度、列间距与上下两个示例的间距（rem） */
const COLUMN_WIDTH = 26;
const COLUMN_GAP = 2;
const ROW_GAP = 3;

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', rowGap: `${ROW_GAP}rem` },
  // 两列：竖排、可换列，高度由脚本给
  twoColumns: { flexWrap: 'wrap', alignContent: 'flex-start' },
  item: { minWidth: 0 },
  half: { width: `calc((100% - ${COLUMN_GAP}rem) / 2)` },
  // 第二列与第一列之间的间距（换列的空元素宽度为 0，不用 column-gap，免得多出一道）
  second: { marginInlineStart: `${COLUMN_GAP}rem` },
  // 占满整列高度：放在它后面的示例换到下一列
  columnBreak: { flexBasis: '100%', width: 0 },
  height: (height: string) => ({ height }),
  order: (order: number) => ({ order }),
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
  // 各示例的高度（px），由 ResizeObserver 更新：排列时不用再读 offsetHeight 强制布局
  let heights = _state.raw<number[]>([]);

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

  const examples = () =>
    root ? [...root.querySelectorAll<HTMLElement>(':scope > [data-example]')] : [];

  /** 两列高度最接近的分界点 */
  function bestSplit(sizes: number[]) {
    const total = sizes.reduce((sum, height) => sum + height, 0);
    let best = 0;
    let bestTaller = Infinity;
    let left = 0;
    for (let index = 0; index <= sizes.length; index++) {
      const taller = Math.max(left, total - left);
      if (taller < bestTaller) [best, bestTaller] = [index, taller];
      left += sizes[index] ?? 0;
    }
    return best;
  }

  // 挂载后示例还会长高（字体、图标、异步高亮）：用户动手之前（第一次按下指针或按键，最多 3 秒），
  // 高度变了就重新分列；动手之后分界固定，展开代码只推同一列下面的示例。高度一直跟着更新（容器高度要用）
  let settled = false;
  const settle = () => {
    settled = true;
    document.removeEventListener('pointerdown', settle, true);
    document.removeEventListener('keydown', settle, true);
  };
  const sizes = new ResizeObserver((entries) => {
    const next = [...heights];
    for (const entry of entries) {
      const index = Number((entry.target as HTMLElement).dataset.example);
      next[index] = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;
    }
    heights = next;
    if (!settled && columns === 2) split = bestSplit(next);
  });
  const observeExamples = () => {
    for (const element of examples()) sizes.observe(element);
  };

  // 挂载时（浏览器绘制之前）就定下列数并分好列：第一帧就是最终布局，不先闪一列，锚点也不会被挤走
  onMounted(() => {
    if (root) fit(root.clientWidth);
    heights = examples().map((element) => element.offsetHeight);
    if (columns === 2) split = bestSplit(heights);
    observeExamples();
    document.addEventListener('pointerdown', settle, true);
    document.addEventListener('keydown', settle, true);
    setTimeout(settle, 3000);
  });
  onUpdated(() => {
    if (columns === 2 && split == null) split = bestSplit(heights);
    observeExamples();
  });
  onBeforeUnmount(() => {
    settle();
    sizes.disconnect();
  });

  return () => {
    const list = items(children);
    const two = columns === 2;
    const boundary = split ?? Math.ceil(list.length / 2);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const columnHeight = (from: number, to: number) => {
      const own = heights.slice(from, to);
      return (
        own.reduce((sum, height) => sum + height, 0) + Math.max(own.length - 1, 0) * ROW_GAP * rem
      );
    };
    // 多留 1px：小数像素的舍入不让最后一个示例被挤到第三列
    const height =
      Math.ceil(Math.max(columnHeight(0, boundary), columnHeight(boundary, list.length))) + 1;
    return (
      <div
        ref={_toRef(root)}
        {...stylex.attrs(
          styles.root,
          two && styles.twoColumns,
          two && styles.height(`${height}px`),
        )}
      >
        {list.map((item, index) => (
          <div
            key={index}
            data-example={index}
            {...stylex.attrs(
              styles.item,
              two && styles.half,
              two && index >= boundary && styles.second,
              styles.order(index * 2),
            )}
          >
            {item}
          </div>
        ))}
        {two && (
          <div
            key="break"
            aria-hidden="true"
            {...stylex.attrs(styles.columnBreak, styles.order(boundary * 2 - 1))}
          />
        )}
      </div>
    );
  };
});

/**
 * 图表的导出：绘图区的 SVG 存成 PNG 图片，读屏的数据表存成 CSV。ChartFrame 的导出菜单用它，也可以自己调。
 *
 *   await exportChartImage(svg, '月度销售');          // 下载“月度销售.png”
 *   exportChartData(table, format, '月度销售');       // 下载“月度销售.csv”
 *
 * 图片：复制一份 SVG，把每个元素算出来的样式（颜色、线宽、字体，主题的 CSS 变量已经解析）写到它自己身上，
 * 画进两倍大小的 canvas，底色取图表外层的背景色。叠在 SVG 上面的 HTML（提示框）不在图里。
 */
import type { useFormat } from '../config/lang/format';
import { downloadFile } from '../utils/dom/download';
import { backgroundOf, rasterizeSvg } from '../utils/dom/rasterize';
import { tableToCsv } from '../table/csv';
import type { ChartTable } from './frame';

/** 写回到复制品上的样式：画图要用到的这些 */
const INLINED = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'visibility',
  'display',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
  'paint-order',
] as const;

/** SVG → 带内联样式的 SVG 文字（宽高写成像素） */
export function serializeChartSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const sources = [svg, ...svg.querySelectorAll('*')];
  const targets = [clone, ...clone.querySelectorAll('*')];
  sources.forEach((source, index) => {
    const target = targets[index] as SVGElement | undefined;
    if (!target?.style) return;
    const style = getComputedStyle(source);
    for (const property of INLINED)
      target.style.setProperty(property, style.getPropertyValue(property));
  });
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clone);
}

/** 绘图区的 SVG 存成 PNG（两倍分辨率）；background 是底色，默认取 SVG 外层元素的背景色 */
export async function exportChartImage(
  svg: SVGSVGElement,
  name: string,
  background?: string,
): Promise<void> {
  const { width, height } = svg.getBoundingClientRect();
  const blob = await rasterizeSvg(
    serializeChartSvg(svg),
    { width, height },
    {
      background: background ?? backgroundOf(svg),
    },
  );
  downloadFile(`${name}.png`, blob, 'image/png');
}

/** 图表的数据表存成 CSV（表头一行，每行第一格是类目），开头带 BOM */
export function exportChartData(
  table: ChartTable,
  format: ReturnType<typeof useFormat>,
  name: string,
): void {
  const rows = table.rows.map((row) => [row.header, ...row.cells]);
  const columns = table.columns.map((header, index) => ({
    key: String(index),
    header,
    type: 'text' as const,
    value: (row: string[]) => row[index] ?? '',
  }));
  downloadFile(`${name}.csv`, tableToCsv(rows, columns, format), 'text/csv;charset=utf-8');
}

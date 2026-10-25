/**
 * SVG 文字画成 PNG：图表、画布的“导出图片”共用。按 scale 倍的分辨率画进 canvas，先铺底色（SVG 本身多半是透明的）。
 *
 *   const blob = await rasterizeSvg(svgText, { width: 640, height: 360 }, { background: backgroundOf(element) });
 *   downloadFile('流程图.png', blob, 'image/png');
 *
 * SVG 里引用的外部资源（图片、网页字体）不会被画出来：浏览器把 SVG 当成图片时不加载它们，导出前要内联或接受回退字体。
 */

/** 画成 PNG：size 是 SVG 的显示大小（px），scale 默认 2，background 不写时透明 */
export async function rasterizeSvg(
  svg: string,
  size: { width: number; height: number },
  { scale = 2, background }: { scale?: number; background?: string } = {},
): Promise<Blob> {
  const image = new Image();
  // 用 data: 而不是 blob: 地址：Chrome 把 blob: 载入的、带 foreignObject 的 SVG 当成跨域，画过的 canvas 不能导出
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = Object.assign(document.createElement('canvas'), {
    width: Math.ceil(size.width * scale),
    height: Math.ceil(size.height * scale),
  });
  const context = canvas.getContext('2d')!;
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('rasterizeSvg: 画布没能生成 PNG（尺寸过大或 SVG 引用了跨域资源）');
  return blob;
}

/** 往外找第一个不透明的背景色（导出图片的底色）；都没有时白色 */
export function backgroundOf(element: Element): string {
  for (let current: Element | null = element; current; current = current.parentElement) {
    const color = getComputedStyle(current).backgroundColor;
    if (color && color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return '#fff';
}

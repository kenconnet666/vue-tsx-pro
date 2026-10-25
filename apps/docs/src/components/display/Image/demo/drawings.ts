/**
 * 示例用的“零件图纸”：在浏览器里画的 SVG（data URI），不依赖外部图片。网格底、零件轮廓、尺寸线与标题栏，
 * 各张颜色与形状不同；SVG 放大也清晰，正好拿来演示缩放与旋转。
 */

/** 一张图纸 */
export interface Drawing {
  /** 图号 */
  code: string;
  /** 零件名称 */
  title: string;
  /** 图片地址（data URI） */
  src: string;
}

/** 几种零件的轮廓（在 1200 × 800 的画布中间） */
const shapes: Record<string, string> = {
  bracket:
    'M360 260 h300 a40 40 0 0 1 40 40 v120 h140 a40 40 0 0 1 40 40 v80 a40 40 0 0 1 -40 40 h-480 a40 40 0 0 1 -40 -40 v-240 a40 40 0 0 1 40 -40 z M430 380 a30 30 0 1 0 0.1 0 z M770 500 a26 26 0 1 0 0.1 0 z',
  plate:
    'M330 250 h540 a20 20 0 0 1 20 20 v300 a20 20 0 0 1 -20 20 h-540 a20 20 0 0 1 -20 -20 v-300 a20 20 0 0 1 20 -20 z M400 320 a22 22 0 1 0 0.1 0 z M800 320 a22 22 0 1 0 0.1 0 z M400 500 a22 22 0 1 0 0.1 0 z M800 500 a22 22 0 1 0 0.1 0 z',
  hinge:
    'M340 330 h260 v-60 a70 70 0 0 1 140 0 v60 h120 v180 h-520 z M670 270 a28 28 0 1 0 0.1 0 z M420 420 a24 24 0 1 0 0.1 0 z M560 420 a24 24 0 1 0 0.1 0 z',
  clamp:
    'M600 230 a170 170 0 1 1 -0.1 0 z M600 300 a100 100 0 1 0 0.1 0 z M420 400 h-80 v60 h80 z M780 400 h80 v60 h-80 z',
  rib: 'M300 470 l140 -180 h320 l140 180 v60 h-600 z M480 360 h240 v80 h-240 z',
  cover:
    'M380 260 h440 a60 60 0 0 1 60 60 v220 a60 60 0 0 1 -60 60 h-440 a60 60 0 0 1 -60 -60 v-220 a60 60 0 0 1 60 -60 z M600 430 a90 90 0 1 0 0.1 0 z',
};

/** 画一张图纸 */
function svg(code: string, title: string, shape: string, hue: number): string {
  const ink = `hsl(${hue} 70% 32%)`;
  const paper = `hsl(${hue} 40% 97%)`;
  const grid = `hsl(${hue} 40% 88%)`;
  const content = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${grid}" stroke-width="1"/></pattern></defs>
<rect width="1200" height="800" fill="${paper}"/><rect width="1200" height="800" fill="url(#g)"/>
<rect x="20" y="20" width="1160" height="760" fill="none" stroke="${ink}" stroke-width="3"/>
<path d="${shapes[shape]}" fill="hsl(${hue} 60% 86%)" fill-rule="evenodd" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
<g stroke="${ink}" stroke-width="2" fill="${ink}" font-family="sans-serif" font-size="22">
<line x1="300" y1="660" x2="900" y2="660"/><line x1="300" y1="645" x2="300" y2="675"/><line x1="900" y1="645" x2="900" y2="675"/>
<text x="600" y="650" text-anchor="middle" stroke="none">600</text>
<line x1="1000" y1="230" x2="1000" y2="590"/><line x1="985" y1="230" x2="1015" y2="230"/><line x1="985" y1="590" x2="1015" y2="590"/>
<text x="1030" y="418" stroke="none">360</text>
</g>
<g font-family="sans-serif" fill="${ink}">
<rect x="820" y="690" width="340" height="70" fill="white" stroke="${ink}" stroke-width="2"/>
<text x="838" y="720" font-size="22" font-weight="bold">${title}</text>
<text x="838" y="748" font-size="18">${code} · 比例 1:2</text>
</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
}

/** 六张示例图纸 */
export const drawings: Drawing[] = [
  { code: 'DWG-1021', title: '显示器支架', shape: 'bracket', hue: 215 },
  { code: 'DWG-1034', title: '检修口盖板', shape: 'plate', hue: 160 },
  { code: 'DWG-1047', title: '机柜导轨', shape: 'hinge', hue: 25 },
  { code: 'DWG-1052', title: '线束卡箍', shape: 'clamp', hue: 280 },
  { code: 'DWG-1066', title: '加强筋', shape: 'rib', hue: 350 },
  { code: 'DWG-1078', title: '端盖', shape: 'cover', hue: 190 },
].map(({ code, title, shape, hue }) => ({ code, title, src: svg(code, title, shape, hue) }));

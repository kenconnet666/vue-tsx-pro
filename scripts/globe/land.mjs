/**
 * 生成 Globe 的陆地位图（packages/ui/src/three/globe/land.ts）：世界地图（Natural Earth 1:110m，组件库
 * `@zerodep-dev/vue-tsx-pro-ui/maps` 的 worldCountries）按 1° 的经纬网格判断每格中心是不是陆地，一格一位，打包成 base64。
 * 地图数据更新时重跑：pnpm gen:globe-land
 *
 * Natural Earth 的多边形已在反子午线处切开，经纬度当平面坐标判断点在不在多边形里（射线法、奇偶规则）即可。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from '../lib/repo.mjs';

// 解 TopoJSON 用组件库里的实现（Node 直接运行 TS，类型去掉即可）
const { topologyFeatures } = await import(
  pathToFileURL(join(root, 'packages/ui/src/charts/geo/topojson.ts')).href
);
const world = JSON.parse(
  readFileSync(join(root, 'packages/ui/src/maps/world-countries.json'), 'utf8'),
);

const WIDTH = 360;
const HEIGHT = 180;
// 先按外接矩形筛：每格只和外接矩形盖住它的多边形比
const polygons = topologyFeatures(world, 'countries').flatMap((country) =>
  country.polygons.map((rings) => {
    const points = rings.flat();
    const lngs = points.map(([lng]) => lng);
    const lats = points.map(([, lat]) => lat);
    return {
      rings,
      bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
    };
  }),
);

/** 点在多边形里（含洞，奇偶规则）：从点往右的射线穿过边的次数是奇数 */
function contains(rings, lng, lat) {
  let inside = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
  return inside;
}

const bits = new Uint8Array((WIDTH * HEIGHT) / 8);
let count = 0;
for (let row = 0; row < HEIGHT; row++) {
  const lat = 90 - row - 0.5;
  for (let column = 0; column < WIDTH; column++) {
    const lng = column - 180 + 0.5;
    const hit = polygons.some(
      ({ rings, bounds: [west, south, east, north] }) =>
        lng >= west && lng <= east && lat >= south && lat <= north && contains(rings, lng, lat),
    );
    if (!hit) continue;
    const index = row * WIDTH + column;
    bits[index >> 3] |= 1 << (index & 7);
    count++;
  }
}

const base64 = Buffer.from(bits).toString('base64');
const source = `/**
 * Globe 的陆地位图：1° 的经纬网格（${WIDTH} × ${HEIGHT}），从北纬 90° 往南、从西经 180° 往东逐行，一格一位（1 是陆地）。
 * 由 scripts/globe/land.mjs 从 Natural Earth 1:110m 的世界地图生成（公有领域数据），不要手改。
 */
export const LAND_WIDTH = ${WIDTH};
/** 位图的行数（纬度方向，每行 1°） */
export const LAND_HEIGHT = ${HEIGHT};
/** 位图本身：每字节 8 格，低位在前，base64 编码 */
export const LAND_BITS = '${base64}';
`;
writeFileSync(join(root, 'packages/ui/src/three/globe/land.ts'), source);
console.log(`陆地格子 ${count} / ${WIDTH * HEIGHT}，位图 ${base64.length} 个字符`);

/**
 * 生成 Globe 的陆地位图（packages/ui/src/three/globe/land.ts）：世界地图（Natural Earth 1:110m，经 @unovis/ts 的
 * WorldMapTopoJSON）按 1° 的经纬网格判断每格中心是不是陆地，一格一位，打包成 base64。
 * 地图数据更新时重跑：node scripts/globe/land.mjs
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
// 地图与几何库是组件库（图表）的依赖，从那里解析
const fromUi = createRequire(join(root, 'packages/ui/package.json'));
const unovisRequire = createRequire(fromUi.resolve('@unovis/ts'));
const load = (name) => import(pathToFileURL(unovisRequire.resolve(name)).href);
const { WorldMapTopoJSON } = await load('@unovis/ts/maps');
const { feature } = await load('topojson-client');
const { geoBounds, geoContains } = await load('d3-geo');

const WIDTH = 360;
const HEIGHT = 180;
const land = feature(WorldMapTopoJSON, WorldMapTopoJSON.objects.countries);
// 先按外接矩形筛：球面上的点在多边形内的判断很慢，每格只和外接矩形盖住它的国家比
const countries = land.features.map((country) => ({ country, bounds: geoBounds(country) }));
const inBounds = ([[west, south], [east, north]], lng, lat) =>
  lat >= south &&
  lat <= north &&
  (west <= east ? lng >= west && lng <= east : lng >= west || lng <= east);
const bits = new Uint8Array((WIDTH * HEIGHT) / 8);
let count = 0;
for (let row = 0; row < HEIGHT; row++) {
  const lat = 90 - row - 0.5;
  for (let column = 0; column < WIDTH; column++) {
    const lng = column - 180 + 0.5;
    const hit = countries.some(
      ({ country, bounds }) => inBounds(bounds, lng, lat) && geoContains(country, [lng, lat]),
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

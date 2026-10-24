// 地图的地理数据：按像素简化（点少了一个数量级、弧的条数不变、同一档位用缓存）；经纬度范围
import { ChinaTopoJSON } from '@unovis/ts/maps';
import { describe, expect, it } from 'vitest';
import { simplifyTopology, topologyBounds } from '../MapChart';

const pointCount = (topology: typeof ChinaTopoJSON) =>
  topology.arcs.reduce((sum, arc) => sum + arc.length, 0);

describe('simplifyTopology', () => {
  it('画在约 500 像素宽里（每像素约 0.12 度）：点少一个数量级，弧的条数不变（共用的边界一起简化）', () => {
    const simplified = simplifyTopology(ChinaTopoJSON, 0.12 ** 2);
    expect(pointCount(simplified)).toBeLessThan(pointCount(ChinaTopoJSON) / 10);
    expect(simplified.arcs).toHaveLength(ChinaTopoJSON.arcs.length);
    expect(simplified.objects).toBe(ChinaTopoJSON.objects);
  });

  it('同一档位（2 的整数次幂）返回同一个结果；越细的档位留的点越多', () => {
    const coarse = simplifyTopology(ChinaTopoJSON, 0.015);
    expect(simplifyTopology(ChinaTopoJSON, 0.012)).toBe(coarse);
    expect(pointCount(simplifyTopology(ChinaTopoJSON, 0.001))).toBeGreaterThan(pointCount(coarse));
  });

  it('面积不是正数（绘图区还没有大小）时原样返回；范围不变', () => {
    expect(simplifyTopology(ChinaTopoJSON, 0)).toBe(ChinaTopoJSON);
    expect(simplifyTopology(ChinaTopoJSON, Infinity)).toBe(ChinaTopoJSON);
    const [west, south, east, north] = topologyBounds(simplifyTopology(ChinaTopoJSON, 0.01));
    const original = topologyBounds(ChinaTopoJSON);
    expect([west, south, east, north].map(Math.round)).toEqual(original.map(Math.round));
  });
});

// 地图的地理数据与投影：按像素简化（点少了一个数量级、弧的条数不变、同一档位用缓存）、经纬度范围、解出要素；
// 投影的中心、正射投影只看得见半个地球、换了中央经线的世界地图在反子午线处切开
import { describe, expect, it } from 'vitest';
import { chinaProvinces } from '../../maps/china';
import { worldCountries } from '../../maps/world';
import { createProjection } from '../geo/projection';
import { simplifyTopology, topologyBounds, topologyFeatures } from '../geo/topojson';

const pointCount = (topology: { arcs: readonly (readonly unknown[])[] }) =>
  topology.arcs.reduce((sum, arc) => sum + arc.length, 0);

describe('simplifyTopology', () => {
  it('画在约 500 像素宽里（每像素约 0.12 度）：点少一个数量级，弧的条数不变（共用的边界一起简化）', () => {
    const simplified = simplifyTopology(chinaProvinces, 0.12 ** 2);
    expect(pointCount(simplified)).toBeLessThan(pointCount(chinaProvinces) / 10);
    expect(simplified.arcs).toHaveLength(chinaProvinces.arcs.length);
    expect(simplified.objects).toBe(chinaProvinces.objects);
  });

  it('同一档位（2 的整数次幂）返回同一个结果；越细的档位留的点越多', () => {
    const coarse = simplifyTopology(chinaProvinces, 0.015);
    expect(simplifyTopology(chinaProvinces, 0.012)).toBe(coarse);
    expect(pointCount(simplifyTopology(chinaProvinces, 0.001))).toBeGreaterThan(pointCount(coarse));
  });

  it('面积不是正数（绘图区还没有大小）时原样返回；范围不变', () => {
    expect(simplifyTopology(chinaProvinces, 0)).toBe(chinaProvinces);
    expect(simplifyTopology(chinaProvinces, Infinity)).toBe(chinaProvinces);
    const [west, south, east, north] = topologyBounds(simplifyTopology(chinaProvinces, 0.01));
    const original = topologyBounds(chinaProvinces);
    expect([west, south, east, north].map(Math.round)).toEqual(original.map(Math.round));
  });
});

describe('topologyFeatures', () => {
  it('解出各省的多边形：环是闭合的经纬度序列，落在数据的范围里', () => {
    const features = topologyFeatures(chinaProvinces, 'provinces');
    expect(features.length).toBeGreaterThan(30);
    const jiangsu = features.find((feature) => feature.id === 'CN-JS')!;
    expect(jiangsu.properties.name).toBe('Jiangsu');
    const ring = jiangsu.polygons[0]![0]!;
    expect(ring[0]).toEqual(ring.at(-1));
    for (const [longitude, latitude] of ring) {
      expect(longitude).toBeGreaterThan(115);
      expect(longitude).toBeLessThan(123);
      expect(latitude).toBeGreaterThan(30);
      expect(latitude).toBeLessThan(36);
    }
    expect(topologyFeatures(chinaProvinces, 'nothing')).toEqual([]);
  });
});

describe('createProjection', () => {
  const bounds = topologyBounds(chinaProvinces);

  it('圆锥投影以中心为原点、北在上（y 向下变小）', () => {
    const project = createProjection('conic', { center: [105, 35], bounds });
    const [x, y] = project.point([105, 35])!;
    const north = project.point([105, 45])!;
    const east = project.point([115, 35])!;
    expect(north[1]).toBeLessThan(y);
    expect(east[0]).toBeGreaterThan(x);
  });

  it('正射投影：中心正对着看，背面的点看不见；多边形裁到看得见的半球', () => {
    const project = createProjection('orthographic', { center: [105, 35], bounds });
    const [cx, cy] = project.point([105, 35])!;
    expect(Math.hypot(cx, cy)).toBeLessThan(1e-9);
    expect(project.point([-75, -35])).toBeNull();
    expect(project.sphere).toEqual({ x: 0, y: 0, r: 1 });
    for (const [x, y] of project.polygon([
      [
        [100, 0],
        [200, 0],
        [200, 60],
        [100, 60],
        [100, 0],
      ],
    ])[0]!)
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(1 + 1e-9);
  });

  it('世界地图换了中央经线：跨反子午线的国家切成两块，各在一侧', () => {
    const world = topologyFeatures(worldCountries, 'countries');
    const usa = world.find((feature) => feature.id === 'US')!;
    const project = createProjection('naturalEarth', {
      center: [110, 0],
      bounds: topologyBounds(worldCountries),
    });
    const rings = usa.polygons.flatMap((polygon) => project.polygon(polygon));
    const xs = rings.map((ring) => ring.reduce((sum, [x]) => sum + x, 0) / ring.length);
    // 中央经线在东经 110°，反子午线是西经 70°：美国本土在右侧，阿拉斯加西端的岛也还在右侧，
    // 切开后每一块都只在一侧，不会出现横穿整张图的长条
    for (const ring of rings) {
      const ringXs = ring.map(([x]) => x);
      expect(Math.max(...ringXs) - Math.min(...ringXs)).toBeLessThan(Math.PI);
    }
    expect(Math.max(...xs)).toBeGreaterThan(0);
  });
});

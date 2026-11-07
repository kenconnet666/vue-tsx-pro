// 省市区：三级的树（直辖市补上市一级）、按层数截断并缓存、代码查名称
import { describe, expect, it } from 'vitest';
import { areaAccessors, areaName, areaNames, areaTree } from '../area';

describe('area', () => {
  it('省 → 市 → 区县；代码前缀对得上', () => {
    const zhejiang = areaTree().find((province) => province.code === '330000')!;
    const hangzhou = zhejiang.children!.find((city) => city.code === '330100')!;
    expect(hangzhou.name).toBe('杭州市');
    expect(hangzhou.children!.map((county) => county.name)).toContain('西湖区');
    expect(hangzhou.children!.every((county) => county.code.startsWith('3301'))).toBe(true);
  });

  it('直辖市有市一级，三级都在', () => {
    const beijing = areaTree().find((province) => province.code === '110000')!;
    expect(beijing.children!.length).toBeGreaterThan(0);
    expect(beijing.children![0]!.children!.map((county) => county.name)).toContain('东城区');
  });

  it('depth 截断层数；同样的 depth 返回同一个数组', () => {
    expect(areaTree({ depth: 1 })[0]!.children).toBeUndefined();
    expect(areaTree({ depth: 2 })[0]!.children![0]!.children).toBeUndefined();
    expect(areaTree({ depth: 2 })).toBe(areaTree({ depth: 2 }));
  });

  it('代码查名称；取值函数给 Cascader', () => {
    expect(areaNames(['330000', '330100', '330106', '999999'])).toEqual([
      '浙江省',
      '杭州市',
      '西湖区',
      '999999',
    ]);
    expect(areaName('110000')).toBe('北京市');
    const node = areaTree()[0]!;
    expect([areaAccessors.getKey(node), areaAccessors.getLabel(node)]).toEqual([
      node.code,
      node.name,
    ]);
  });
});

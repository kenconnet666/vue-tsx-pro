/**
 * 省市区的树与按代码查名称：Cascader、TreeSelect 直接用（见 index.ts 开头的用法）。
 */
import { areaList } from './data';

/** 一个行政区：代码、名称与下一级 */
export interface AreaNode {
  /** 6 位代码 */
  code: string;
  /** 名称 */
  name: string;
  /** 下一级；最后一级没有 */
  children?: AreaNode[];
}

/** areaTree 的选项 */
export interface AreaTreeOptions {
  /**
   * 展开几级：1 省、2 省市、3 省市区
   * @default 3
   */
  depth?: 1 | 2 | 3;
}

/** 交给 Cascader、TreeSelect 的取值函数：`{...areaAccessors}` */
export const areaAccessors = {
  getKey: (node: AreaNode) => node.code,
  getLabel: (node: AreaNode) => node.name,
  getChildren: (node: AreaNode) => node.children,
};

const cache = new Map<number, AreaNode[]>();

/**
 * 省 → 市 → 区县的树。直辖市这类没有市一级的，市一级用省的名字补上，保证三级都在。
 * 同样的 depth 只建一次，返回的是同一个数组（不要改它）
 */
export function areaTree({ depth = 3 }: AreaTreeOptions = {}): AreaNode[] {
  const cached = cache.get(depth);
  if (cached) return cached;
  const cities = Object.entries(areaList.city_list);
  const counties = Object.entries(areaList.county_list);
  const tree = Object.entries(areaList.province_list).map(([code, name]): AreaNode => {
    if (depth === 1) return { code, name };
    const prefix = code.slice(0, 2);
    const own = cities.filter(([city]) => city.startsWith(prefix));
    const children = (own.length ? own : [[`${prefix}0100`, name] as const]).map(
      ([cityCode, cityName]): AreaNode =>
        depth === 2
          ? { code: cityCode, name: cityName }
          : {
              code: cityCode,
              name: cityName,
              children: counties
                .filter(([county]) => county.startsWith(cityCode.slice(0, 4)))
                .map(([county, countyName]) => ({ code: county, name: countyName })),
            },
    );
    return { code, name, children };
  });
  cache.set(depth, tree);
  return tree;
}

/** 代码对应的名称（省、市、区县都行）；没有时 undefined */
export function areaName(code: string): string | undefined {
  return areaList.county_list[code] ?? areaList.city_list[code] ?? areaList.province_list[code];
}

/** 一条代码路径的名称（Cascader 的值 → 显示用的文字）；不认识的代码原样留着 */
export function areaNames(path: readonly string[]): string[] {
  return path.map((code) => areaName(code) ?? code);
}

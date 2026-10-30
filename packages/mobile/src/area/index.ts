/**
 * 省市区（子路径 `@zerodep-dev/vue-tsx-pro-mobile/area`）：行政区划数据与它组成的选项树，交给 Picker 或 Cascader 做联动选择。
 *
 *   import { areaOptions } from '@zerodep-dev/vue-tsx-pro-mobile/area';
 *   <Picker columns={areaOptions()} _value={['330000', '330100', '330106']} />
 *   <Cascader options={areaOptions({ depth: 2 })} />                 只到市
 */
import type { PickerOption } from '../picker/PickerColumn';
import { areaList } from './data';

export { areaList } from './data';

/** areaOptions 的选项 */
export interface AreaOptions {
  /**
   * 展开几级：1 省、2 省市、3 省市区
   * @default 3
   */
  depth?: 1 | 2 | 3;
}

const cache = new Map<number, PickerOption[]>();

/**
 * 省 → 市 → 区县的选项树（值是 6 位代码的字符串）。代码的前两位是省、前四位是市；
 * 直辖市这类没有市一级的，市一级用省的名字补上，保证三级都在
 */
export function areaOptions({ depth = 3 }: AreaOptions = {}): PickerOption[] {
  const cached = cache.get(depth);
  if (cached) return cached;
  const cities = Object.entries(areaList.city_list);
  const counties = Object.entries(areaList.county_list);
  const options = Object.entries(areaList.province_list).map(([provinceCode, province]) => {
    const prefix = provinceCode.slice(0, 2);
    const option: PickerOption = { text: province, value: provinceCode };
    if (depth > 1) {
      const own = cities.filter(([code]) => code.startsWith(prefix));
      option.children = (own.length ? own : [[`${prefix}0100`, province] as const]).map(
        ([cityCode, city]) => {
          const child: PickerOption = { text: city, value: cityCode };
          if (depth > 2)
            child.children = counties
              .filter(([code]) => code.startsWith(cityCode.slice(0, 4)))
              .map(([code, county]) => ({ text: county, value: code }));
          return child;
        },
      );
    }
    return option;
  });
  cache.set(depth, options);
  return options;
}

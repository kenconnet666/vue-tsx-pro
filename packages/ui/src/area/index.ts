/**
 * 省市区（子路径 `@zerodep-dev/vue-tsx-pro-ui/area`）：行政区划数据与它组成的树，交给 Cascader、TreeSelect 做联动选择。
 *
 *   import { areaAccessors, areaNames, areaTree } from '@zerodep-dev/vue-tsx-pro-ui/area';
 *   <Cascader items={areaTree()} {...areaAccessors} _value={path} />            省 / 市 / 区
 *   <Cascader items={areaTree({ depth: 2 })} {...areaAccessors} />               只到市
 *   areaNames(['330000', '330100', '330106'])                                    ['浙江省', '杭州市', '西湖区']
 *
 * 数据与移动端的 /area 是同一份（6 位代码，前两位是省、前四位是市）。约 100 KB，单独一个子路径，用不到的应用不打包。
 */
export {
  areaAccessors,
  areaName,
  areaNames,
  areaTree,
  type AreaNode,
  type AreaTreeOptions,
} from './area';
export { areaList } from './data';

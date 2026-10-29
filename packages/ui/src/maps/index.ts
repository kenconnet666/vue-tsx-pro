/**
 * 地图的地理数据（子路径 `@zerodep-dev/vue-tsx-pro-ui/maps`）：给 MapChart 用的 TopoJSON，中国省份与世界各国。
 *
 *   import { chinaProvinces, worldCountries } from '@zerodep-dev/vue-tsx-pro-ui/maps';
 *
 * 数据有几百 KB，单独一个子路径：只用图表、不画地图的应用不打包它；也可以换成自己的 TopoJSON。
 */
export { chinaProvinces } from './china';
export { worldCountries } from './world';

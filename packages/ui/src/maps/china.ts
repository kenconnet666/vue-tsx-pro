/**
 * 中国省份的地理数据（TopoJSON，约 300 KB）：要素组是 provinces，要素的 id 是 'CN-JS' 这样的写法，属性 name 是英文名。
 * 这份数据里湖北是 CN-HU、河北是 CN-HB、河南是 CN-HE、海南是 CN-HA、陕西是 CN-SA、内蒙古是 CN-NM。
 *
 *   import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
 *   <MapChart topology={chinaProvinces} feature="provinces" areas={[{ id: 'CN-JS', label: '江苏', value: 623 }]} />
 *
 * 数据取自 Unovis（F5, Inc.，Apache License 2.0：https://www.apache.org/licenses/LICENSE-2.0）自带的地图，
 * 只保留了 provinces 与名称属性。
 */
import type { MapTopology } from '../charts/geo/topojson';
import data from './china-provinces.json';

/** 中国省份（要素组 provinces） */
export const chinaProvinces: MapTopology = data;

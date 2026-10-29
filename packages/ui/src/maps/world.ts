/**
 * 世界各国的地理数据（TopoJSON，约 210 KB，不含南极洲）：要素组是 countries，要素的 id 是 ISO 3166-1 两位代码（'CN'、'DE'），
 * 属性 name 是英文名。
 *
 *   import { worldCountries } from '@zerodep-dev/vue-tsx-pro-ui/maps';
 *   <MapChart topology={worldCountries} feature="countries" areas={[{ id: 'DE', label: '德国', value: 3200 }]} />
 *
 * 国界来自 Natural Earth（公有领域），经 Unovis（F5, Inc.，Apache License 2.0：
 * https://www.apache.org/licenses/LICENSE-2.0）整理成 TopoJSON；这里只保留了 countries 与名称属性。
 */
import type { MapTopology } from '../charts/geo/topojson';
import data from './world-countries.json';

/** 世界各国（要素组 countries） */
export const worldCountries: MapTopology = data;

// 全球供应链：世界地图（ISO 两位国家代码）按各国的采购额着色，跨了大半个地球，默认用 Natural Earth 投影，
// center 把中央经线放在东经 110°（中国在中间，欧洲在左、美洲在右）；
// 供应商是方形的点、组装厂是圆点，流向连到上海，粗细按年采购额，flow 时有流动的粒子
import { WorldMap110mAlphaTopoJSON } from '@unovis/ts/maps';
import { _component } from '@vue-tsx-pro/tsx';
import { MapChart } from '@vue-tsx-pro/ui/charts';

/** 国家代码 → 名称 */
const countries: Record<string, string> = {
  DE: '德国',
  FR: '法国',
  US: '美国',
  IN: '印度',
  AU: '澳大利亚',
  BR: '巴西',
  GB: '英国',
  IT: '意大利',
  CA: '加拿大',
};

const suppliers = [
  { id: 'de', label: '斯图加特', longitude: 9.18, latitude: 48.78, value: 3200, country: 'DE' },
  { id: 'fr', label: '图卢兹', longitude: 1.44, latitude: 43.6, value: 2800, country: 'FR' },
  { id: 'us', label: '西雅图', longitude: -122.33, latitude: 47.61, value: 4100, country: 'US' },
  { id: 'in', label: '班加罗尔', longitude: 77.59, latitude: 12.97, value: 1900, country: 'IN' },
  { id: 'au', label: '墨尔本', longitude: 144.96, latitude: -37.81, value: 900, country: 'AU' },
  { id: 'br', label: '圣若泽', longitude: -45.89, latitude: -23.18, value: 650, country: 'BR' },
];

export default _component(() => () => (
  <MapChart
    aria-label="全球采购额与流向"
    topology={WorldMap110mAlphaTopoJSON}
    feature="countries"
    areas={[
      ...suppliers.map((supplier) => ({
        id: supplier.country,
        label: countries[supplier.country]!,
        value: supplier.value,
      })),
      { id: 'GB', label: countries.GB!, value: 1200 },
      { id: 'IT', label: countries.IT!, value: 700 },
      { id: 'CA', label: countries.CA!, value: 1500 },
    ]}
    points={[
      { id: 'sh', label: '上海总仓', longitude: 121.47, latitude: 31.23, color: 'accent' },
      ...suppliers.map((supplier) => ({ ...supplier, shape: 'square' as const, color: 'chart2' })),
    ]}
    links={suppliers.map((supplier) => ({ from: supplier.id, to: 'sh', value: supplier.value }))}
    flow
    center={[110, 20]}
    color="chart5"
    unit="万美元"
    height={380}
    zoomable
  />
));

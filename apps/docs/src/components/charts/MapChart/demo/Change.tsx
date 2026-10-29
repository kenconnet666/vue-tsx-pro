// 同比变化：scheme="diverging" 以 0 为界，降了用 danger、涨了用 success，离 0 越远越深；连续着色，色带中间是 0
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
import { MapChart, type MapArea } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import { provinces } from './china';

const areas: MapArea[] = provinces.map((province, index) => ({
  id: province.id,
  label: province.name,
  value: Math.round((Math.sin(index * 2.3) * 0.28 + 0.06) * 1000) / 1000,
}));

export default _component(() => () => (
  <MapChart
    aria-label="各省采购额同比"
    topology={chinaProvinces}
    feature="provinces"
    areas={areas}
    scheme="diverging"
    valueFormat={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }}
    height={340}
  />
));

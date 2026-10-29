// 投影对比：同一份中国地图换投影。conic（默认）以中国为中心，正着；mercator 北方被放大；
// naturalEarth 是世界地图的投影，中国的北边偏扁；orthographic 是从正上方看地球
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, ToggleGroup, ToggleItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
import { MapChart, type MapArea, type MapProjections } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import { provinces, sampleValue } from './china';

const areas: MapArea[] = provinces.map((province, index) => ({
  id: province.id,
  label: province.name,
  value: sampleValue(index, 100),
}));

const options: { value: keyof MapProjections; label: string }[] = [
  { value: 'conic', label: '等积圆锥' },
  { value: 'mercator', label: '墨卡托' },
  { value: 'naturalEarth', label: 'Natural Earth' },
  { value: 'orthographic', label: '地球仪' },
];

export default _component(() => {
  let projection = _state<keyof MapProjections>('conic');
  return () => (
    <Flex direction="column" gap="sm">
      <ToggleGroup _value={projection} required size="sm" aria-label="投影">
        {options.map((option) => (
          <ToggleItem key={option.value} value={option.value}>
            {option.label}
          </ToggleItem>
        ))}
      </ToggleGroup>
      <MapChart
        aria-label="投影对比"
        topology={chinaProvinces}
        feature="provinces"
        projection={projection}
        areas={areas}
        color="chart3"
        valueFormat={{ maximumFractionDigits: 0 }}
        height={340}
      />
    </Flex>
  );
});

// 分类着色：区域写了 color 时按它，不按数值（这里按所属的大区，颜色取色板）；所有区域都指定了颜色时不显示色带，
// 图例自己写在下面
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
import { MapChart, resolveColor, type MapArea } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { provinces } from './china';

const regions = ['华北', '东北', '华东', '华中', '华南', '西南', '西北'];
const palette = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6', 'chart7'] as const;

const areas: MapArea[] = provinces.map((province) => ({
  id: province.id,
  label: `${province.name}（${province.region}）`,
  color: palette[regions.indexOf(province.region)],
}));

const styles = css.create({
  swatch: { width: '0.75rem', height: '0.75rem', borderRadius: '2px' },
  color: (color: string) => ({ backgroundColor: color }),
});

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <MapChart
      aria-label="各大区"
      topology={chinaProvinces}
      feature="provinces"
      areas={areas}
      height={320}
    />
    <Flex gap="md" wrap>
      {regions.map((region, index) => (
        <Flex key={region} gap="xs" align="center">
          <span {...css.attrs(styles.swatch, styles.color(resolveColor(palette[index], 0)))} />
          <Small>{region}</Small>
        </Flex>
      ))}
    </Flex>
  </Flex>
));

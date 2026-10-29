// 各省的销售额：默认的等积圆锥投影以中国为中心（正着、面积不失真），分成 5 档着色，图例是 5 个色块；
// 省名写在区域上（areaLabels），工厂的点按产值定大小；可以拖动、按住 Ctrl 滚轮缩放，右上角有放大、缩小、复位；
// 点一个省份在下面显示它
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
import { MapChart, type MapArea } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import { provinces, sampleValue } from './china';

const areas: MapArea[] = provinces.map((province, index) => ({
  id: province.id,
  label: province.name,
  value: sampleValue(index + 8 * Number(province.region === '华东'), 640),
}));

export default _component(() => {
  let picked = _state<MapArea | null>(null);
  return () => (
    <>
      <MapChart
        aria-label="各省销售额"
        topology={chinaProvinces}
        feature="provinces"
        areas={areas}
        points={[
          { id: 'sh', label: '上海总仓', longitude: 121.47, latitude: 31.23, value: 860 },
          { id: 'sy', label: '沈阳仓', longitude: 123.43, latitude: 41.8, value: 310 },
          { id: 'xa', label: '西安仓', longitude: 108.94, latitude: 34.34, value: 420 },
          { id: 'cd', label: '成都仓', longitude: 104.07, latitude: 30.67, value: 260 },
          { id: 'gz', label: '广州仓', longitude: 113.26, latitude: 23.13, value: 180 },
        ]}
        bins={5}
        areaLabels
        unit="万元"
        valueFormat={{ maximumFractionDigits: 0 }}
        height={460}
        zoomable
        exportable
        onAreaClick={(area) => (picked = area)}
      />
      <Small tone="muted">
        {picked
          ? `${picked.label}：${String(picked.value)} 万元`
          : '点一个省份看它的金额；拖动、按住 Ctrl 滚轮或右上角的按钮缩放'}
      </Small>
    </>
  );
});

// 三年的月度数据：zoom 在下面放一条区间滑块，拖两端（或聚焦后用方向键）只看其中一段，“显示全部”恢复；
// exportable 在右上角放导出菜单：绘图区存成 PNG，数据存成 CSV（文件名用图表的名称）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { LineChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

// 按月份算出一组有季节起伏、逐年增长的数据
const months = Array.from({ length: 36 }, (_, i) => {
  const year = 2024 + Math.floor(i / 12);
  const month = (i % 12) + 1;
  const season = Math.sin((month / 12) * Math.PI * 2) * 18;
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    orders: Math.round(120 + i * 3.2 + season),
    returns: Math.round(14 + Math.cos(i / 3) * 4 + i * 0.2),
  };
});

export default _component(() => {
  let range = _state<[number, number] | null>([24, 35]);
  return () => (
    <>
      <LineChart
        aria-label="月度订单与退货"
        data={months}
        index="month"
        series={[
          { key: 'orders', label: '订单' },
          { key: 'returns', label: '退货', color: 'danger' },
        ]}
        unit="单"
        zoom
        _zoomRange={range}
        exportable
      />
      <Small tone="muted">
        显示：{range ? `${months[range[0]]!.month} 到 ${months[range[1]]!.month}` : '全部 36 个月'}
      </Small>
    </>
  );
});

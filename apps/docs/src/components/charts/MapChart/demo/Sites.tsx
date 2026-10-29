// 只标地点：区域不给数值时是底色；供应商按交付状态着色（color 用语义色），大小按年采购额；
// 长三角的地点挤在一起：名字自动换到放得下的方位，再挤就退到外一圈画引线，放不下的悬停看；
// 点一个地点在下面显示它（onPointClick）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
import { MapChart, type MapPoint } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const status = { success: '准时', warning: '延误', danger: '断供风险' } as const;

const sites: (MapPoint & { color: keyof typeof status })[] = [
  { id: 'hrb', label: '哈尔滨', longitude: 126.53, latitude: 45.8, value: 320, color: 'success' },
  { id: 'tj', label: '天津', longitude: 117.2, latitude: 39.13, value: 540, color: 'success' },
  { id: 'qd', label: '青岛', longitude: 120.38, latitude: 36.07, value: 280, color: 'warning' },
  { id: 'nj', label: '南京', longitude: 118.8, latitude: 32.06, value: 610, color: 'success' },
  { id: 'sh', label: '上海', longitude: 121.47, latitude: 31.23, value: 820, color: 'success' },
  { id: 'su', label: '苏州', longitude: 120.59, latitude: 31.3, value: 530, color: 'success' },
  { id: 'wx', label: '无锡', longitude: 120.31, latitude: 31.49, value: 240, color: 'warning' },
  { id: 'cz', label: '常州', longitude: 119.97, latitude: 31.81, value: 170, color: 'success' },
  { id: 'hz', label: '杭州', longitude: 120.16, latitude: 30.27, value: 480, color: 'success' },
  { id: 'jx', label: '嘉兴', longitude: 120.76, latitude: 30.75, value: 150, color: 'danger' },
  { id: 'nb', label: '宁波', longitude: 121.55, latitude: 29.87, value: 450, color: 'danger' },
  { id: 'xm', label: '厦门', longitude: 118.09, latitude: 24.48, value: 190, color: 'success' },
  { id: 'sz', label: '深圳', longitude: 114.06, latitude: 22.54, value: 720, color: 'warning' },
  { id: 'wh', label: '武汉', longitude: 114.31, latitude: 30.59, value: 380, color: 'success' },
  { id: 'cq', label: '重庆', longitude: 106.55, latitude: 29.56, value: 260, color: 'danger' },
  { id: 'km', label: '昆明', longitude: 102.83, latitude: 24.88, value: 110, color: 'success' },
  { id: 'lz', label: '兰州', longitude: 103.83, latitude: 36.06, value: 140, color: 'warning' },
  { id: 'urc', label: '乌鲁木齐', longitude: 87.62, latitude: 43.83, value: 90, color: 'success' },
];

export default _component(() => {
  let picked = _state<(typeof sites)[number] | null>(null);
  return () => (
    <Flex direction="column" gap="sm">
      <MapChart
        aria-label="供应商分布"
        topology={chinaProvinces}
        feature="provinces"
        points={sites}
        unit="万元"
        height={360}
        onPointClick={(point) => (picked = sites.find((site) => site.id === point.id) ?? null)}
      />
      <Small tone="muted">
        {picked
          ? `${picked.label}：年采购 ${String(picked.value)} 万元，${status[picked.color]}`
          : '绿色准时、黄色延误、红色有断供风险；点一个地点看详情'}
      </Small>
    </Flex>
  );
});

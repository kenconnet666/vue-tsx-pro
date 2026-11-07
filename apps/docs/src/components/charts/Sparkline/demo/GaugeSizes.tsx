// 大小随字号：size 档位或外层的字号；中间的文字可以用 valueLabel 换成自己的（“82 / 100 分”）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Gauge } from '@zerodep-dev/vue-tsx-pro-ui';

const bands = [
  { to: 60, tone: 'danger' as const },
  { to: 80, tone: 'warning' as const },
  { to: 100, tone: 'success' as const },
];

export default _component(() => () => (
  <Flex gap="lg" align="end" wrap>
    <Gauge value={82} bands={bands} size="xs" label="xs" />
    <Gauge value={82} bands={bands} size="sm" label="sm" />
    <Gauge value={82} bands={bands} label="默认" />
    <Gauge value={82} bands={bands} size="lg" label="质量评分" valueLabel="82 分" />
  </Flex>
));

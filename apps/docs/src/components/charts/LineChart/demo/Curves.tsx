import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, ToggleGroup, ToggleItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { LineChart, type LineCurves } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const days = [
  { day: '周一', visits: 820 },
  { day: '周二', visits: 932 },
  { day: '周三', visits: 901 },
  { day: '周四', visits: 1290 },
  { day: '周五', visits: 1330 },
  { day: '周六', visits: 760 },
  { day: '周日', visits: 680 },
];

export default _component(() => {
  let curve = _state<keyof LineCurves>('monotone');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup _value={curve} aria-label="线的形状" size="sm" required>
        <ToggleItem value="linear">折线</ToggleItem>
        <ToggleItem value="monotone">平滑</ToggleItem>
        <ToggleItem value="step">阶梯</ToggleItem>
      </ToggleGroup>
      <LineChart
        aria-label="一周访问量"
        data={days}
        index="day"
        series={[{ key: 'visits', label: '访问量' }]}
        curve={curve}
        dots="filled"
      />
    </Flex>
  );
});

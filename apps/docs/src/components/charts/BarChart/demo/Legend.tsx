import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Text } from '@vue-tsx-pro/ui';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const regions = [
  { region: '华东', y2024: 320, y2025: 380, y2026: 410 },
  { region: '华南', y2024: 260, y2025: 300, y2026: 290 },
  { region: '华北', y2024: 210, y2025: 240, y2026: 280 },
  { region: '西南', y2024: 150, y2025: 190, y2026: 230 },
];

export default _component(() => {
  let hidden = _state<string[]>(['y2024']);
  return () => (
    <Flex direction="column" gap="md">
      <BarChart
        aria-label="各区域年度销售额"
        data={regions}
        index="region"
        series={[
          { key: 'y2024', label: '2024 年' },
          { key: 'y2025', label: '2025 年' },
          { key: 'y2026', label: '2026 年' },
        ]}
        unit="万元"
        _hiddenSeries={_bind(hidden)}
      />
      <Flex gap="sm" align="center" wrap>
        <Text tone="muted" size="sm">
          已隐藏：{hidden.length ? hidden.join('、') : '无'}
        </Text>
        <Button size="sm" variant="soft" disabled={!hidden.length} onClick={() => (hidden = [])}>
          全部显示
        </Button>
      </Flex>
    </Flex>
  );
});

// 人口流动：几个地区之间一年迁入迁出的人数；点图例隐藏一个地区，下面列出当前隐藏了哪些
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Text } from '@vue-tsx-pro/ui';
import { ChordChart } from '@vue-tsx-pro/ui/charts';

const regions = [
  { id: 'north', label: '华北' },
  { id: 'east', label: '华东' },
  { id: 'south', label: '华南' },
  { id: 'central', label: '华中' },
  { id: 'west', label: '西部' },
];

const moves = [
  { source: 'north', target: 'east', value: 182000 },
  { source: 'east', target: 'north', value: 96000 },
  { source: 'central', target: 'east', value: 264000 },
  { source: 'central', target: 'south', value: 238000 },
  { source: 'west', target: 'south', value: 151000 },
  { source: 'west', target: 'east', value: 128000 },
  { source: 'south', target: 'central', value: 74000 },
  { source: 'east', target: 'west', value: 58000 },
  { source: 'north', target: 'south', value: 69000 },
];

const labelOf = (id: string) => regions.find((region) => region.id === id)?.label ?? id;

export default _component(() => {
  let hidden = _state<string[]>([]);
  return () => (
    <Flex direction="column" gap="md">
      <ChordChart
        aria-label="地区间人口流动"
        nodes={regions}
        links={moves}
        _hiddenNodes={_bind(hidden)}
        valueFormat={{ notation: 'compact' }}
        unit="人"
        height={400}
      />
      <Text size="sm" tone="muted">
        隐藏的地区：{hidden.length > 0 ? hidden.map(labelOf).join('、') : '无'}
      </Text>
    </Flex>
  );
});

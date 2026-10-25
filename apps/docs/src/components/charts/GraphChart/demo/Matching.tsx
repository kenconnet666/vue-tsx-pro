// 储备库的匹配推送：触发事件 → 匹配到的储备件 → 推送给谁；分层布局，三组各框在一起，可以换方向与布局
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { GraphChart, type GraphChartLayouts } from '@vue-tsx-pro/ui/charts';

const groups = [
  { id: 'event', label: '触发事件' },
  { id: 'reserve', label: '储备件' },
  { id: 'person', label: '推送对象' },
];

const nodes = [
  { id: 'e1', label: '新供应商接入', group: 'event', shape: 'square' as const },
  { id: 'e2', label: '材料牌号归并', group: 'event', shape: 'square' as const },
  { id: 'r1', label: '液压管路卡箍', sublabel: 'CB-0412', group: 'reserve' },
  { id: 'r2', label: '襟翼滑轨罩', sublabel: 'CB-0388', group: 'reserve' },
  { id: 'r3', label: '舱门铰链', sublabel: 'CB-0275', group: 'reserve' },
  { id: 'p1', label: '成本工程师 甲', group: 'person' },
  { id: 'p2', label: '设计师 乙', group: 'person' },
  { id: 'p3', label: '设计师 丙', group: 'person' },
];

const links = [
  { source: 'e1', target: 'r1', label: '件号' },
  { source: 'e1', target: 'r3', label: '工艺' },
  { source: 'e2', target: 'r2', label: '材料' },
  { source: 'e2', target: 'r3', label: '材料' },
  { source: 'r1', target: 'p1' },
  { source: 'r1', target: 'p2' },
  { source: 'r2', target: 'p1' },
  { source: 'r3', target: 'p3', dashed: true },
];

export default _component(() => {
  let layout = _state<keyof GraphChartLayouts>('dagre');
  let direction = _state<'LR' | 'TB'>('LR');
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="md" wrap>
        <ToggleGroup _value={_bind(layout)} aria-label="布局" size="sm" required>
          <ToggleItem value="dagre">分层</ToggleItem>
          <ToggleItem value="parallel">分列</ToggleItem>
          <ToggleItem value="force">力导向</ToggleItem>
        </ToggleGroup>
        <ToggleGroup _value={_bind(direction)} aria-label="方向" size="sm" required>
          <ToggleItem value="LR">从左到右</ToggleItem>
          <ToggleItem value="TB">从上到下</ToggleItem>
        </ToggleGroup>
      </Flex>
      <GraphChart
        aria-label="储备库的匹配推送"
        nodes={nodes}
        links={links}
        groups={groups}
        layout={layout}
        direction={direction}
        height={380}
      />
    </Flex>
  );
});

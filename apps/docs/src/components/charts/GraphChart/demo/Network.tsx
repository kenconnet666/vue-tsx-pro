// 团队与供应商的协作：连线粗细是合作的项目数；点一个节点选中它，不相连的变淡，点空白处取消
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { GraphChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const groups = [
  { id: 'team', label: '责任团队', color: 'chart1' },
  { id: 'supplier', label: '供应商', color: 'chart3' },
];

const nodes = [
  { id: 'zt', label: '技术部', group: 'team', size: 34 },
  { id: 'fc', label: '研发中心', group: 'team', size: 30 },
  { id: 'qy', label: '运营部', group: 'team', size: 30 },
  { id: 'a', label: '供应商甲', group: 'supplier' },
  { id: 'b', label: '供应商乙', group: 'supplier' },
  { id: 'c', label: '供应商丙', group: 'supplier' },
  { id: 'd', label: '供应商丁', group: 'supplier' },
  { id: 'e', label: '供应商戊', group: 'supplier' },
];

const links = [
  { source: 'zt', target: 'a', value: 12 },
  { source: 'zt', target: 'b', value: 5 },
  { source: 'fc', target: 'b', value: 9 },
  { source: 'fc', target: 'c', value: 3 },
  { source: 'qy', target: 'c', value: 7 },
  { source: 'qy', target: 'd', value: 2 },
  { source: 'zt', target: 'e', value: 1 },
  { source: 'qy', target: 'a', value: 4 },
];

export default _component(() => {
  let selected = _state<string | null>(null);
  return () => (
    <Flex direction="column" gap="sm">
      <GraphChart
        aria-label="团队与供应商的协作"
        nodes={nodes}
        links={links}
        groups={groups}
        unit="项"
        _selected={selected}
        height={340}
      />
      <Small tone="muted">
        {selected ? `选中：${nodes.find((node) => node.id === selected)?.label}` : '点一个节点'}
      </Small>
    </Flex>
  );
});

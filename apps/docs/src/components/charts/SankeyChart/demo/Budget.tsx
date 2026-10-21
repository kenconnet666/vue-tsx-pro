// 年度预算：收入按来源汇总，再分到各部门与具体用途；金额用 Decimal，按货币格式显示
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { SankeyChart, type SankeyAligns } from '@vue-tsx-pro/ui/charts';
import Decimal from 'decimal.js';

const nodes = [
  { id: 'product', label: '产品收入' },
  { id: 'service', label: '服务收入' },
  { id: 'budget', label: '年度预算', color: 'chart5' },
  { id: 'rd', label: '研发' },
  { id: 'market', label: '市场' },
  { id: 'ops', label: '运营' },
  { id: 'salary', label: '人力' },
  { id: 'cloud', label: '云资源' },
  { id: 'campaign', label: '投放' },
  { id: 'office', label: '办公' },
];

const links = [
  { source: 'product', target: 'budget', value: new Decimal('8200000') },
  { source: 'service', target: 'budget', value: new Decimal('3650000') },
  { source: 'budget', target: 'rd', value: new Decimal('5400000') },
  { source: 'budget', target: 'market', value: new Decimal('3800000') },
  { source: 'budget', target: 'ops', value: new Decimal('2650000') },
  { source: 'rd', target: 'salary', value: new Decimal('4100000') },
  { source: 'rd', target: 'cloud', value: new Decimal('1300000') },
  { source: 'market', target: 'campaign', value: new Decimal('2900000') },
  { source: 'market', target: 'salary', value: new Decimal('900000') },
  { source: 'ops', target: 'office', value: new Decimal('1450000') },
  { source: 'ops', target: 'salary', value: new Decimal('1200000') },
];

export default _component(() => {
  let align = _state<keyof SankeyAligns>('justify');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup value={_bind(align)} aria-label="节点的排法" size="sm" required>
        <ToggleItem value="justify">两端对齐</ToggleItem>
        <ToggleItem value="left">靠左</ToggleItem>
        <ToggleItem value="right">靠右</ToggleItem>
        <ToggleItem value="center">居中</ToggleItem>
      </ToggleGroup>
      <SankeyChart
        aria-label="年度预算分配"
        nodes={nodes}
        links={links}
        align={align}
        valueFormat={{ style: 'currency', currency: 'CNY', notation: 'compact' }}
        height={360}
      />
    </Flex>
  );
});

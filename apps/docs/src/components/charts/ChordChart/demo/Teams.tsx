// 部门协作：一年里各部门之间互相提了多少需求；弧越长往来越多，悬停弦看两个部门之间的量
import { _component } from '@vue-tsx-pro/tsx';
import { ChordChart } from '@vue-tsx-pro/ui/charts';

const teams = [
  { id: 'product', label: '产品' },
  { id: 'design', label: '设计' },
  { id: 'frontend', label: '前端' },
  { id: 'backend', label: '后端' },
  { id: 'qa', label: '测试' },
  { id: 'ops', label: '运维' },
];

const requests = [
  { source: 'product', target: 'design', value: 86 },
  { source: 'product', target: 'frontend', value: 64 },
  { source: 'product', target: 'backend', value: 58 },
  { source: 'design', target: 'frontend', value: 72 },
  { source: 'frontend', target: 'backend', value: 95 },
  { source: 'frontend', target: 'qa', value: 48 },
  { source: 'backend', target: 'qa', value: 52 },
  { source: 'backend', target: 'ops', value: 61 },
  { source: 'qa', target: 'product', value: 34 },
  { source: 'ops', target: 'frontend', value: 22 },
];

export default _component(() => () => (
  <ChordChart aria-label="部门协作" nodes={teams} links={requests} unit="个需求" height={400} />
));

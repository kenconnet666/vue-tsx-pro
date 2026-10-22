// 紧凑的尺寸（size="sm"）与 fit（放不下时按比例缩小到容器宽）：放进卡片、侧栏、收件箱的预览；
// nodeDetail 在节点名称下写处理人或完成日期；
// 会签（供应商并行评估）、线下动作（商务洽谈，虚线框）与提级（黄色虚线）都画得出来
import { _component } from '@vue-tsx-pro/tsx';
import { Card, FlowDiagram, processProgress, type ProcessDefinition } from '@vue-tsx-pro/ui';

const contract: ProcessDefinition = {
  key: 'contract',
  name: '合同评审',
  version: 1,
  lanes: [
    { id: 'legal', name: '法务', group: 'legal' },
    { id: 'vendor', name: '供应商' },
    { id: 'sales', name: '商务', group: 'sales' },
    { id: 'board', name: '管理层', group: 'board' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '起草', lane: 'legal' },
    {
      id: 'legal',
      type: 'task',
      name: '法务审核',
      lane: 'legal',
      outcomes: [{ key: 'ok', label: '通过' }],
    },
    {
      id: 'vendors',
      type: 'task',
      name: '供应商确认',
      lane: 'vendor',
      multi: { participants: { var: 'vendors' }, complete: 'all' },
      outcomes: [
        { key: 'ok', label: '确认' },
        { key: 'object', label: '有异议', kind: 'escalate', veto: true, comment: 'required' },
      ],
    },
    {
      id: 'negotiate',
      type: 'task',
      name: '商务洽谈',
      lane: 'sales',
      offline: true,
      outcomes: [{ key: 'record', label: '回填结果' }],
    },
    {
      id: 'board',
      type: 'task',
      name: '管理层裁决',
      lane: 'board',
      outcomes: [{ key: 'decide', label: '裁决' }],
    },
    { id: 'signed', type: 'end', name: '签署', lane: 'sales' },
  ],
  edges: [
    { id: 'drafted', from: 'start', to: 'legal' },
    { id: 'reviewed', from: 'legal', to: 'vendors', outcome: 'ok' },
    { id: 'confirmed', from: 'vendors', to: 'negotiate', outcome: 'ok' },
    { id: 'object', from: 'vendors', to: 'board', outcome: 'object', kind: 'escalate' },
    { id: 'decided', from: 'board', to: 'negotiate', outcome: 'decide' },
    { id: 'recorded', from: 'negotiate', to: 'signed', outcome: 'record' },
  ],
};

const detail: Record<string, string> = {
  legal: '张律 · 10-18',
  vendors: '3 家 · 已确认 2',
  negotiate: '还剩 12 天',
};

export default _component(() => () => (
  <Card padding="sm">
    <FlowDiagram
      size="sm"
      fit
      definition={contract}
      nodeDetail={(node) => detail[node.id]}
      progress={processProgress({ status: 'active', active: ['vendors'] }, [
        { type: 'started', node: 'start', edge: 'drafted' },
        { type: 'completed', node: 'legal', edge: 'reviewed' },
      ])}
    />
  </Card>
));

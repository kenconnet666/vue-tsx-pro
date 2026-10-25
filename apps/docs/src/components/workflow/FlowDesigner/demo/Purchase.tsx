// 采购审批的流程设计：点节点在右边改处理人、时限、超时与提醒，随改随校验。
// “财务复核”故意没有处理人（财务泳道没有岗位收件箱）：点下面的问题选中它，把处理人改成“指定岗位收件箱”就能发布。
// 发布模拟成功，记下发布过的版本
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small, Tag, type ListboxOption } from '@vue-tsx-pro/ui';
import { FlowDesigner, type ProcessDefinition } from '@vue-tsx-pro/ui/workflow';

const groups: ListboxOption[] = [
  { value: 'finance', label: '财务部收件箱' },
  { value: 'leads', label: '部门负责人收件箱' },
  { value: 'purchase', label: '采购部收件箱' },
];

const users: ListboxOption[] = [
  { value: 'E1024', label: '周宁', description: '采购专员' },
  { value: 'E1031', label: '陆川', description: '采购经理' },
  { value: 'E4002', label: '韩笑', description: '财务经理' },
];

const purchase: ProcessDefinition = {
  key: 'purchase',
  name: '采购申请',
  version: 3,
  lanes: [
    { id: 'staff', name: '申请人' },
    { id: 'lead', name: '部门负责人', group: 'leads' },
    { id: 'finance', name: '财务' },
    { id: 'buyer', name: '采购', group: 'purchase' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '提交申请', lane: 'staff' },
    {
      id: 'lead',
      type: 'task',
      name: '部门审批',
      lane: 'lead',
      due: { workdays: 2 },
      overdue: { outcome: 'approve', remind: true },
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'back', label: '退回修改', kind: 'return', comment: 'required' },
      ],
    },
    {
      id: 'revise',
      type: 'task',
      name: '修改申请',
      lane: 'staff',
      assignee: { type: 'initiator' },
      outcomes: [{ key: 'resubmit', label: '重新提交' }],
    },
    { id: 'amount', type: 'exclusive', name: '金额', lane: 'lead' },
    {
      id: 'review',
      type: 'task',
      name: '财务复核',
      lane: 'finance',
      due: { workdays: 3 },
      outcomes: [
        { key: 'pass', label: '核对无误' },
        { key: 'reject', label: '不予采购', kind: 'reject', comment: 'required' },
      ],
    },
    {
      id: 'order',
      type: 'task',
      name: '下单',
      lane: 'buyer',
      due: { days: 5 },
      outcomes: [{ key: 'done', label: '已下单', attachments: 'required' }],
    },
    { id: 'done', type: 'end', name: '采购完成', lane: 'buyer', result: 'ordered' },
    { id: 'rejected', type: 'end', name: '不予采购', lane: 'finance', result: 'rejected' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'lead' },
    { id: 'approve', from: 'lead', to: 'amount', outcome: 'approve' },
    { id: 'back', from: 'lead', to: 'revise', outcome: 'back', kind: 'return' },
    { id: 'resubmit', from: 'revise', to: 'lead' },
    {
      id: 'large',
      from: 'amount',
      to: 'review',
      label: '≥ 5 万',
      when: { var: 'amount', op: 'gte', value: 50_000 },
    },
    { id: 'small', from: 'amount', to: 'order', label: '其余', default: true },
    { id: 'pass', from: 'review', to: 'order', outcome: 'pass' },
    { id: 'reject', from: 'review', to: 'rejected', outcome: 'reject' },
    { id: 'ordered', from: 'order', to: 'done', outcome: 'done' },
  ],
};

export default _component(() => {
  let draft = _state<ProcessDefinition>(purchase);
  let selected = _state<string | null>('lead');
  let published = _state<number[]>([]);

  async function publish(flow: ProcessDefinition) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    published = [...published, flow.version];
  }

  return () => (
    <Flex direction="column" gap="sm">
      <FlowDesigner
        _definition={draft}
        _selected={selected}
        groups={groups}
        users={users}
        onPublish={publish}
      />
      <Flex gap="xs" align="center" wrap>
        <Small tone="muted">发布过的版本：</Small>
        {published.length === 0 ? (
          <Small tone="muted">还没有</Small>
        ) : (
          published.map((version) => (
            <Tag key={version} size="sm">
              v{version}
            </Tag>
          ))
        )}
      </Flex>
    </Flex>
  );
});

// 一个人工节点的处理按钮：同意直接提交；退回要写意见；转交要选给谁（业务字段，fields 给出内容、validate 校验）；
// 提交是异步的，按钮显示加载中，结果用提示告诉用户
import { _component } from '@vue-tsx-pro/tsx';
import { Card, createToaster, Field, Flex, Select, Small, Toaster } from '@vue-tsx-pro/ui';
import { ApprovalActions, type ApprovalInput, type ProcessOutcome } from '@vue-tsx-pro/ui/workflow';

const outcomes: ProcessOutcome[] = [
  { key: 'approve', label: '同意', comment: 'optional' },
  { key: 'forward', label: '转交', fields: ['assignee'] },
  { key: 'back', label: '退回修改', kind: 'return', comment: 'required' },
  { key: 'reject', label: '不同意', kind: 'reject', comment: 'required', attachments: 'optional' },
];

export default _component(() => {
  const toaster = createToaster();
  let assignee = _state<string | null>(null);

  async function complete(input: ApprovalInput) {
    // 换成调用后端的“处理待办”接口
    await new Promise((resolve) => setTimeout(resolve, 600));
    const who = input.outcome === 'forward' ? `，转交给 ${assignee}` : '';
    toaster.show({
      title: `已处理：${outcomes.find((item) => item.key === input.outcome)!.label}${who}`,
      description: input.comment || undefined,
      tone: 'success',
    });
    assignee = null;
  }

  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Small tone="muted">采购申请 P-1024 · 部门审批 · 采购 3 台测试服务器，合计 4.8 万元</Small>
        <ApprovalActions
          node="部门审批"
          outcomes={outcomes}
          onComplete={complete}
          fields={() => (
            <Field label="转交给" required>
              <Select
                items={['陆川', '方圆', '韩笑']}
                _value={_bind(assignee)}
                placeholder="选一位同事"
              />
            </Field>
          )}
          validate={(outcome) => (outcome.key === 'forward' && !assignee ? '选一位同事' : null)}
        />
      </Flex>
      <Toaster controller={toaster} />
    </Card>
  );
});

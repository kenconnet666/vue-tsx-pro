import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Code, Flex, Result, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';

type Status = 'success' | 'danger' | 'warning' | 'info';

const results: Record<Status, { title: string; description: string; action: string }> = {
  success: {
    title: '提交成功',
    description: '审核结果会在 1 个工作日内通过邮件通知你。',
    action: '返回列表',
  },
  danger: {
    title: '支付失败',
    description: '银行卡余额不足，订单已保留 30 分钟。',
    action: '换一张卡',
  },
  warning: {
    title: '需要补充资料',
    description: '营业执照照片不清晰，请重新上传。',
    action: '去上传',
  },
  info: { title: '正在审核', description: '提交后通常 2 小时内完成审核。', action: '查看进度' },
};

export default _component(() => {
  let status = _state<Status>('success');
  // 换状态时重新挂载，图标重新画一遍
  let round = _state(0);
  return () => {
    const result = results[status];
    return (
      <Flex direction="column" gap="md">
        <ToggleGroup
          value={status}
          {...{
            'onUpdate:value': (next: Status) => {
              status = next;
              round++;
            },
          }}
          required
          size="sm"
          aria-label="结果状态"
        >
          <ToggleItem value="success">成功</ToggleItem>
          <ToggleItem value="danger">失败</ToggleItem>
          <ToggleItem value="warning">警告</ToggleItem>
          <ToggleItem value="info">信息</ToggleItem>
        </ToggleGroup>
        <Card>
          <Result
            key={round}
            status={status}
            title={result.title}
            description={result.description}
            action={
              <Flex gap="sm" justify="center">
                <Button size="sm">{result.action}</Button>
                <Button size="sm" variant="ghost">
                  帮助
                </Button>
              </Flex>
            }
          >
            <Code>status="{status}"</Code>
          </Result>
        </Card>
      </Flex>
    );
  };
});

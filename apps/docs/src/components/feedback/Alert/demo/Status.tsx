import { RefreshCw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Alert, Button, Flex } from '@vue-tsx-pro/ui';

export default _component(() => {
  let state = _state<'idle' | 'checking' | 'latest'>('idle');
  const check = () => {
    state = 'checking';
    setTimeout(() => (state = 'latest'), 1500);
  };
  return () => (
    <Flex direction="column" gap="lg">
      <Flex direction="column" gap="sm">
        <Flex>
          <Button
            variant="outline"
            tone="neutral"
            icon={RefreshCw}
            loading={state === 'checking'}
            onClick={check}
          >
            检查更新
          </Button>
        </Flex>
        {state !== 'idle' && (
          <Alert
            live="polite"
            loading={state === 'checking'}
            tone={state === 'checking' ? 'info' : 'success'}
            title={state === 'checking' ? '正在检查更新…' : '已是最新版本'}
          >
            {state === 'checking' ? '连接更新服务器' : '当前版本 2.4.0，发布于 10 月 18 日。'}
          </Alert>
        )}
      </Flex>
      <Flex direction="column" gap="sm">
        <Alert size="sm" tone="warning" title='size="sm"'>
          侧栏、表单字段旁的紧凑提示。
        </Alert>
        <Alert size="lg" tone="accent" title='size="lg"'>
          页面顶部的重要公告。
        </Alert>
      </Flex>
    </Flex>
  );
});

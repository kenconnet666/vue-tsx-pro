import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  Field,
  Flex,
  SlideVerify,
  Small,
  TextField,
  type SlideVerifyResult,
} from '@vue-tsx-pro/ui';

type Status = 'idle' | 'verifying' | 'success' | 'error';

export default _component(() => {
  let phone = _state('13800000000');
  let status = _state<Status>('idle');
  let detail = _state('');

  // 松手后把位置与轨迹发给服务端：这里假装 600ms 后返回，拖得太快（像脚本）就判失败
  const verify = (result: SlideVerifyResult) => {
    status = 'verifying';
    setTimeout(() => {
      const human = result.duration > 250 && result.trail.length > 5;
      status = human ? 'success' : 'error';
      detail = `用时 ${result.duration} ms，轨迹 ${result.trail.length} 个点`;
    }, 600);
  };

  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Field label="手机号">
          <TextField value={_bind(phone)} type="tel" prefix="+86" />
        </Field>
        <SlideVerify status={status} onRelease={verify} />
        <Flex align="center" justify="between" gap="md">
          <Small tone="muted">{detail || '把滑块拖到最右边'}</Small>
          {status === 'error' ? (
            <Button size="sm" variant="ghost" onClick={() => (status = 'idle')}>
              再试一次
            </Button>
          ) : (
            <Button size="sm" disabled={status !== 'success'}>
              发送验证码
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
});

// 短信登录：获取验证码后倒计时；填满 6 位自动校验，错了标红并清空重填
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Card, Field, Flex, OtpField, Small, TextField } from '@zerodep-dev/vue-tsx-pro-ui';
import { onScopeDispose } from 'vue';

export default _component(() => {
  let phone = _state('13800001111');
  let code = _state('');
  let countdown = _state(0);
  let error = _state('');
  let verifying = _state(false);
  let message = _state('');
  let timer: ReturnType<typeof setInterval> | undefined;
  onScopeDispose(() => clearInterval(timer));

  function send() {
    countdown = 60;
    message = '验证码已发送（试试 246810）';
    timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) clearInterval(timer);
    }, 1000);
  }

  // 假的校验接口：246810 是对的
  async function verify(value: string) {
    verifying = true;
    error = '';
    await new Promise((resolve) => setTimeout(resolve, 500));
    verifying = false;
    if (value === '246810') {
      message = '登录成功';
      return;
    }
    error = '验证码不对，请重新输入';
    code = '';
  }

  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Field label="手机号">
          <TextField _value={phone} type="tel" prefix="+86" />
        </Field>
        <Field label="短信验证码" error={error} description="6 位数字，5 分钟内有效">
          <Flex align="center" gap="md" wrap>
            <OtpField
              _value={code}
              onComplete={(value) => void verify(value)}
              disabled={verifying}
            />
            <Button variant="soft" disabled={countdown > 0} onClick={send}>
              {countdown > 0 ? `${countdown} 秒后重发` : '获取验证码'}
            </Button>
          </Flex>
        </Field>
        <Small tone={message === '登录成功' ? 'success' : 'muted'} aria-live="polite">
          {verifying ? '正在校验…' : message}
        </Small>
      </Flex>
    </Card>
  );
});

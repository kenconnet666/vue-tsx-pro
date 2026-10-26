import { LogIn, Mail, Smartphone } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <Button fullWidth size="lg" icon={LogIn}>
      登录
    </Button>
    <Small tone="muted" align="center">
      或者
    </Small>
    <Flex gap="sm">
      <Button fullWidth variant="surface" tone="neutral" icon={Smartphone}>
        手机验证码
      </Button>
      <Button fullWidth variant="surface" tone="neutral" icon={Mail}>
        邮箱验证码
      </Button>
    </Flex>
    <Button fullWidth variant="link" tone="neutral">
      忘记密码？
    </Button>
  </Flex>
));

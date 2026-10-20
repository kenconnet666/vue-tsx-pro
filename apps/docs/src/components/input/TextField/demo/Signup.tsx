import { AtSign, Globe, Mail, Phone } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Field, Flex, Grid, TextField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let email = _state('');
  let password = _state('');
  let handle = _state('');
  let phone = _state('');
  let site = _state('');
  return () => (
    <Card>
      <Flex direction="column" gap="lg">
        <Grid minItemWidth="14rem" gap="lg">
          <Field label="邮箱" required>
            <TextField
              value={_bind(email)}
              type="email"
              icon={Mail}
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="密码"
            required
            description="至少 8 位，包含字母和数字"
            error={
              password && password.length < 8 ? `还差 ${8 - password.length} 位` : undefined
            }
          >
            <TextField value={_bind(password)} type="password" />
          </Field>
          <Field label="用户名">
            <TextField value={_bind(handle)} icon={AtSign} maxlength={20} showCount />
          </Field>
          <Field label="手机号">
            <TextField value={_bind(phone)} type="tel" icon={Phone} prefix="+86" />
          </Field>
        </Grid>
        <Field label="个人站点">
          <TextField value={_bind(site)} icon={Globe} prefix="https://" suffix=".example.com" />
        </Field>
        <Flex justify="end">
          <Button>注册</Button>
        </Flex>
      </Flex>
    </Card>
  );
});

// 支付密码（遮罩）、恢复码（字母数字、分组）、尺寸与状态
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Flex, OtpField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let pin = _state('');
  let recovery = _state('');
  return () => (
    <Flex direction="column" gap="lg">
      <Field
        label="支付密码"
        description={pin.length === 6 ? '已输入 6 位' : '6 位数字，显示成圆点'}
      >
        <OtpField value={_bind(pin)} mask />
      </Field>
      <Field
        label="恢复码"
        description={
          <>
            字母与数字，转成大写：<Code>{recovery || '（空）'}</Code>
          </>
        }
      >
        <OtpField value={_bind(recovery)} length={8} type="alphanumeric" groups={[4, 4]} />
      </Field>
      <Flex gap="lg" wrap>
        <Field label='size="sm"'>
          <OtpField value="1234" length={4} size="sm" />
        </Field>
        <Field label="出错" error="验证码已过期">
          <OtpField value="4821" length={4} />
        </Field>
        <Field label="不可用" disabled>
          <OtpField value="99" length={4} />
        </Field>
      </Flex>
    </Flex>
  );
});

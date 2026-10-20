// 限时抢购：自定义成一格一格的数字；待支付的订单：默认的“时:分:秒”；验证码：60 秒后才能重发，到点时 onEnd 恢复按钮
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  Card,
  Countdown,
  Field,
  Flex,
  Grid,
  Small,
  Strong,
  Text,
  TextField,
} from '@vue-tsx-pro/ui';

const styles = stylex.create({
  digits: { display: 'flex', alignItems: 'center', gap: '_xs' },
  digit: {
    minWidth: '2.25em',
    paddingBlock: '_xs',
    borderRadius: '_sm',
    backgroundColor: '_accent',
    color: '_accentContrast',
    fontSize: '_lg',
    fontWeight: '_semibold',
    textAlign: 'center',
  },
});

const pad = (value: number) => String(value).padStart(2, '0');

export default _component(() => {
  // 演示数据：抢购在页面打开的 27 小时后开始，订单 15 分钟内不付就取消
  const saleStartsAt = new Date(Date.now() + (27 * 60 + 15) * 60_000);
  const orderExpiresAt = new Date(Date.now() + 15 * 60_000);
  let resendAt = _state<Date | null>(null);
  const send = () => (resendAt = new Date(Date.now() + 60_000));

  return () => (
    <Grid minItemWidth="14rem" gap="md">
      <Card padding="md">
        <Flex direction="column" gap="sm">
          <Small tone="muted">双十一抢购距开始</Small>
          <Countdown to={saleStartsAt} aria-label="距抢购开始">
            {({ days, hours, minutes, seconds }) => (
              <span {...stylex.attrs(styles.digits)}>
                {[days * 24 + hours, minutes, seconds].map((value, index) => [
                  index > 0 && <Strong key={`colon-${index}`}>:</Strong>,
                  <span key={index} {...stylex.attrs(styles.digit)}>
                    {pad(value)}
                  </span>,
                ])}
              </span>
            )}
          </Countdown>
        </Flex>
      </Card>
      <Card padding="md">
        <Flex direction="column" gap="sm">
          <Small tone="muted">订单待支付，超时自动取消</Small>
          <Flex align="center" justify="between" gap="sm">
            <Text size="lg" weight="semibold">
              <Countdown to={orderExpiresAt} />
            </Text>
            <Button size="sm">去支付</Button>
          </Flex>
        </Flex>
      </Card>
      <Card padding="md">
        <Flex align="end" gap="sm">
          <Field label="手机号">
            <TextField placeholder="138 0000 0000" inputmode="tel" />
          </Field>
          <Button variant="soft" disabled={resendAt != null} onClick={send}>
            {resendAt ? (
              <>
                <Countdown to={resendAt} onEnd={() => (resendAt = null)}>
                  {({ total }) => Math.ceil(total / 1000)}
                </Countdown>{' '}
                秒后重发
              </>
            ) : (
              '发送验证码'
            )}
          </Button>
        </Flex>
      </Card>
    </Grid>
  );
});

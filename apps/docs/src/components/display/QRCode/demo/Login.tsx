// 扫码登录：取票据时加载中，60 秒后过期、点刷新重新取；手机扫到后显示“已扫描”
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Card,
  Countdown,
  Flex,
  QRCode,
  Small,
  Text,
  type QRCodeStatus,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onScopeDispose } from 'vue';

const LIFETIME = 60_000;

export default _component(() => {
  let status = _state<QRCodeStatus>('loading');
  let ticket = _state('');
  let expiresAt = _state(new Date());
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** 假的票据接口：600 ms 后给一个新票据，60 秒后过期 */
  function renew() {
    clearTimeout(timer);
    status = 'loading';
    timer = setTimeout(() => {
      ticket = `https://zerodep.dev/login?ticket=${Math.random().toString(36).slice(2, 10)}`;
      expiresAt = new Date(Date.now() + LIFETIME);
      status = 'active';
    }, 600);
  }
  renew();
  onScopeDispose(() => clearTimeout(timer));

  return () => (
    <Card padding="lg">
      <Flex direction="column" align="center" gap="sm">
        <Text weight="semibold">扫码登录</Text>
        <QRCode value={ticket} status={status} onRefresh={renew} size="11em" />
        <Small tone="muted">
          {status === 'active' ? (
            <Countdown to={expiresAt} onEnd={() => (status = 'expired')}>
              {({ minutes, seconds }) => `${minutes * 60 + seconds} 秒后过期`}
            </Countdown>
          ) : (
            '打开手机 App，扫一扫'
          )}
        </Small>
        <Flex gap="xs">
          <Button
            size="sm"
            variant="ghost"
            disabled={status !== 'active'}
            onClick={() => (status = 'scanned')}
          >
            模拟扫码
          </Button>
          <Button size="sm" variant="ghost" onClick={() => (status = 'expired')}>
            立即过期
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
});

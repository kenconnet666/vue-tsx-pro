import { Wifi, WifiOff } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, createToaster, Flex, Toaster } from '@vue-tsx-pro/ui';

const toaster = createToaster();

export default _component(() => {
  let offline = _state<string | null>(null);

  const reconnect = () => {
    if (!offline) return;
    // 同一条通知换成成功：计时按新的 duration 重新开始
    toaster.update(offline, {
      tone: 'success',
      icon: Wifi,
      title: '已重新连接',
      description: '离线期间的改动已同步。',
      duration: 3000,
      closable: true,
      action: undefined,
    });
    offline = null;
  };

  const disconnect = () => {
    if (offline) return;
    offline = toaster.show({
      tone: 'warning',
      icon: WifiOff,
      title: '网络已断开',
      description: '改动先保存在本机，恢复连接后自动同步。',
      // 问题没解决前一直显示，也不能手动关掉
      duration: Infinity,
      closable: false,
      action: (
        <Button size="sm" variant="soft" tone="warning" onClick={reconnect}>
          重试
        </Button>
      ),
    });
  };

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="sm" wrap>
        <Button variant="outline" tone="neutral" icon={WifiOff} onClick={disconnect}>
          模拟断网
        </Button>
        <Button
          variant="outline"
          tone="neutral"
          icon={Wifi}
          disabled={!offline}
          onClick={reconnect}
        >
          恢复连接
        </Button>
      </Flex>
      <Toaster controller={toaster} placement="bottom-start" />
    </Flex>
  );
});

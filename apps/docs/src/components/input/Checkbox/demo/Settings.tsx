import { Moon, Sun } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, Icon, Separator, Small, Switch, Text } from '@zerodep-dev/vue-tsx-pro-ui';
import type { VNodeChild } from 'vue';

export default _component(() => {
  let notify = _state(true);
  let digest = _state(false);
  let dark = _state(true);
  let syncing = _state(false);
  let sync = _state(false);

  // 切换要等接口：loading 时滑块里转圈、点击无效，接口回来再写回
  const toggleSync = (next: boolean) => {
    syncing = true;
    setTimeout(() => {
      sync = next;
      syncing = false;
    }, 1200);
  };

  const row = (title: string, description: string, control: VNodeChild) => (
    <Flex align="center" justify="between" gap="lg">
      <Flex direction="column" grow>
        <Text weight="medium">{title}</Text>
        <Small tone="muted">{description}</Small>
      </Flex>
      {control}
    </Flex>
  );

  return () => (
    <Card>
      <Flex direction="column" gap="md">
        {row('接收通知', '订单状态变化时推送', <Switch _checked={notify} aria-label="接收通知" />)}
        <Separator />
        {row(
          '每周摘要',
          '每周一早上发送上周数据',
          <Switch _checked={digest} disabled={!notify} aria-label="每周摘要" />,
        )}
        <Separator />
        {row(
          '暗色模式',
          '轨道里可以放图标或文字',
          <Switch
            _checked={dark}
            checkedContent={<Icon icon={Moon} />}
            uncheckedContent={<Icon icon={Sun} />}
            size="lg"
            aria-label="暗色模式"
          />,
        )}
        <Separator />
        {row(
          '云端同步',
          syncing ? '正在保存…' : '在所有设备上保持一致',
          <Switch
            _checked={sync}
            onUpdate:_checked={toggleSync}
            loading={syncing}
            tone="success"
            aria-label="云端同步"
          />,
        )}
      </Flex>
    </Card>
  );
});

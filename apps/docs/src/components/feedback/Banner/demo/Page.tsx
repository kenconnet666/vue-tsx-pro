// 页面顶部的横幅：维护公告（实底、最醒目）、试用到期（可关闭，关掉后记住）、只读模式
import { Lock, Wrench } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Banner, Button, Card, Flex, Link, Small, Text } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let trialClosed = _state(false);
  let maintenanceClosed = _state(false);
  return () => (
    <Card padding="none">
      {!maintenanceClosed && (
        <Banner
          variant="solid"
          tone="warning"
          icon={Wrench}
          title="系统维护"
          // 实底上的链接跟随横幅的文字颜色，对比度才够
          action={
            <Link href="#maintenance" tone="inherit" underline="always">
              查看公告
            </Link>
          }
          onClose={() => (maintenanceClosed = true)}
        >
          今晚 22:00–23:00 暂停服务，请提前保存草稿
        </Banner>
      )}
      {!trialClosed && (
        <Banner
          tone="accent"
          action={
            <Button size="xs" variant="solid">
              升级到正式版
            </Button>
          }
          onClose={() => (trialClosed = true)}
        >
          试用还剩 3 天，到期后项目将变为只读
        </Banner>
      )}
      <Banner tone="neutral" icon={Lock} size="sm">
        当前项目已归档，只能查看
      </Banner>
      <Flex direction="column" gap="xs" style={{ padding: '1em 1.25em' }}>
        <Text weight="semibold">项目台账</Text>
        <Small tone="muted">
          横幅占满宽度、一行说完，放在页面最上方；关掉的写进本地存储，下次不再出现。
        </Small>
        {(trialClosed || maintenanceClosed) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              trialClosed = false;
              maintenanceClosed = false;
            }}
          >
            重新显示关掉的横幅
          </Button>
        )}
      </Flex>
    </Card>
  );
});

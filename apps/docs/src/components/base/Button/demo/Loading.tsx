import { RefreshCw, Send, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Flex, IconButton, Small } from '@zerodep-dev/vue-tsx-pro-ui';

/** 模拟一次请求：ms 毫秒后完成 */
const request = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default _component(() => {
  let saving = _state(false);
  let submitting = _state(false);
  let deleting = _state(false);
  let refreshing = _state(false);
  let quick = _state(false);

  async function run(set: (loading: boolean) => void, ms: number) {
    set(true);
    await request(ms);
    set(false);
  }

  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="sm" wrap align="center">
        <Button loading={saving} onClick={() => void run((v) => (saving = v), 1500)}>
          保存
        </Button>
        <Button
          variant="outline"
          icon={Send}
          loading={submitting}
          onClick={() => void run((v) => (submitting = v), 2000)}
        >
          提交审核
        </Button>
        <Button
          variant="soft"
          tone="danger"
          icon={Trash2}
          loading={deleting}
          onClick={() => void run((v) => (deleting = v), 1200)}
        >
          删除
        </Button>
        <IconButton
          variant="surface"
          tone="neutral"
          icon={RefreshCw}
          aria-label="刷新"
          loading={refreshing}
          onClick={() => void run((v) => (refreshing = v), 1000)}
        />
      </Flex>
      <Flex gap="sm" wrap align="center">
        <Button
          variant="surface"
          tone="neutral"
          loading={quick}
          onClick={() => void run((v) => (quick = v), 100)}
        >
          很快完成（0.1 秒）
        </Button>
        <Small tone="muted">不到 0.2 秒的操作不换成加载指示，按钮不会闪一下</Small>
      </Flex>
    </Flex>
  );
});

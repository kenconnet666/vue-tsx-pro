// 加载中（loading：图标换成转圈，点击无效）；不可用但可聚焦（focusableWhenDisabled，配 Tooltip 说明原因）；
// CopyButton 的 value 给异步函数时点击才生成（等待时转圈），timeout 是对勾停留的时长，onCopied 拿到结果
import { RefreshCw, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CopyButton, Flex, IconButton, Small, Tooltip } from '@zerodep-dev/vue-tsx-pro-ui';

/** 模拟向服务端申请一条一次性的邀请链接 */
const createInvite = () =>
  new Promise<string>((resolve) =>
    setTimeout(
      () => resolve(`https://example.com/invite/${Math.random().toString(36).slice(2, 10)}`),
      800,
    ),
  );

export default _component(() => {
  let refreshing = _state(false);
  let copies = _state(0);
  let updated = _state(new Date());

  function refresh() {
    refreshing = true;
    setTimeout(() => {
      refreshing = false;
      updated = new Date();
    }, 1200);
  }

  return () => (
    <Flex direction="column" gap="md">
      <Flex align="center" gap="sm">
        <IconButton
          icon={RefreshCw}
          variant="surface"
          loading={refreshing}
          aria-label="刷新"
          onClick={refresh}
        />
        <Small tone="muted">更新于 {updated.toLocaleTimeString()}</Small>
      </Flex>
      <Flex align="center" gap="sm">
        <Tooltip
          trigger={(props) => (
            <IconButton
              {...props}
              icon={Trash2}
              tone="danger"
              disabled
              focusableWhenDisabled
              aria-label="删除项目"
            />
          )}
        >
          只有项目所有者可以删除
        </Tooltip>
        <Small tone="muted">不可用，但能聚焦、悬停看原因</Small>
      </Flex>
      <Flex align="center" gap="sm">
        <Code>邀请链接（点击时生成）</Code>
        <CopyButton
          value={createInvite}
          variant="surface"
          timeout={3000}
          aria-label="复制邀请链接"
          onCopied={(success) => success && copies++}
        />
        <Small tone="muted">已复制 {copies} 次</Small>
      </Flex>
    </Flex>
  );
});

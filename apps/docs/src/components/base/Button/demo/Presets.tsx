// 预设按钮：CloseButton（关闭提示卡片）、CopyButton（复制固定的值，或点击时才生成的值）。
// ClearButton 是输入框里的清空按钮，TextField、Select 的 clearable 用的就是它，自己做输入框时再单独用
import { KeyRound, Link } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  CloseButton,
  Code,
  CopyButton,
  Flex,
  Icon,
  Small,
  Strong,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

/** 模拟向服务端申请一条一次性的邀请链接 */
const createInvite = () =>
  new Promise<string>((resolve) =>
    setTimeout(
      () => resolve(`https://example.com/invite/${Math.random().toString(36).slice(2, 10)}`),
      800,
    ),
  );

export default _component(() => {
  let dismissed = _state(false);
  let copies = _state(0);
  const apiKey = 'sk-live-3f9a7c21e8b44d0a';

  return () => (
    <Flex direction="column" gap="md">
      {dismissed ? (
        <Small tone="muted">提示已关闭（刷新示例可以恢复）</Small>
      ) : (
        <Card>
          <Flex align="start" justify="between" gap="sm">
            <Flex direction="column" gap="xs">
              <Strong>新版本已发布</Strong>
              <Text size="sm" tone="muted">
                右上角的 CloseButton 读屏念语言包里的“关闭”。
              </Text>
            </Flex>
            <CloseButton onClick={() => (dismissed = true)} />
          </Flex>
        </Card>
      )}
      <Card>
        <Flex direction="column" gap="sm">
          <Flex align="center" gap="sm">
            <Icon icon={KeyRound} tone="muted" />
            <Code>{apiKey}</Code>
            <CopyButton value={apiKey} aria-label="复制 API 密钥" />
          </Flex>
          <Flex align="center" gap="sm">
            <Icon icon={Link} tone="muted" />
            <Text size="sm">邀请链接（点击时才生成）</Text>
            <CopyButton
              value={createInvite}
              timeout={3000}
              aria-label="复制邀请链接"
              onCopied={(success) => success && copies++}
            />
            <Small tone="muted">已复制 {copies} 次</Small>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
});

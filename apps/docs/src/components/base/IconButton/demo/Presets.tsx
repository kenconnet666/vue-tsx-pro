import { KeyRound } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  ClearButton,
  CloseButton,
  Code,
  CopyButton,
  Flex,
  Icon,
  Strong,
  Text,
  TextField,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  let keyword = _state('vue-tsx-pro');
  let dismissed = _state(false);
  const apiKey = 'sk-live-3f9a7c21e8b44d0a';

  return () => (
    <Flex direction="column" gap="md">
      {dismissed ? (
        <Text size="sm" tone="muted">
          提示已关闭（刷新示例可以恢复）
        </Text>
      ) : (
        <Card>
          <Flex align="start" justify="between" gap="sm">
            <Flex direction="column" gap="xs">
              <Strong>新版本已发布</Strong>
              <Text size="sm" tone="muted">
                CloseButton 的读屏名称取语言包的“关闭”。
              </Text>
            </Flex>
            <CloseButton onClick={() => (dismissed = true)} />
          </Flex>
        </Card>
      )}
      <Flex align="center" gap="sm">
        <TextField _value={keyword} aria-label="搜索关键词" />
        <ClearButton disabled={!keyword} onClick={() => (keyword = '')} />
      </Flex>
      <Card variant="surface">
        <Flex align="center" gap="sm">
          <Icon icon={KeyRound} />
          <Code>{apiKey}</Code>
          <CopyButton value={apiKey} aria-label="复制 API 密钥" />
        </Flex>
      </Card>
    </Flex>
  );
});

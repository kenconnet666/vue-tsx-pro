import { BookOpen, Mail, Rss, Video } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, IconLinkButton, Text } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Flex align="center" justify="between" gap="md" wrap>
    <Text size="sm" tone="muted">
      © 2026 vue-tsx-pro
    </Text>
    <Flex gap="xs">
      <IconLinkButton href="/guide/getting-started" icon={BookOpen} aria-label="文档" />
      <IconLinkButton href="https://example.com/feed.xml" external icon={Rss} aria-label="订阅" />
      <IconLinkButton href="https://youtube.com" external icon={Video} aria-label="视频教程" />
      <IconLinkButton href="mailto:hi@example.com" icon={Mail} aria-label="发邮件" />
    </Flex>
  </Flex>
));

// 链接按钮：外观同 Button 的 a 元素；只有图标的链接用 IconLinkButton（页脚的文档、订阅、联系）
import { ArrowRight, BookOpen, Mail, Plus, Rss, Video } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Flex,
  IconLinkButton,
  LinkButton,
  Paragraph,
  Separator,
  Small,
  Strong,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Card>
    <Flex direction="column" gap="md">
      <Flex direction="column" gap="xs">
        <Strong>还没有订单</Strong>
        <Paragraph size="sm" tone="muted">
          新建第一张订单，或者先看看怎么批量导入。
        </Paragraph>
      </Flex>
      <Flex gap="sm" wrap>
        <LinkButton href="/components/button" icon={Plus}>
          新建订单
        </LinkButton>
        <LinkButton href="/guide/getting-started" variant="soft" icon={BookOpen}>
          导入指南
        </LinkButton>
        <LinkButton href="https://vuejs.org" external variant="ghost" iconEnd={ArrowRight}>
          Vue 文档
        </LinkButton>
      </Flex>
      <Separator />
      <Flex align="center" justify="between" gap="md" wrap>
        <Small tone="muted">© 2026 vue-tsx-pro</Small>
        <Flex gap="xs">
          <IconLinkButton href="/guide/getting-started" icon={BookOpen} aria-label="文档" />
          <IconLinkButton
            href="https://example.com/feed.xml"
            external
            icon={Rss}
            aria-label="订阅"
          />
          <IconLinkButton href="https://youtube.com" external icon={Video} aria-label="视频教程" />
          <IconLinkButton href="mailto:hi@example.com" icon={Mail} aria-label="发邮件" />
        </Flex>
      </Flex>
    </Flex>
  </Card>
));

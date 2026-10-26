import { ArrowRight, BookOpen, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, LinkButton, Paragraph, Strong } from '@zerodep-dev/vue-tsx-pro-ui';

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
    </Flex>
  </Card>
));

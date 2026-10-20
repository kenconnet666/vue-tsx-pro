import { Code2, Database, Globe, Palette, Smartphone } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Tag, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        技能
      </Text>
      <Tag icon={Code2}>TypeScript</Tag>
      <Tag icon={Palette} tone="accent">
        设计系统
      </Tag>
      <Tag icon={Database} tone="info">
        PostgreSQL
      </Tag>
      <Tag icon={Smartphone} tone="success">
        移动端
      </Tag>
      <Tag icon={Globe} tone="warning">
        国际化
      </Tag>
    </Flex>
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        样式
      </Text>
      <Tag variant="solid" tone="accent">
        solid
      </Tag>
      <Tag variant="soft" tone="accent">
        soft
      </Tag>
      <Tag variant="surface" tone="accent">
        surface
      </Tag>
      <Tag variant="outline" tone="accent">
        outline
      </Tag>
      <Tag radius="full" tone="neutral">
        胶囊形
      </Tag>
      <Tag size="sm" tone="neutral" variant="surface">
        size=sm
      </Tag>
    </Flex>
  </Flex>
));

import { _component } from '@vue-tsx-pro/tsx';
import {
  Avatar,
  Card,
  Flex,
  Paragraph,
  SHIMMER_STAGGER,
  Skeleton,
  Switch,
  Text,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  let loading = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Switch _checked={loading}>加载中</Switch>
      <Card style={{ maxWidth: '24rem' }}>
        <Flex gap="md" align="center">
          <Skeleton loading={loading} variant="circle">
            <Avatar name="Ada Lovelace" />
          </Skeleton>
          <Flex direction="column" gap="xs">
            <Skeleton loading={loading}>
              <Text weight="semibold">Ada Lovelace</Text>
            </Skeleton>
            <Skeleton loading={loading} delay={SHIMMER_STAGGER}>
              <Text size="sm" tone="muted">
                分析机程序员 · 伦敦
              </Text>
            </Skeleton>
          </Flex>
        </Flex>
        <div style={{ marginBlockStart: '1em' }}>
          <Skeleton loading={loading} delay={2 * SHIMMER_STAGGER}>
            <Paragraph>
              为巴贝奇的分析机写下了计算伯努利数的算法，被认为是世界上第一段程序。
            </Paragraph>
          </Skeleton>
        </div>
      </Card>
    </Flex>
  );
});

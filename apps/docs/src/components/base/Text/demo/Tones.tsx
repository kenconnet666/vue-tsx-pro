import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, Grid, Paragraph, Strong, Text } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Grid minItemWidth="16em" gap="md">
    <Card>
      <Flex direction="column" gap="xs">
        <Strong>部署完成</Strong>
        <Text size="sm" tone="muted">
          production · 3 分钟前 · 由 @lin 触发
        </Text>
        <Text size="sm" tone="success">
          全部 128 项检查通过
        </Text>
      </Flex>
    </Card>
    <Card>
      <Flex direction="column" gap="xs">
        <Strong>账单即将到期</Strong>
        <Text size="sm" tone="warning">
          还有 2 天自动续费 ¥299
        </Text>
        <Text size="sm" tone="accent">
          查看账单详情
        </Text>
      </Flex>
    </Card>
    <Card>
      <Flex direction="column" gap="xs">
        <Strong>同步失败</Strong>
        <Text size="sm" tone="danger">
          网络连接中断，已暂停上传
        </Text>
        <Paragraph size="sm" tone="info">
          恢复联网后会自动重试，不用重新选择文件。
        </Paragraph>
      </Flex>
    </Card>
  </Grid>
));

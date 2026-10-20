import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Grid, H1, H2, H3, H4, H5, H6, Paragraph, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Grid minItemWidth="20em" gap="xl">
    <Flex direction="column" gap="sm">
      <H1>H1 页面标题</H1>
      <H2>H2 一节</H2>
      <H3>H3 小节</H3>
      <H4>H4 段落标题</H4>
      <H5>H5 卡片标题</H5>
      <H6>H6 最小的标题</H6>
    </Flex>
    <Flex direction="column" gap="sm">
      {/* 文档结构与视觉层级分开：级别要连续，字号用 size 改 */}
      <H2 size="lg">账户设置</H2>
      <Paragraph tone="muted">H2 但用 lg 字号：放在卡片里不至于太大。</Paragraph>
      <H3 id="text-security" anchor>
        安全与登录
      </H3>
      <Paragraph tone="muted">
        <Text weight="medium">anchor</Text>{' '}
        在标题末尾加指向本节的链接，悬停或聚焦时出现，方便复制分享。
      </Paragraph>
      <H3 tone="danger">危险操作</H3>
      <Paragraph tone="muted">注销账户后数据不可恢复。</Paragraph>
    </Flex>
  </Grid>
));

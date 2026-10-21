// grow：在父级的 flex 里占满剩余空间、可以收缩（里面的长文字才能截断）；inline：行内的 flex；
// Grid 的 rowGap / columnGap 分别覆盖 gap
import { CircleCheck, FileText } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Badge, Card, Flex, Grid, Icon, Small, Strong, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Card padding="sm">
      <Flex align="center" gap="sm">
        <Avatar name="林小满" size="sm" />
        <Flex direction="column" grow>
          <Strong truncate>
            林小满上传了《第三季度经营分析报告（终版，含附录与数据来源说明）》
          </Strong>
          <Small tone="muted" truncate>
            设计中心 · 10 分钟前 · 来自网页端
          </Small>
        </Flex>
        <Badge tone="success">已审核</Badge>
      </Flex>
    </Card>
    <Text>
      状态：
      <Flex inline align="center" gap="xs">
        <Icon icon={CircleCheck} tone="success" />
        已通过
      </Flex>
      ，下一步由财务确认。
    </Text>
    <Grid columns={3} rowGap="lg" columnGap="xs">
      {['合同', '报价单', '发票', '验收单', '对账单', '回款记录'].map((name) => (
        <Card key={name} padding="sm">
          <Flex align="center" gap="xs">
            <Icon icon={FileText} tone="muted" />
            <Small>{name}</Small>
          </Flex>
        </Card>
      ))}
    </Grid>
  </Flex>
));

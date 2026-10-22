// 页头结束边的操作：extra 和 header 排在一行，放不下时换行
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Card, Flex, Icon, Link, Small } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Card
      variant="outline"
      padding="md"
      header="超时最久的项目"
      extra={
        <Link href="#">
          全部超时
          <Icon icon={ArrowUpRight} />
        </Link>
      }
    >
      <Small tone="muted">DJ-2026-ZT-76 液压管路卡箍设计优化 · 超时 15 天</Small>
    </Card>
    <Card
      variant="outline"
      padding="md"
      header="关闭三材料"
      extra={<Badge tone="warning">缺 2 项</Badge>}
    >
      <Small tone="muted">验证窗结论、收益认定意见、商务谈定记录，缺一不得关闭</Small>
    </Card>
  </Flex>
));

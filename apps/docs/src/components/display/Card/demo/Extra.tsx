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
      <Small tone="muted">PO-2026-0276 线缆收纳夹改版 · 超时 15 天</Small>
    </Card>
    <Card
      variant="outline"
      padding="md"
      header="结项材料"
      extra={<Badge tone="warning">缺 2 项</Badge>}
    >
      <Small tone="muted">验收报告、财务复核意见、合同签订记录，缺一不能结项</Small>
    </Card>
  </Flex>
));

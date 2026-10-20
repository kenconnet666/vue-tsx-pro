import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Card, CopyButton, Descriptions, Flex, Link } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Card>
    <Descriptions
      title="订单信息"
      columns={3}
      items={[
        {
          label: '订单号',
          value: (
            <Flex align="center" gap="xs">
              A-10234 <CopyButton value="A-10234" size="xs" aria-label="复制订单号" />
            </Flex>
          ),
        },
        {
          label: '状态',
          value: (
            <Badge tone="success" radius="full">
              已发货
            </Badge>
          ),
        },
        { label: '下单时间', value: '2026-10-18 14:32' },
        { label: '收货人', value: '林小满' },
        { label: '电话', value: '138****0021' },
        { label: '物流', value: <Link href="/components/descriptions">SF1234567890</Link> },
        { label: '收货地址', value: '上海市徐汇区漕溪北路 88 号 12 楼 1203 室', span: 3 },
      ]}
    />
  </Card>
));

import { MoreHorizontal, Truck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Flex,
  H3,
  IconButton,
  Small,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Card
    header={
      <Flex align="center" justify="between" gap="sm">
        <Flex align="center" gap="sm">
          <H3 size="md">订单 #10234</H3>
          <Badge tone="success" radius="full">
            已发货
          </Badge>
        </Flex>
        <IconButton icon={MoreHorizontal} aria-label="更多操作" />
      </Flex>
    }
    footer={
      <Flex align="center" justify="between" gap="sm">
        <Small tone="muted">下单于 10 月 18 日 14:32</Small>
        <Flex gap="sm">
          <Button size="sm" variant="ghost">
            申请售后
          </Button>
          <Button size="sm" icon={Truck}>
            查看物流
          </Button>
        </Flex>
      </Flex>
    }
  >
    <Flex direction="column" gap="md">
      <Descriptions
        columns={2}
        items={[
          { label: '收货人', value: '林小满 138****0021' },
          { label: '配送方式', value: '顺丰次日达' },
          { label: '收货地址', value: '上海市徐汇区漕溪北路 88 号 12 楼', span: 2 },
        ]}
      />
      <Flex align="center" justify="between">
        <Text tone="muted">实付</Text>
        <Text size="lg" weight="bold">
          ¥1,280.00
        </Text>
      </Flex>
    </Flex>
  </Card>
));

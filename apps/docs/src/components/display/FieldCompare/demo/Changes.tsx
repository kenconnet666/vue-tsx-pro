// 编辑前后：layout="list" 一行一个字段，只列改了的——原值划掉、箭头、新值，数值字段跟着变化量。
// 放在保存前的确认、审批意见、通知这类地方；没有原记录（新建）时只列新值，点“还原”后什么都没改，显示“没有改动”
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  createStatusMap,
  FieldCompare,
  Flex,
  Grid,
  H3,
  NumberField,
  Field,
  Select,
  TextField,
  type CompareField,
} from '@vue-tsx-pro/ui';

interface Order {
  customer: string;
  quantity: number;
  discount: number;
  amount: number;
  delivery: string;
  priority: string;
}

const priorities = createStatusMap({
  normal: { label: '普通', tone: 'neutral' },
  urgent: { label: '加急', tone: 'warning' },
});

const fields: CompareField<Order>[] = [
  { key: 'customer', header: '客户' },
  { key: 'quantity', header: '数量', type: 'number' },
  { key: 'discount', header: '折扣', type: 'percent' },
  { key: 'amount', header: '金额', type: 'currency' },
  { key: 'delivery', header: '交期', type: 'date' },
  { key: 'priority', header: '优先级', statuses: priorities },
];

const saved: Order = {
  customer: '远航物流',
  quantity: 120,
  discount: 0.05,
  amount: 22_800,
  delivery: '2026-11-08',
  priority: 'normal',
};

export default _component(() => {
  // 金额跟着数量与折扣算：单价 200
  const withAmount = (order: Order): Order => ({
    ...order,
    amount: Math.round(order.quantity * 200 * (1 - order.discount)),
  });
  // 已经改了几处：数量、折扣（金额跟着变）与优先级
  let draft = _state<Order>(
    withAmount({ ...saved, quantity: 150, discount: 0.08, priority: 'urgent' }),
  );
  return () => (
    <Grid minItemWidth="20em" gap="lg">
      <Card>
        <Flex direction="column" gap="sm">
          <H3 size="md">编辑订单 SO-1024</H3>
          <Field label="客户">
            <TextField _value={_bind(draft.customer)} />
          </Field>
          <Grid columns={2} gap="sm">
            <Field label="数量">
              <NumberField
                _value={draft.quantity}
                {...{
                  'onUpdate:_value': (quantity: number | null) =>
                    (draft = withAmount({ ...draft, quantity: quantity ?? 0 })),
                }}
                min={0}
              />
            </Field>
            <Field label="折扣">
              <NumberField
                _value={draft.discount}
                {...{
                  'onUpdate:_value': (discount: number | null) =>
                    (draft = withAmount({ ...draft, discount: discount ?? 0 })),
                }}
                min={0}
                max={0.5}
                step={0.01}
                format={{ style: 'percent' }}
              />
            </Field>
          </Grid>
          <Field label="优先级">
            <Select _value={_bind(draft.priority)} items={priorities.options()} />
          </Field>
          <Flex justify="end">
            <Button variant="surface" onClick={() => (draft = { ...saved })}>
              还原
            </Button>
          </Flex>
        </Flex>
      </Card>
      <Flex direction="column" gap="lg">
        <Card>
          <Flex direction="column" gap="sm">
            <H3 size="md">保存前确认</H3>
            <FieldCompare fields={fields} before={saved} after={draft} layout="list" />
          </Flex>
        </Card>
        <Card>
          <Flex direction="column" gap="sm">
            <H3 size="md">新建的订单</H3>
            <FieldCompare
              fields={fields}
              before={null}
              after={{ ...saved, customer: '北辰电子', priority: 'urgent' }}
              layout="list"
            />
          </Flex>
        </Card>
      </Flex>
    </Grid>
  );
});

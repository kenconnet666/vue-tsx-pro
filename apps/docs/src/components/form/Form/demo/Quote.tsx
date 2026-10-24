import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  Card,
  decimalSchema,
  Flex,
  Form,
  IconButton,
  NumberField,
  Small,
  Strong,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import * as z from 'zod';

// 金额用 Decimal：0.1 + 0.2 也精确；decimalSchema 的范围、小数位数同时交给 NumberField（min、step）
const schema = z.object({
  customer: z.string().min(1, '请填写客户'),
  items: z
    .array(
      z.object({
        name: z.string().min(1, '请填写品名'),
        price: decimalSchema({ min: 0, scale: 2 }),
        quantity: z.number().int().min(1, '至少 1 件'),
      }),
    )
    .min(1, '至少一项'),
});

const styles = css.create({
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) 6rem auto',
    gap: '_sm',
    alignItems: 'end',
  },
});

const blank = () => ({ name: '', price: new Decimal(0), quantity: 1 });

export default _component(() => {
  let submitted = _state('');
  const form = useForm({
    schema,
    initial: {
      customer: '云杉科技',
      items: [
        { name: '设计稿评审', price: new Decimal('1200.00'), quantity: 1 },
        { name: '组件开发（人天）', price: new Decimal('1500.50'), quantity: 3 },
      ],
    },
    onSubmit: (values) => {
      submitted = `报价已提交：${values.items.length} 项`;
    },
  });
  const items = form.array('items');

  return () => {
    const total = form.values.items.reduce(
      (sum, item) => sum.plus(new Decimal(item.price).times(item.quantity || 0)),
      new Decimal(0),
    );
    return (
      <Card>
        <Form controller={form}>
          <Flex direction="column" gap="md">
            <form.Field name="customer" label="客户">
              <TextField value={_bind(form.values.customer)} />
            </form.Field>
            {/* 只有第一行显示列标题；每行的控件另有 aria-label，读屏知道是第几项 */}
            {items.items.map((_, index) => (
              <div key={items.keys[index]} {...css.attrs(styles.row)}>
                <form.Field name={`items.${index}.name`} label={index === 0 ? '品名' : undefined}>
                  <TextField
                    value={_bind(form.values.items[index]!.name)}
                    aria-label={`第 ${index + 1} 项品名`}
                  />
                </form.Field>
                <form.Field
                  name={`items.${index}.price`}
                  label={index === 0 ? '单价（元）' : undefined}
                >
                  <NumberField
                    value={_bind(form.values.items[index]!.price)}
                    aria-label={`第 ${index + 1} 项单价`}
                  />
                </form.Field>
                <form.Field
                  name={`items.${index}.quantity`}
                  label={index === 0 ? '数量' : undefined}
                >
                  <NumberField
                    value={_bind(form.values.items[index]!.quantity)}
                    aria-label={`第 ${index + 1} 项数量`}
                  />
                </form.Field>
                <IconButton
                  icon={Trash2}
                  aria-label={`删除第 ${index + 1} 项`}
                  disabled={items.items.length === 1}
                  onClick={() => items.remove(index)}
                />
              </div>
            ))}
            <Flex align="center" justify="between" gap="md">
              <Button size="sm" variant="ghost" icon={Plus} onClick={() => items.append(blank())}>
                加一项
              </Button>
              <Strong>合计 ¥{total.toFixed(2)}</Strong>
            </Flex>
            <Flex align="center" justify="between" gap="md">
              <Small tone="muted">{submitted}</Small>
              <Button type="submit">提交报价</Button>
            </Flex>
          </Flex>
        </Form>
      </Card>
    );
  };
});

import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Flex, Grid, NumberField, Text } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

/** 值的类型与内容：Decimal(0.3)、BigInt(9007199254740993)、Number(0.1) */
const describe = (value: Decimal | bigint | number | null) =>
  value == null ? 'null' : `${value.constructor.name}(${value.toString()})`;

export default _component(() => {
  // Decimal、bigint 放 _state.raw：不进深层响应式，写回的仍是原来的类型
  let price = _state.raw<Decimal | null>(new Decimal('0.1'));
  let total = _state.raw<Decimal | null>(null);
  let views = _state.raw<bigint | null>(9_007_199_254_740_993n);
  let float = _state<number | null>(0.1);

  return () => (
    <Grid minItemWidth="16em" gap="lg">
      <Flex direction="column" gap="sm">
        <Field label="单价（Decimal）" description="按两次 ↑：0.1 → 0.3，精确">
          <NumberField
            _value={_bind(price)}
            step={new Decimal('0.1')}
            format={{ style: 'currency', currency: 'CNY' }}
          />
        </Field>
        <Text size="sm" tone="muted">
          值：<Code>{describe(price)}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="合计（valueType={Decimal}）" description="一开始为空，写回的也是 Decimal">
          <NumberField
            _value={_bind(total)}
            valueType={Decimal}
            step={new Decimal('0.01')}
            min={0}
            placeholder="0.00"
          />
        </Field>
        <Text size="sm" tone="muted">
          值：<Code>{describe(total)}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="播放量（bigint）" description="超过 2⁵³ 的整数，加减不丢位">
          <NumberField _value={_bind(views)} />
        </Field>
        <Text size="sm" tone="muted">
          值：<Code>{describe(views)}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="对照：number" description="步长 0.1 也能对齐，但大数、长小数会丢精度">
          <NumberField _value={_bind(float)} step={0.1} />
        </Field>
        <Text size="sm" tone="muted">
          值：<Code>{describe(float)}</Code>
        </Text>
      </Flex>
    </Grid>
  );
});

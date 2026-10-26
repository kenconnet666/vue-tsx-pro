// 单位与缩放：值以元保存，输入框里按万元显示与输入（format.scale），写回时按十进制移位、不丢精度；
// 单位文字用 suffix / prefix 放在输入框里
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Field, Flex, Grid, NumberField, Text, useFormat } from '@zerodep-dev/vue-tsx-pro-ui';
import Decimal from 'decimal.js';

export default _component(() => {
  const format = useFormat();
  let budget = _state.raw<Decimal | null>(new Decimal('155353.2'));
  let freight = _state.raw<Decimal | null>(new Decimal('12.5'));
  let stores = _state<number | null>(40);

  return () => (
    <Grid minItemWidth="16em" gap="lg">
      <Flex direction="column" gap="sm">
        <Field label="年度预算" description="值是元，按万元输入；步长 100 元">
          <NumberField
            _value={budget}
            format={{ scale: 10_000, maximumFractionDigits: 2 }}
            step={100}
            min={0}
            prefix="¥"
            suffix="万元"
          />
        </Field>
        <Text size="sm" tone="muted">
          保存的值：<Code>{budget ? `${budget.toFixed()} 元` : 'null'}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="运费目标">
          <NumberField
            _value={freight}
            step={new Decimal('0.01')}
            min={0}
            format={{ minimumFractionDigits: 2 }}
            suffix="元/单"
            stepper={false}
          />
        </Field>
        <Text size="sm" tone="muted">
          每千单：
          <Code>{freight ? format.number(freight.times(1000), { suffix: '元' }) : '—'}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="门店数量">
          <NumberField _value={stores} min={0} suffix="家" />
        </Field>
        <Text size="sm" tone="muted">
          只读时不显示加减按钮：
        </Text>
        <NumberField _value={stores} suffix="家" readonly aria-label="门店数量（只读）" />
      </Flex>
    </Grid>
  );
});

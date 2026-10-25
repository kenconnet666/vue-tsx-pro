// 单位与缩放：值以元保存，输入框里按万元显示与输入（format.scale），写回时按十进制移位、不丢精度；
// 单位文字用 suffix / prefix 放在输入框里
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Flex, Grid, NumberField, Text, useFormat } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

export default _component(() => {
  const format = useFormat();
  let unitSaving = _state.raw<Decimal | null>(new Decimal('155353.2'));
  let dmcSaving = _state.raw<Decimal | null>(new Decimal('12.5'));
  let flights = _state<number | null>(40);

  return () => (
    <Grid minItemWidth="16em" gap="lg">
      <Flex direction="column" gap="sm">
        <Field label="单机降本目标" description="值是元，按万元输入；步长 100 元">
          <NumberField
            _value={unitSaving}
            format={{ scale: 10_000, maximumFractionDigits: 2 }}
            step={100}
            min={0}
            prefix="¥"
            suffix="万元"
          />
        </Field>
        <Text size="sm" tone="muted">
          保存的值：<Code>{unitSaving ? `${unitSaving.toFixed()} 元` : 'null'}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="降 DMC 目标">
          <NumberField
            _value={dmcSaving}
            step={new Decimal('0.01')}
            min={0}
            format={{ minimumFractionDigits: 2 }}
            suffix="美元/FH"
            stepper={false}
          />
        </Field>
        <Text size="sm" tone="muted">
          每千飞行小时：
          <Code>{dmcSaving ? format.number(dmcSaving.times(1000), { suffix: '美元' }) : '—'}</Code>
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Field label="贯彻架次">
          <NumberField _value={flights} min={0} suffix="架" />
        </Field>
        <Text size="sm" tone="muted">
          只读时不显示加减按钮：
        </Text>
        <NumberField _value={flights} suffix="架" readonly aria-label="贯彻架次（只读）" />
      </Flex>
    </Grid>
  );
});

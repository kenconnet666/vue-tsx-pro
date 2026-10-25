import { _component } from '@vue-tsx-pro/tsx';
import { Button, Code, Field, Flex, Grid, NumberField, Text } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

export default _component(() => {
  let price = _state.raw<Decimal | null>(new Decimal('12345.6'));
  let quantity = _state<number | null>(3);
  let submitted = _state('');

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    submitted = [...data]
      .map(([key, value]) => `${key}=${typeof value === 'string' ? value : value.name}`)
      .join('&');
  }

  return () => (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="md">
        <Grid minItemWidth="14em" gap="lg">
          <Field label="单价" description="显示 ¥12,345.60，提交 12345.6">
            <NumberField
              _value={price}
              name="price"
              step={new Decimal('0.01')}
              format={{ style: 'currency', currency: 'CNY' }}
            />
          </Field>
          <Field label="数量">
            <NumberField _value={quantity} name="quantity" min={1} />
          </Field>
        </Grid>
        <Flex align="center" gap="md" wrap>
          <Button type="submit">提交</Button>
          <Text size="sm" tone="muted">
            FormData：<Code>{submitted || '（还没提交）'}</Code>
          </Text>
        </Flex>
      </Flex>
    </form>
  );
});

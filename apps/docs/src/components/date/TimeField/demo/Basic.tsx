// 门店营业时间：开门、打烊两个时间，打烊不能早于开门；值是 24 小时制的 'HH:mm'
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Grid, Text, TimeField, useFormat } from '@vue-tsx-pro/ui';

export default _component(() => {
  const format = useFormat();
  let opens = _state<string | null>('09:00');
  let closes = _state<string | null>('21:30');
  return () => {
    const wrong = opens != null && closes != null && closes <= opens;
    return (
      <Flex direction="column" gap="md">
        <Grid minItemWidth="12rem" gap="lg">
          <Field label="开门">
            <TimeField value={_bind(opens)} clearable />
          </Field>
          <Field label="打烊" invalid={wrong} error={wrong ? '打烊要晚于开门' : undefined}>
            <TimeField value={_bind(closes)} min={opens ?? undefined} clearable />
          </Field>
        </Grid>
        <Text tone="muted">
          {opens && closes && !wrong
            ? `营业 ${format.date(opens, { timeStyle: 'short' })} – ${format.date(closes, { timeStyle: 'short' })}`
            : '填好开门与打烊时间'}
        </Text>
      </Flex>
    );
  };
});

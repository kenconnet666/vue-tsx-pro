// 12 / 24 小时制：默认跟随语言（中文 24 小时、美国 12 小时加 AM / PM），hourCycle 可以指定；值总是 24 小时制
import { _component } from '@vue-tsx-pro/tsx';
import { Code, enUS, Field, Grid, Provider, TimeField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let time = _state<string | null>('19:45');
  return () => (
    <Grid minItemWidth="13rem" gap="lg">
      <Field label="简体中文（24 小时制）" description={<Code>{time ?? 'null'}</Code>}>
        <TimeField value={_bind(time)} />
      </Field>
      <Field label='hourCycle="h12"' description="中文的上午 / 下午">
        <TimeField value={_bind(time)} hourCycle="h12" />
      </Field>
      <Provider lang={enUS}>
        <Field label="English (US)" description="Type a / p in the last segment">
          <TimeField value={_bind(time)} />
        </Field>
      </Provider>
      <Field label='granularity="second"'>
        <TimeField value="08:30:15" granularity="second" />
      </Field>
      <Field label='granularity="hour"'>
        <TimeField value="08:00" granularity="hour" />
      </Field>
    </Grid>
  );
});

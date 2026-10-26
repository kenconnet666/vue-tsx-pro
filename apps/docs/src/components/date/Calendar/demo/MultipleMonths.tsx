// 排期总览：并排三个月，翻页一次翻三个月；并排时补齐的日期留空，同一天不会出现两次
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Calendar, Flex, Text, todayIso, useFormat } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  const format = useFormat();
  let launch = _state<string | null>(todayIso());
  return () => (
    <Flex direction="column" gap="md">
      <Calendar _value={launch} visibleMonths={3} aria-label="上线日期" />
      <Text tone="muted">
        上线日期：{launch ? format.date(launch, { dateStyle: 'full' }) : '未定'}
      </Text>
    </Flex>
  );
});

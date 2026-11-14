// 排期总览：并排三个月，翻页一次翻三个月；并排时补齐的日期留空，同一天不会出现两次
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Calendar, ClientOnly, Flex, Text, todayIso, useFormat } from '@zerodep-dev/vue-tsx-pro-ui';

const Demo = _component(() => {
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

// “今天”只有浏览器知道（服务端渲染的那一天、那个时区，和打开页面时的不一样）：依赖它的内容只在浏览器里画
export default _component(() => () => (
  <ClientOnly>
    <Demo />
  </ClientOnly>
));

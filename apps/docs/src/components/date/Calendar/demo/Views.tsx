// 三种视图：点标题从日期切到月份、再到年份，跨年份找日期很快；granularity 让选择停在月份或年份（账期、入学年份）
import { _component } from '@vue-tsx-pro/tsx';
import { Calendar, Flex, Grid, Small, Text, useFormat } from '@vue-tsx-pro/ui';

export default _component(() => {
  const format = useFormat();
  let birthday = _state<string | null>('1995-06-18');
  let period = _state<string | null>(null);
  let entry = _state<string | null>(null);

  return () => (
    <Grid minItemWidth="15rem" gap="xl">
      <Flex direction="column" gap="xs">
        <Small tone="muted">生日：点标题“1995年6月”切到月份、年份视图</Small>
        <Calendar _value={birthday} max="2026-12-31" aria-label="生日" />
        <Text size="sm">{birthday && format.date(birthday, { dateStyle: 'long' })}</Text>
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">账期：granularity="month"</Small>
        <Calendar granularity="month" _value={period} aria-label="账期" />
        <Text size="sm">
          {period ? format.date(period, { year: 'numeric', month: 'long' }) : '选一个月'}
        </Text>
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">入学年份：granularity="year"</Small>
        <Calendar granularity="year" _value={entry} min="2000-01-01" aria-label="入学年份" />
        <Text size="sm">{entry ? format.date(entry, { year: 'numeric' }) : '选一年'}</Text>
      </Flex>
    </Grid>
  );
});

// 门店营业时间：每天一行开门、打烊，打烊不能早于开门；值是 24 小时制的 'HH:mm'，可以直接比较大小
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Flex, Small, Switch, Text, TimeField, useFormat } from '@vue-tsx-pro/ui';

interface Day {
  name: string;
  open: boolean;
  opens: string | null;
  closes: string | null;
}

const styles = css.create({
  // 一行一天：星期、是否营业、开门、打烊，四列对齐
  table: {
    display: 'grid',
    gridTemplateColumns: 'max-content max-content minmax(7em, 1fr) minmax(7em, 1fr)',
    alignItems: 'center',
    gap: '_sm',
    columnGap: '_md',
  },
});

export default _component(() => {
  const format = useFormat();
  let days = _state<Day[]>([
    { name: '工作日', open: true, opens: '09:00', closes: '21:30' },
    { name: '周六', open: true, opens: '10:00', closes: '22:00' },
    { name: '周日', open: false, opens: '10:00', closes: '18:00' },
  ]);
  const short = (time: string) => format.date(time, { timeStyle: 'short' });

  return () => (
    <Flex direction="column" gap="md">
      <div {...css.attrs(styles.table)}>
        <Small tone="muted">日期</Small>
        <Small tone="muted">营业</Small>
        <Small tone="muted">开门</Small>
        <Small tone="muted">打烊</Small>
        {days.map((day) => {
          const wrong =
            day.open && day.opens != null && day.closes != null && day.closes <= day.opens;
          return [
            <Text key={`${day.name}-name`} weight="medium">
              {day.name}
            </Text>,
            <Switch
              key={`${day.name}-open`}
              _checked={_bind(day.open)}
              aria-label={`${day.name}营业`}
            />,
            <TimeField
              key={`${day.name}-opens`}
              _value={_bind(day.opens)}
              disabled={!day.open}
              aria-label={`${day.name}开门时间`}
            />,
            <TimeField
              key={`${day.name}-closes`}
              _value={_bind(day.closes)}
              min={day.opens ?? undefined}
              invalid={wrong}
              disabled={!day.open}
              aria-label={`${day.name}打烊时间`}
            />,
          ];
        })}
      </div>
      <Flex gap="sm" wrap>
        {days.map((day) => (
          <Badge key={day.name} tone={day.open ? 'success' : 'neutral'} radius="full">
            {day.name}：
            {day.open && day.opens && day.closes
              ? `${short(day.opens)} – ${short(day.closes)}`
              : '休息'}
          </Badge>
        ))}
      </Flex>
    </Flex>
  );
});

// 显示与只读：firstDayOfWeek 一周从哪天开始、showWeekNumbers 周数、fixedWeeks={false} 按实际行数；readonly 能翻页不能改。
// valueType="dateValue" 一开始为空时写回 CalendarDate；defaultFocused 没有值时先显示哪个月；onPick 每选完一个区间调用
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Flex,
  RangeCalendar,
  Small,
  Switch,
  ToggleGroup,
  ToggleItem,
  type DateRange,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  const nextMonth = today(getLocalTimeZone()).add({ months: 1 }).set({ day: 1 });
  let firstDay = _state('1');
  let weekNumbers = _state(true);
  let fixedWeeks = _state(true);
  let readonly = _state(false);
  let range = _state<DateRange<CalendarDate> | null>(null);
  let picks = _state(0);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" align="center" wrap>
        <ToggleGroup _value={firstDay} required size="sm" aria-label="一周的第一天">
          <ToggleItem value="1">周一开始</ToggleItem>
          <ToggleItem value="0">周日开始</ToggleItem>
        </ToggleGroup>
        <Switch _checked={weekNumbers}>周数</Switch>
        <Switch _checked={fixedWeeks}>固定 6 行</Switch>
        <Switch _checked={readonly}>只读</Switch>
      </Flex>
      <RangeCalendar
        _value={range}
        valueType="dateValue"
        defaultFocused={nextMonth}
        firstDayOfWeek={Number(firstDay)}
        showWeekNumbers={weekNumbers}
        fixedWeeks={fixedWeeks}
        readonly={readonly}
        onPick={() => picks++}
        aria-label="活动档期"
      />
      <Small tone="muted">
        {range ? `${range.start.toString()} – ${range.end.toString()}` : '还没选'} · 选完 {picks} 次
      </Small>
    </Flex>
  );
});

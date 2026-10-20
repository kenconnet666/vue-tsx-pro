// 报表的统计区间：页脚放快捷区间（presetRange 按今天与语言的一周第一天算），今天之后不能选
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Flex,
  presetIsoRange,
  RangeCalendar,
  Text,
  todayIso,
  useFormat,
  useLang,
  type DateRange,
  type DateRangePreset,
} from '@vue-tsx-pro/ui';

const PRESETS: [DateRangePreset, string][] = [
  ['today', '今天'],
  ['last7Days', '最近 7 天'],
  ['last30Days', '最近 30 天'],
  ['thisMonth', '本月'],
  ['lastMonth', '上月'],
];

export default _component(() => {
  const format = useFormat();
  const lang = useLang();
  const preset = (name: DateRangePreset) => presetIsoRange(name, { locale: lang.code });
  const today = todayIso();
  let range = _state<DateRange<string> | null>(preset('last7Days'));

  return () => (
    <Flex direction="column" gap="md">
      <RangeCalendar
        value={_bind(range)}
        visibleMonths={2}
        max={today}
        aria-label="统计区间"
        footer={PRESETS.map(([name, label]) => {
          const value = preset(name);
          const active = range?.start === value.start && range?.end === value.end;
          return (
            <Button
              key={name}
              size="sm"
              variant={active ? 'soft' : 'ghost'}
              tone="neutral"
              onClick={() => (range = value)}
            >
              {label}
            </Button>
          );
        })}
      />
      <Text tone="muted">
        {range
          ? `统计 ${format.date(range.start, { dateStyle: 'medium' })} – ${format.date(range.end, { dateStyle: 'medium' })}`
          : '选一个区间'}
      </Text>
    </Flex>
  );
});

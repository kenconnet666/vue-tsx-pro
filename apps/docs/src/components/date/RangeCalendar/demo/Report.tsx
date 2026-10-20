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

// 快捷区间的名字取语言包（lang.dateRangePreset）；输入框加弹层的写法见 DateRangePicker 的 presets
const PRESETS: DateRangePreset[] = ['today', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'];

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
        footer={PRESETS.map((name) => {
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
              {lang.dateRangePreset[name]}
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

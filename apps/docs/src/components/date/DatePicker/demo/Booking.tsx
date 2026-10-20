// 预约门诊：只能约今天起 30 天内的工作日，已约满的日子不可选；可以直接键入，也可以点按钮翻日历
import { _component } from '@vue-tsx-pro/tsx';
import {
  DatePicker,
  Field,
  Grid,
  isoDayOfWeek,
  shiftIsoDate,
  Text,
  todayIso,
  useFormat,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  const last = shiftIsoDate(today, { days: 30 });
  // 演示数据：从今天往后数的第 3、4、11 天已约满
  const fullyBooked = new Set([3, 4, 11].map((days) => shiftIsoDate(today, { days })));
  const unavailable = (date: string) => isoDayOfWeek(date) % 6 === 0 || fullyBooked.has(date);
  let visit = _state<string | null>(null);
  let birthday = _state<string | null>('1992-08-16');
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Field
        label="就诊日期"
        required
        description={
          visit
            ? format.date(visit, { dateStyle: 'full' })
            : '30 天内的工作日，周末与约满的日子不可选'
        }
      >
        <DatePicker
          value={_bind(visit)}
          min={today}
          max={last}
          isDateUnavailable={unavailable}
          name="visit"
        />
      </Field>
      <Field label="出生日期" description="年份久远时直接键入比翻日历快">
        <DatePicker value={_bind(birthday)} max={today} name="birthday" clearable />
      </Field>
      <Text tone="muted" size="sm">
        提交的值：visit={visit ?? 'null'}，birthday={birthday ?? 'null'}
      </Text>
    </Grid>
  );
});

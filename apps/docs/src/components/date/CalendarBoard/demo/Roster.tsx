// 车间排班：每天早、中、夜三个班的值班人（renderDay），节假日与调休写在日期旁边（getDayNote），休息日不排班
import { _component } from '@vue-tsx-pro/tsx';
import { CalendarBoard, Flex, Small, Text, type Tone } from '@vue-tsx-pro/ui';

/** 2026 年 10 月的节假日与调休（演示数据） */
const notes: Record<string, string> = {
  '2026-10-01': '国庆节',
  '2026-10-02': '休',
  '2026-10-03': '休',
  '2026-10-04': '休',
  '2026-10-05': '休',
  '2026-10-06': '休',
  '2026-10-07': '休',
  '2026-10-10': '班',
  '2026-10-29': '重阳节',
};
/** 放假的日子：国庆节与“休” */
const holidays = new Set(
  Object.entries(notes)
    .filter(([, note]) => note === '国庆节' || note === '休')
    .map(([date]) => date),
);

const people = ['林小满', '周一航', '许悠', '韩笑', '陈默', '宋知遥'];
const shifts: readonly { name: string; tone: Tone }[] = [
  { name: '早', tone: 'success' },
  { name: '中', tone: 'warning' },
  { name: '夜', tone: 'accent' },
];

/** 按日期轮换值班人：同一天的三个班不重复 */
const onDuty = (date: string) => {
  const day = Number(date.slice(8));
  return shifts.map((shift, index) => ({
    ...shift,
    person: people[(day + index * 2) % people.length]!,
  }));
};

export default _component(() => () => (
  <CalendarBoard
    _month="2026-10"
    getDayNote={(date) => notes[date]}
    renderDay={(date, { outside, weekend }) => {
      // 补齐的上下月、放假的日子、周末（调休上班的除外）不排班
      if (outside || holidays.has(date) || (weekend && notes[date] !== '班')) return null;
      return (
        <Flex direction="column">
          {onDuty(date).map(({ name, tone, person }) => (
            <Flex key={name} align="center" gap="xs">
              <Text size="xs" weight="semibold" tone={tone}>
                {name}
              </Text>
              <Small>{person}</Small>
            </Flex>
          ))}
        </Flex>
      );
    }}
    readonly
    aria-label="车间排班"
  />
));

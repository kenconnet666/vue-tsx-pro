// 项目日程：会议、评审、出差（跨天）铺在格子里，每天最多三条；点一天，右边列出那天的全部日程
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  CalendarBoard,
  Card,
  Flex,
  Select,
  Small,
  Text,
  useFormat,
  type StatusTone,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Meeting {
  id: string;
  title: string;
  date: string;
  end?: string;
  kind: 'meeting' | 'review' | 'trip' | 'deadline';
}

const kinds: Record<Meeting['kind'], { label: string; tone: StatusTone }> = {
  meeting: { label: '会议', tone: 'accent' },
  review: { label: '评审', tone: 'warning' },
  trip: { label: '出差', tone: 'info' },
  deadline: { label: '截止', tone: 'danger' },
};

const meetings: Meeting[] = [
  { id: '1', title: '09:30 周会', date: '2026-10-12', kind: 'meeting' },
  { id: '2', title: '14:00 供应商比价评审', date: '2026-10-12', kind: 'review' },
  { id: '3', title: '杭州工厂审核', date: '2026-10-14', end: '2026-10-16', kind: 'trip' },
  { id: '4', title: '09:30 周会', date: '2026-10-19', kind: 'meeting' },
  { id: '5', title: '10:30 改进方案对齐', date: '2026-10-19', kind: 'meeting' },
  { id: '6', title: '15:00 模具保养计划', date: '2026-10-19', kind: 'review' },
  { id: '7', title: '17:00 预算复盘', date: '2026-10-19', kind: 'meeting' },
  { id: '8', title: '季度报表提交', date: '2026-10-23', kind: 'deadline' },
  { id: '9', title: '09:30 周会', date: '2026-10-26', kind: 'meeting' },
  { id: '10', title: '工艺变更评审', date: '2026-10-28', kind: 'review' },
  { id: '11', title: '月度销售复盘', date: '2026-10-30', kind: 'meeting' },
];

export default _component(() => {
  const format = useFormat();
  let day = _state<string | null>('2026-10-19');
  let month = _state('2026-10');
  let kind = _state<Meeting['kind'] | 'all'>('all');
  const shown = () => meetings.filter((meeting) => kind === 'all' || meeting.kind === kind);
  const onDay = () =>
    day == null
      ? []
      : shown().filter((meeting) => meeting.date <= day! && day! <= (meeting.end ?? meeting.date));
  return () => (
    // 宽的时候左右排，窄了右边那张卡片换到下面
    <Flex gap="md" wrap align="start">
      <CalendarBoard
        style={{ flex: '3 1 32rem' }}
        events={shown()}
        getEventDate={(meeting) => meeting.date}
        getEventEnd={(meeting) => meeting.end ?? meeting.date}
        getEventKey={(meeting) => meeting.id}
        getEventLabel={(meeting) => meeting.title}
        getEventTone={(meeting) => kinds[meeting.kind].tone}
        _value={day}
        _month={month}
        toolbar={
          <Select
            items={[
              { value: 'all', label: '全部类型' },
              ...Object.entries(kinds).map(([value, { label }]) => ({ value, label })),
            ]}
            _value={kind}
            size="sm"
            aria-label="日程类型"
          />
        }
        aria-label="项目日程"
      />
      <Card padding="sm" style={{ flex: '1 1 14rem' }}>
        <Flex direction="column" gap="sm">
          <Text weight="semibold">
            {day ? format.date(day, { month: 'long', day: 'numeric', weekday: 'short' }) : '选一天'}
          </Text>
          {onDay().length === 0 && <Small tone="muted">这天没有日程</Small>}
          {onDay().map((meeting) => (
            <Flex key={meeting.id} align="center" gap="sm">
              <Badge size="xs" variant="soft" tone={kinds[meeting.kind].tone}>
                {kinds[meeting.kind].label}
              </Badge>
              <Text size="sm">{meeting.title}</Text>
            </Flex>
          ))}
        </Flex>
      </Card>
    </Flex>
  );
});

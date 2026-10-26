// 合同协商的流转记录：旧的在前、左右交替、小一号；留言、暂停、恢复各有图标
import { CircleCheck, CirclePlay, MessageSquare, Pause } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Timeline, type TimelineItem } from '@zerodep-dev/vue-tsx-pro-ui';

const records: TimelineItem[] = [
  {
    title: '法务 · 张律 发起',
    time: '10-08 14:00',
    dateTime: '2026-10-08T14:00',
    tone: 'accent',
    icon: CirclePlay,
  },
  {
    title: '法务 · 张律 · 法务审核：通过',
    time: '10-09 10:20',
    dateTime: '2026-10-09T10:20',
    tone: 'success',
    icon: CircleCheck,
  },
  {
    title: '商务 · 林夏 留言',
    time: '10-10 08:45',
    dateTime: '2026-10-10T08:45',
    icon: MessageSquare,
    description: '付款节点改成验收后 30 天，法务已口头同意',
  },
  {
    title: '管理层 · 秦总 暂停了流程',
    time: '10-12 17:30',
    dateTime: '2026-10-12T17:30',
    tone: 'warning',
    icon: Pause,
    description: '等对方董事会决议',
  },
  {
    title: '管理层 · 秦总 恢复了流程',
    time: '10-20 09:00',
    dateTime: '2026-10-20T09:00',
    tone: 'accent',
    icon: CirclePlay,
  },
];

export default _component(() => () => (
  <Card>
    <Timeline items={records} alternate size="sm" />
  </Card>
));

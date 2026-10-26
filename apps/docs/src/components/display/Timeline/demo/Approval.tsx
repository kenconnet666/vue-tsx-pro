// 采购申请的流转记录：每条事件一项，actor 是处理人，处理结果按种类换图标与色调（同意、退回、超时自动处理）；
// 意见写在 description，附件做成链接；reverse 新的在前
import {
  BellRing,
  Check,
  CirclePlay,
  Clock,
  CornerUpLeft,
  Hand,
  Hourglass,
  UserCheck,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Link, Timeline, type TimelineItem } from '@vue-tsx-pro/ui';

/** 一条流转事件：时间写成“月-日 时:分”，机器可读的完整时间进 dateTime */
const at = (dateTime: string) => ({ dateTime, time: dateTime.slice(5, 16).replace('T', ' ') });

const records: TimelineItem[] = [
  { title: '发起', actor: '周宁', ...at('2026-10-14T09:02'), tone: 'accent', icon: CirclePlay },
  { title: '认领了 部门审批', actor: '陆川', ...at('2026-10-14T10:15'), icon: Hand },
  {
    title: '部门审批：退回修改',
    actor: '陆川',
    ...at('2026-10-14T10:40'),
    tone: 'warning',
    icon: CornerUpLeft,
    description: '报价只有一家，请再比价一家后提交',
  },
  {
    title: '修改申请：重新提交',
    actor: '周宁',
    ...at('2026-10-15T16:20'),
    tone: 'success',
    icon: Check,
    description: (
      <Flex gap="sm" wrap>
        <Link href="#">比价单.xlsx</Link>
        <Link href="#">报价-乙公司.pdf</Link>
      </Flex>
    ),
  },
  {
    title: '部门审批：同意',
    actor: '陆川',
    ...at('2026-10-16T09:05'),
    tone: 'success',
    icon: Check,
  },
  {
    title: '催办 预算核对',
    actor: '周宁',
    ...at('2026-10-19T09:30'),
    tone: 'info',
    icon: BellRing,
    description: '供应商月底调价，麻烦尽快',
  },
  {
    title: '预算核对 没人认领，转负责人指定',
    actor: '系统',
    ...at('2026-10-21T09:00'),
    tone: 'warning',
    icon: Hourglass,
  },
  {
    title: '指定 方圆 处理 预算核对',
    actor: '韩笑',
    ...at('2026-10-21T09:12'),
    tone: 'accent',
    icon: UserCheck,
  },
  {
    title: '预算核对：核对无误（超时自动处理）',
    actor: '系统',
    ...at('2026-10-24T00:00'),
    tone: 'info',
    icon: Clock,
    description: '超过时限，视为无异议',
  },
];

export default _component(() => () => (
  <Card>
    <Timeline items={records} reverse />
  </Card>
));

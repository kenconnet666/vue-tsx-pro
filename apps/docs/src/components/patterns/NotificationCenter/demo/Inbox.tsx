// 通知页面：NotificationList 直接放在卡片里，不进弹出层；时间在每行末尾，列表限高滚动；标题行换成卡片自己的标题
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Card, Flex, H3 } from '@vue-tsx-pro/ui';
import { NotificationList, type NotificationItem } from '@vue-tsx-pro/ui/patterns';

const styles = stylex.create({ list: { maxHeight: '22rem' } });

const NOW = Date.parse('2026-10-21T10:00:00+08:00');
const at = (day: number, time: string) =>
  `2026-10-${String(day).padStart(2, '0')}T${time}:00+08:00`;

const seed = (): NotificationItem[] => [
  {
    id: 'a',
    title: '新的待办：齐全性检查',
    description: 'JY-2026-0187 · 整流罩支架材料替代',
    time: at(21, '09:42'),
    type: 'todo',
    read: false,
  },
  {
    id: 'b',
    title: '被退回：方案设计',
    description: 'DJ-2026-FC-14 · 验证窗结论缺少试验报告',
    time: at(21, '08:10'),
    type: 'returned',
    read: false,
    tone: 'warning',
  },
  {
    id: 'c',
    title: '催办：收益认定',
    description: 'DMC-2026-QY-3 · 请今天内认定',
    time: at(20, '16:30'),
    type: 'remind',
    read: false,
    tone: 'danger',
  },
  {
    id: 'd',
    title: '超时：商务洽谈已超过 60 天',
    description: 'JY-2026-0102 · 供应商乙报价未回复',
    time: at(20, '09:00'),
    type: 'remind',
    read: false,
    tone: 'danger',
  },
  {
    id: 'e',
    title: '会签已完成：DMC 审批链',
    description: 'DMC-2026-ZT-9 · 4 个节点全部通过',
    time: at(19, '17:45'),
    type: 'todo',
    read: true,
  },
  {
    id: 'f',
    title: '成本团队收件箱有新的待办：收益测算',
    description: 'JY-2026-0179 · 舱门密封件第二货源',
    time: at(19, '11:00'),
    type: 'todo',
    read: true,
  },
  {
    id: 'g',
    title: '被退回：收益测算',
    description: 'JY-2026-0166 · 测算口径需按硬节约',
    time: at(18, '16:05'),
    type: 'returned',
    read: true,
    tone: 'warning',
  },
  {
    id: 'h',
    title: '计划调整已通过：地板梁紧固件减量',
    description: 'DJ-2026-ZT-76 · 计划完成改为 2026-12-15',
    time: at(18, '15:20'),
    type: 'todo',
    read: true,
  },
  {
    id: 'i',
    title: '催办：方案设计',
    description: 'DJ-2026-FC-11 · 主办已两天未处理',
    time: at(17, '10:30'),
    type: 'remind',
    read: true,
  },
  {
    id: 'j',
    title: '新的待办：验证实施',
    description: 'DJ-2026-FC-08 · 线束卡箍合并规格',
    time: at(16, '14:12'),
    type: 'todo',
    read: true,
  },
];

export default _component(() => {
  let items = _state(seed());
  const unread = () => items.filter((item) => !item.read).length;
  return () => (
    <Card
      padding="none"
      header={
        <Flex align="center" gap="sm">
          <H3 size="md">我的通知</H3>
          {unread() > 0 && <Badge tone="accent">{unread()} 条未读</Badge>}
        </Flex>
      }
    >
      <NotificationList
        title={false}
        items={items}
        types={[
          { key: 'todo', label: '待办' },
          { key: 'returned', label: '退回' },
          { key: 'remind', label: '催办与超时' },
        ]}
        now={NOW}
        onRead={(ids) =>
          (items = items.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)))
        }
        propsList={{ sx: styles.list }}
      />
    </Card>
  );
});

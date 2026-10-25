// 通知页面：NotificationList 直接放在卡片里，不进弹出层；时间在每行末尾，列表限高滚动；标题行换成卡片自己的标题
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Card, Flex, H3 } from '@vue-tsx-pro/ui';
import { NotificationList, type NotificationItem } from '@vue-tsx-pro/ui/patterns';

const styles = css.create({ list: { maxHeight: '22rem' } });

const NOW = Date.parse('2026-10-21T10:00:00+08:00');
const at = (day: number, time: string) =>
  `2026-10-${String(day).padStart(2, '0')}T${time}:00+08:00`;

const seed = (): NotificationItem[] => [
  {
    id: 'a',
    title: '新的待办：资料审核',
    description: 'PO-2026-0187 · 办公椅供应商切换',
    time: at(21, '09:42'),
    type: 'todo',
    read: false,
  },
  {
    id: 'b',
    title: '被退回：方案设计',
    description: 'PO-2026-0214 · 验收报告缺少试验报告',
    time: at(21, '08:10'),
    type: 'returned',
    read: false,
    tone: 'warning',
  },
  {
    id: 'c',
    title: '催办：财务复核',
    description: 'PO-2026-0233 · 请今天内验收',
    time: at(20, '16:30'),
    type: 'remind',
    read: false,
    tone: 'danger',
  },
  {
    id: 'd',
    title: '超时：结算已超过 30 天',
    description: 'PO-2026-0102 · 供应商乙对账未回复',
    time: at(20, '09:00'),
    type: 'remind',
    read: false,
    tone: 'danger',
  },
  {
    id: 'e',
    title: '会签已完成：多级审批',
    description: 'PO-2026-0249 · 4 个节点全部通过',
    time: at(19, '17:45'),
    type: 'todo',
    read: true,
  },
  {
    id: 'f',
    title: '财务部收件箱有新的待办：费用核算',
    description: 'PO-2026-0179 · 包装纸箱第二供应商',
    time: at(19, '11:00'),
    type: 'todo',
    read: true,
  },
  {
    id: 'g',
    title: '被退回：费用核算',
    description: 'PO-2026-0166 · 测算口径需按实际节省',
    time: at(18, '16:05'),
    type: 'returned',
    read: true,
    tone: 'warning',
  },
  {
    id: 'h',
    title: '计划调整已通过：货架紧固件减量',
    description: 'PO-2026-0276 · 计划完成改为 2026-12-15',
    time: at(18, '15:20'),
    type: 'todo',
    read: true,
  },
  {
    id: 'i',
    title: '催办：方案设计',
    description: 'PO-2026-0211 · 主办已两天未处理',
    time: at(17, '10:30'),
    type: 'remind',
    read: true,
  },
  {
    id: 'j',
    title: '新的待办：验证实施',
    description: 'PO-2026-0308 · 线束卡箍合并规格',
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

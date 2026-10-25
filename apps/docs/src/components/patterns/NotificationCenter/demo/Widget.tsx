// 工作台上的一张卡片：只放要我处理的提醒（应用自己筛出来），自定义标题、没有类型筛选，底部链到收件箱
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Link } from '@vue-tsx-pro/ui';
import { NotificationList, type NotificationItem } from '@vue-tsx-pro/ui/patterns';

const NOW = Date.parse('2026-10-21T10:00:00+08:00');

export default _component(() => {
  let items = _state<NotificationItem[]>([
    {
      id: 'r1',
      title: '催办：财务复核',
      description: 'PO-2026-0233 · 请今天内认定',
      time: '2026-10-20T16:30:00+08:00',
      read: false,
      tone: 'danger',
    },
    {
      id: 'r2',
      title: '超时：商务洽谈已超过 60 天',
      description: 'PO-2026-0102 · 供应商乙报价未回复',
      time: '2026-10-20T09:00:00+08:00',
      read: false,
      tone: 'danger',
    },
    {
      id: 'r3',
      title: '今天到期：齐全性检查',
      description: 'PO-2026-0187 · 办公椅供应商切换',
      time: '2026-10-21T08:00:00+08:00',
      read: false,
      tone: 'warning',
    },
  ]);
  return () => (
    <Card padding="none">
      <NotificationList
        title="要我处理的提醒"
        items={items}
        now={NOW}
        empty="都处理完了"
        onRead={(ids) => (items = items.filter((item) => !ids.includes(item.id)))}
        footer={<Link href="#inbox">打开收件箱</Link>}
      />
    </Card>
  );
});

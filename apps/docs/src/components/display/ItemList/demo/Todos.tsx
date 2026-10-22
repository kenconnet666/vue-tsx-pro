// 待办、通知这类界面列表：起始边色点（StatusDot），标题是链接，说明是编号与流程，结束边是时限
import { _component } from '@vue-tsx-pro/tsx';
import { Card, DeadlineTag, ItemList, ItemListItem, Link, StatusDot } from '@vue-tsx-pro/ui';

const TODAY = '2026-10-21';
const todos = [
  { id: 1, node: '齐全性检查', code: 'JY-2026-0187', due: '2026-10-23', returned: false },
  { id: 2, node: '方案设计', code: 'DJ-2026-FC-14', due: '2026-10-16', returned: true },
  { id: 3, node: '收益认定', code: 'DMC-2026-QY-3', due: '2026-11-04', returned: false },
];

export default _component(() => () => (
  <Card
    variant="outline"
    padding="sm"
    header="我的待办"
    extra={<Link href="#inbox">打开收件箱</Link>}
  >
    <ItemList divided hoverable>
      {todos.map((todo) => (
        <ItemListItem
          key={todo.id}
          align="start"
          start={<StatusDot tone={todo.returned ? 'warning' : 'accent'} />}
          title={<Link href={`#${todo.code}`}>{todo.node}</Link>}
          description={`${todo.code}${todo.returned ? ' · 被退回' : ''}`}
          end={<DeadlineTag due={todo.due} today={TODAY} />}
        />
      ))}
    </ItemList>
  </Card>
));

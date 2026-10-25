// 待办、通知这类界面列表：起始边色点（StatusDot），标题是链接，说明是编号与流程，结束边是时限
import { _component } from '@vue-tsx-pro/tsx';
import { Card, ItemList, ItemListItem, Link, StatusDot } from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';

const TODAY = '2026-10-21';
const todos = [
  { id: 1, node: '资料审核', code: 'PO-2026-0187', due: '2026-10-23', returned: false },
  { id: 2, node: '方案设计', code: 'PO-2026-0214', due: '2026-10-16', returned: true },
  { id: 3, node: '财务复核', code: 'PO-2026-0233', due: '2026-11-04', returned: false },
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
          end={<DeadlineBadge due={todo.due} today={TODAY} />}
        />
      ))}
    </ItemList>
  </Card>
));

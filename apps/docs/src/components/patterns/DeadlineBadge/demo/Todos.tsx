// 待办列表：每条结束边一个时限标记，超时、快到期的一眼看出来；完成的按完成那天显示按时或超时
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Avatar, Card, ItemList, ItemListItem, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import { DeadlineBadge } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const TODAY = '2026-10-21';
const todos = [
  { code: 'PO-2026-0233', name: '财务复核', owner: '韩笑', due: '2026-10-16' },
  { code: 'PO-2026-0187', name: '资料审核：办公椅供应商切换', owner: '林小满', due: TODAY },
  {
    code: 'PO-2026-0214',
    name: '方案评审：门店陈列方案',
    owner: '周宁',
    due: '2026-10-22',
  },
  { code: 'PO-2026-0179', name: '费用核算：包装纸箱第二供应商', owner: '陆川', due: '2026-10-30' },
  {
    code: 'PO-2026-0308',
    name: '试点实施：线束卡箍合并规格',
    owner: '方圆',
    due: '2026-10-19',
    done: '2026-10-19',
  },
];

export default _component(() => () => (
  <Card padding="none">
    <ItemList divided inset="md">
      {todos.map((todo) => (
        <ItemListItem
          key={todo.code}
          start={<Avatar name={todo.owner} size="sm" />}
          title={<Link href="#">{todo.name}</Link>}
          description={`${todo.code} · 主办 ${todo.owner}`}
          end={<DeadlineBadge due={todo.due} done={todo.done} today={TODAY} />}
        />
      ))}
    </ItemList>
  </Card>
));

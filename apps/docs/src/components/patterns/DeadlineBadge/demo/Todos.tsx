// 待办列表：每条结束边一个时限标记，超时、快到期的一眼看出来；完成的按完成那天显示按时或超时
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Card, ItemList, ItemListItem, Link } from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';

const TODAY = '2026-10-21';
const todos = [
  { code: 'DMC-2026-QY-3', name: '收益认定', owner: '韩笑', due: '2026-10-16' },
  { code: 'JY-2026-0187', name: '齐全性检查：整流罩支架材料替代', owner: '林小满', due: TODAY },
  {
    code: 'DJ-2026-FC-14',
    name: '方案设计：验证窗结论补试验报告',
    owner: '周宁',
    due: '2026-10-22',
  },
  { code: 'JY-2026-0179', name: '收益测算：舱门密封件第二货源', owner: '陆川', due: '2026-10-30' },
  {
    code: 'DJ-2026-FC-08',
    name: '验证实施：线束卡箍合并规格',
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

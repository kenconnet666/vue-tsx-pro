import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Flex, Small, Sortable, Switch, Text, type StatusTone } from '@vue-tsx-pro/ui';

interface Task {
  id: string;
  title: string;
  priority: [StatusTone, string];
}

const high: Task['priority'] = ['danger', '紧急'];
const medium: Task['priority'] = ['warning', '重要'];
const low: Task['priority'] = ['info', '一般'];

export default _component(() => {
  let tasks = _state<Task[]>([
    { id: 'review', title: '评审首页改版设计稿', priority: high },
    { id: 'invoice', title: '处理 9 月发票报销', priority: medium },
    { id: 'interview', title: '面试前端候选人', priority: medium },
    { id: 'docs', title: '补充接口文档', priority: low },
    { id: 'weekly', title: '写周报', priority: low },
  ]);
  let locked = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Switch checked={_bind(locked)}>锁定顺序</Switch>
      <Sortable
        items={_bind(tasks)}
        getKey={(task) => task.id}
        getLabel={(task) => task.title}
        disabled={locked}
        aria-label="今日待办"
      >
        {(task) => (
          <Flex align="center" justify="between" gap="sm">
            <Text>{task.title}</Text>
            <Badge tone={task.priority[0]} variant="soft">
              {task.priority[1]}
            </Badge>
          </Flex>
        )}
      </Sortable>
      <Small tone="muted">顺序：{tasks.map((task) => task.id).join(' → ')}</Small>
    </Flex>
  );
});

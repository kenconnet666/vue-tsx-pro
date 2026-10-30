/**
 * 待办（mode: 'ssr'，要求 todo.read）：数据来自 loader，只看得到当前租户的；
 * 新建、勾选经 action（要求 todo.write，没有这个权限时不出现输入框、勾选框只读），改完重新取这一页的数据。
 * 统计经 useRequest 存进前端缓存（标签 t_todo）：别的页面、别的人改了待办时，服务端推来 t_todo，这里自动重新取
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  FlexList,
  H1,
  Text,
  TextField,
  useRequest,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { actions, cache, usePageData } from '../client.ts';
import { ActionError, useSession } from '@zerodep-dev/vue-tsx-pro-kit';

export default _component(() => {
  const data = usePageData('/todos');
  const session = useSession();
  // 键带上用户：同一个浏览器换了用户（租户）不会读到别人的统计
  const stats = useRequest(() => actions.todoStats({}), {
    cache: { store: cache, key: () => `todo-stats:${session.user ?? ''}`, tags: () => ['t_todo'] },
  });
  let title = _state('');
  let problem = _state('');
  let busy = _state(false);

  async function run(change: () => Promise<unknown>) {
    busy = true;
    problem = '';
    try {
      await change();
      await data.reload();
    } catch (error) {
      problem =
        error instanceof ActionError ? (error.issues[0]?.message ?? error.message) : String(error);
    } finally {
      busy = false;
    }
  }

  async function add(event: Event) {
    event.preventDefault();
    await run(() => actions.addTodo({ title }));
    if (!problem) title = '';
  }

  return () => (
    <Flex direction="column" gap="md" align="start">
      <H1>待办</H1>
      {stats.data && (
        <Text data-testid="todo-stats">
          共 {stats.data.total} 条，已完成 {stats.data.done} 条
        </Text>
      )}
      {session.can('todo.write') && (
        <form onSubmit={(event: Event) => void add(event)}>
          <Flex gap="sm" align="end">
            <TextField _value={title} aria-label="新的待办" placeholder="新的待办" />
            <Button type="submit" disabled={busy}>
              添加
            </Button>
          </Flex>
        </form>
      )}
      {problem && <Alert tone="danger">{problem}</Alert>}
      <FlexList direction="column" gap="xs" aria-label="待办列表">
        {data.value?.map((todo) => (
          <li key={todo.id}>
            <Checkbox
              _checked={todo.done}
              readonly={!session.can('todo.write')}
              disabled={busy}
              onChange={(event: Event) => {
                const done = (event.target as HTMLInputElement).checked;
                void run(() => actions.toggleTodo({ id: todo.id, done }));
              }}
            >
              {todo.title}
            </Checkbox>
          </li>
        ))}
      </FlexList>
    </Flex>
  );
});

// /base 页上的拖动排序演示：竖排的待办（可以拖到滚动区域外，自动滚动）与横排的标签
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Flex, Sortable, Text } from '@vue-tsx-pro/ui';

interface Task {
  id: string;
  title: string;
}

const styles = stylex.create({
  tasks: { width: '20rem', maxWidth: '100%', maxHeight: '14rem', overflowY: 'auto' },
});

export const SortableDemo = _component(() => {
  let tasks = _state<Task[]>(
    [
      '写需求文档',
      '评审设计稿',
      '修复登录 bug',
      '补单元测试',
      '发布 2.0',
      '写周报',
      '整理看板',
    ].map((title, index) => ({ id: `task-${index + 1}`, title })),
  );
  let tags = _state(['前端', '后端', '设计', '测试']);

  return () => (
    <Flex direction="column" gap="md">
      <Sortable
        class="sortable-demo"
        items={_bind(tasks)}
        getKey={(task) => task.id}
        getLabel={(task) => task.title}
        aria-label="待办"
        sx={styles.tasks}
      >
        {(task) => <Text>{task.title}</Text>}
      </Sortable>
      <Text tone="muted" size="sm" class="sortable-order">
        顺序：{tasks.map((task) => task.title).join(' → ')}
      </Text>
      <Sortable
        class="sortable-tags"
        orientation="horizontal"
        items={_bind(tags)}
        getKey={(tag) => tag}
        aria-label="标签顺序"
      >
        {(tag) => <Text>{tag}</Text>}
      </Sortable>
    </Flex>
  );
});

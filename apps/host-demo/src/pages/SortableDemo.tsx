// /base 页上的拖动排序演示：竖排的待办（可以拖到滚动区域外，自动滚动）与横排的标签
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Flex, ScrollArea, Sortable, Text } from '@vue-tsx-pro/ui';

interface Task {
  id: string;
  title: string;
}

const styles = css.create({
  // 滚动交给 ScrollArea（浮层滚动条，和整页一致）；拖到边缘时 Sortable 找到它的视口自动滚动
  tasks: { width: '20rem', maxWidth: '100%', maxHeight: '14rem' },
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
      <ScrollArea sx={styles.tasks}>
        <Sortable
          class="sortable-demo"
          _items={tasks}
          getKey={(task) => task.id}
          getLabel={(task) => task.title}
          aria-label="待办"
        >
          {(task) => <Text>{task.title}</Text>}
        </Sortable>
      </ScrollArea>
      <Text tone="muted" size="sm" class="sortable-order">
        顺序：{tasks.map((task) => task.title).join(' → ')}
      </Text>
      <Sortable
        class="sortable-tags"
        orientation="horizontal"
        _items={tags}
        getKey={(tag) => tag}
        aria-label="标签顺序"
      >
        {(tag) => <Text>{tag}</Text>}
      </Sortable>
    </Flex>
  );
});

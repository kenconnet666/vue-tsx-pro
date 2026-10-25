import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, Flex, Slider, Text } from '@vue-tsx-pro/ui';
import { nextTick, onMounted } from 'vue';

interface Task {
  id: number;
  name: string;
  progress: number;
  late: boolean;
}

/** 行组件渲染了几次：写在模块里，不是响应式的（显示它不能让行组件跟着渲染） */
let renders = 0;

const styles = css.create({
  rows: { display: 'grid', gap: '_xs' },
  row: {
    display: 'grid',
    gridTemplateColumns: '6em minmax(0, 1fr) 3em',
    alignItems: 'center',
    gap: '_sm',
    fontSize: '_sm',
  },
  late: { color: '_dangerText', fontWeight: '_medium' },
  track: { height: '0.5em', borderRadius: '_full', backgroundColor: '_fill', overflow: 'hidden' },
  // 动态样式：参数变化时只改元素上的 CSS 变量，类名不变
  bar: (percent: number) => ({
    width: `${percent}%`,
    height: '100%',
    borderRadius: '_full',
    backgroundColor: '_accent',
  }),
  lateBar: { backgroundColor: '_danger' },
  value: { textAlign: 'end', fontVariantNumeric: 'tabular-nums', color: '_textMuted' },
});

/**
 * 一行：task.progress 交给动态样式、task.late 只用在样式里。编译器把它们改成元素上的绑定，
 * 进度与“延期”变化时由元素自己的 effect 改变量、换类，这一行组件不重新渲染
 */
const TaskRow = _component(({ task }: { task: Task }) => () => {
  renders++;
  return (
    <div {...css.attrs(styles.row, task.late && styles.late)}>
      <span>{task.name}</span>
      <div {...css.attrs(styles.track)}>
        <div {...css.attrs(styles.bar(task.progress), task.late && styles.lateBar)} />
      </div>
      <span {...css.attrs(styles.value)}>{task.id}</span>
    </div>
  );
});

export default _component(() => {
  const tasks = _state<Task[]>(
    Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      name: `任务 ${index + 1}`,
      progress: 10 + index * 10,
      late: index % 3 === 0,
    })),
  );
  let shift = _state(0);
  let shown = _state(0);
  /** 等这一轮更新做完再读计数 */
  const refresh = () => void nextTick(() => (shown = renders));
  onMounted(refresh);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="md" align="center" wrap>
        <Slider
          aria-label="整体进度"
          min={-50}
          max={50}
          _value={_bind(
            () => shift,
            (value: number) => {
              shift = value;
              tasks.forEach(
                (task, index) =>
                  (task.progress = Math.max(0, Math.min(100, 10 + index * 10 + value))),
              );
              refresh();
            },
          )}
          sx={{ flexBasis: '14rem' }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            tasks.forEach((task) => (task.late = !task.late));
            refresh();
          }}
        >
          切换延期
        </Button>
        <Text size="sm" tone="muted">
          行组件渲染次数：{shown}
        </Text>
      </Flex>
      <div {...css.attrs(styles.rows)}>
        {tasks.map((task) => (
          <TaskRow task={task} />
        ))}
      </div>
    </Flex>
  );
});

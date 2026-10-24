// 任务按主办人与状态计数（aggregate="count"，不需要数值字段）；状态按流程的先后排（order），显示成中文（format）。
// 下面一张是按主办人求平均处理天数（aggregate="avg"），只有行维度、没有列维度
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, PivotTable } from '@vue-tsx-pro/ui';

interface Task {
  owner: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  days: number;
}

const statusLabels: Record<Task['status'], string> = {
  todo: '待开始',
  doing: '进行中',
  review: '待审核',
  done: '已完成',
};

const owners = ['周宁', '陆川', '方圆', '韩笑'];
const statuses = Object.keys(statusLabels) as Task['status'][];
// 按位置算出一组看起来自然的数据
const tasks: Task[] = Array.from({ length: 46 }, (_, i) => ({
  owner: owners[(i * 7) % 4]!,
  status: statuses[(i * 3 + Math.floor(i / 5)) % 4]!,
  days: 2 + ((i * 13) % 11),
}));

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <PivotTable
      aria-label="各主办人的任务数"
      data={tasks}
      rows={[{ key: 'owner', header: '主办人' }]}
      columns={{
        key: 'status',
        header: '状态',
        order: statuses,
        format: (value) => statusLabels[value as Task['status']],
      }}
      aggregate="count"
      heatmap
    />
    <PivotTable
      aria-label="各主办人的平均处理天数"
      data={tasks}
      rows={[{ key: 'owner', header: '主办人' }]}
      value={{ key: 'days', header: '平均处理天数', format: { maximumFractionDigits: 1 } }}
      aggregate="avg"
    />
  </Flex>
));

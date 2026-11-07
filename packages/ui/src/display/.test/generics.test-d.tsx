// 类型：展示类的泛型组件从数据推出项的类型，取键、取文字、渲染函数、回调的参数跟着它；写错字段时类型检查报错
import { StatusBadge } from '../../base/Badge';
import { CommandPalette } from '../../overlay/CommandPalette';
import { createStatusMap } from '../../utils/data/status';
import { Carousel } from '../Carousel';
import { FieldCompare } from '../FieldCompare';
import { Sortable } from '../Sortable';

interface Task {
  id: string;
  title: string;
  price: number;
}
declare const tasks: Task[];

export const sortable = (
  <Sortable _items={tasks} getKey={(task) => task.id} getLabel={(task) => task.title}>
    {(task) => task.title}
  </Sortable>
);
export const sortableTypo = (
  <Sortable
    _items={tasks}
    // @ts-expect-error 项是 Task，没有 key
    getKey={(task) => task.key}
    getLabel={(task) => task.title}
  />
);

export const carousel = (
  <Carousel items={tasks} aria-label="任务">
    {(task, index) => `${index + 1}. ${task.title}`}
  </Carousel>
);
export const carouselTypo = (
  <Carousel items={tasks} aria-label="任务">
    {/* @ts-expect-error 项是 Task，没有 name */}
    {(task) => task.name}
  </Carousel>
);

export const compare = (
  <FieldCompare
    fields={[
      { key: 'title', header: '标题', value: (task) => task.title },
      { key: 'price', header: '价格', type: 'currency', better: 'lower' },
    ]}
    before={tasks[0]}
    after={tasks[1]!}
  />
);
export const compareTypo = (
  <FieldCompare
    // @ts-expect-error 记录是 Task，没有 owner
    fields={[{ key: 'owner', header: '负责人', value: (task) => task.owner }]}
    before={tasks[0]}
    after={tasks[1]!}
  />
);

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  done: { label: '完成', tone: 'success' },
});
export const status = <StatusBadge statuses={statuses} value="done" />;

export const palette = (
  <CommandPalette
    items={tasks}
    toOption={(task) => ({ value: task.id, label: task.title })}
    onAction={(task) => void task.price}
  />
);
export const paletteTypo = (
  <CommandPalette
    items={tasks}
    toOption={(task) => ({ value: task.id, label: task.title })}
    // @ts-expect-error 项是 Task，没有 path
    onAction={(task) => void task.path}
  />
);

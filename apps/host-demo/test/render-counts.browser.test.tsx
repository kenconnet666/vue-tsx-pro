// 重渲染次数的回归测试：组件库与编译器的渲染优化（RUNES §9、COMPONENTS §10.16）不要退化。
// 只数组件更新的次数（确定的），不量时间
import { Copy } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  createUi,
  Flex,
  Listbox,
  Menu,
  MenuItem,
  DataTable,
  type ListboxOption,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { afterEach, expect, it } from 'vitest';
import { createApp, nextTick, type App, type Component } from 'vue';

let app: App | undefined;
let root: HTMLElement;
let updates = new Map<string, number>();

afterEach(() => {
  app?.unmount();
  root.remove();
  app = undefined;
});

function mount(component: Component) {
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(component);
  app.use(createUi());
  app.mixin({
    beforeUpdate(this: { $options: { name?: string } }) {
      const name = this.$options.name ?? '?';
      updates.set(name, (updates.get(name) ?? 0) + 1);
    },
  });
  app.mount(root);
}
const frames = async (count = 3) => {
  for (let i = 0; i < count; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
};
/** 做一件事，返回这期间各组件更新的次数 */
async function during(action: () => void) {
  await frames();
  updates = new Map();
  action();
  await nextTick();
  await frames();
  return updates;
}

it('父组件因为自己的状态重新渲染：Card > Flex > 按钮都不跟着重做', async () => {
  let bump = () => {};
  const Page = _component(() => {
    let count = _state(0);
    bump = () => count++;
    return () => (
      <div>
        <b>{count}</b>
        <Card header="标题">
          <Flex gap="sm">
            {Array.from({ length: 20 }, (_, i) => (
              <Button onClick={() => count++}>按钮 {i}</Button>
            ))}
          </Flex>
        </Card>
      </div>
    );
  });
  mount(Page);
  const counted = await during(() => bump());
  expect([...counted.keys()]).toEqual(['Page']);
});

it('表格勾选一行：只更新那一行', async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({ id: `r${i}`, name: `客户 ${i}` }));
  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: 'id', header: '编号', width: 100 },
    { key: 'name', header: '客户' },
  ];
  mount(
    _component(() => {
      let selected = _state<string[]>([]);
      return () => (
        <DataTable
          rows={rows}
          columns={columns}
          getKey={(row) => row.id}
          selectionMode="multiple"
          _selected={_bind(selected)}
          aria-label="客户"
        />
      );
    }),
  );
  const counted = await during(() =>
    root.querySelector<HTMLInputElement>('tbody input[type="checkbox"]')!.click(),
  );
  expect(counted.get('DataTableRow')).toBe(1);
});

it('调整非固定列的宽度：表头更新，各行不重渲染', async () => {
  const rows = Array.from({ length: 200 }, (_, i) => ({ id: `r${i}`, name: `客户 ${i}` }));
  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: 'id', header: '编号', width: 100, sticky: 'start' },
    { key: 'name', header: '客户', width: 200 },
  ];
  let resize = () => {};
  mount(
    _component(() => {
      let widths = _state<Record<string, number>>({});
      resize = () => (widths = { ...widths, name: (widths.name ?? 200) + 8 });
      return () => (
        <DataTable
          rows={rows}
          columns={columns}
          getKey={(row) => row.id}
          resizable
          _columnWidths={_bind(widths)}
          aria-label="客户"
        />
      );
    }),
  );
  const counted = await during(() => resize());
  expect(counted.get('DataTableRow') ?? 0).toBe(0);
});

it('Listbox 移动高亮：只重建前后两个选项', async () => {
  const options: ListboxOption[] = Array.from({ length: 1000 }, (_, i) => ({
    value: `v${i}`,
    label: `选项 ${i}`,
    icon: Copy,
  }));
  mount(
    _component(() => {
      let value = _state<string | null>(null);
      return () => <Listbox items={options} _value={_bind(value)} aria-label="选项" />;
    }),
  );
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]')!;
  listbox.focus();
  await during(() =>
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
  );
  const counted = await during(() =>
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
  );
  expect(counted.get('Icon') ?? 0).toBeLessThanOrEqual(4);
});

it('关闭的菜单不渲染菜单项，打开后才有', async () => {
  mount(
    _component(() => () => (
      <div>
        {Array.from({ length: 10 }, () => (
          <Menu trigger={(props) => <Button {...props}>操作</Button>}>
            <MenuItem>编辑</MenuItem>
            <MenuItem>删除</MenuItem>
          </Menu>
        ))}
      </div>
    )),
  );
  expect(root.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
  root.querySelector('button')!.click();
  await nextTick();
  await frames();
  expect(root.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
});

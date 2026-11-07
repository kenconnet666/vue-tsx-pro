// FilterBar 在真实浏览器里：按钮区是栅格的最后一格，贴在最后一行的结束边；最后一行满了才换到下一行；按钮多时跨几格
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Field, TextField } from '@zerodep-dev/vue-tsx-pro-ui';
import { FilterBar } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

const fields = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <Field key={index} label={`条件${index + 1}`}>
      <TextField />
    </Field>
  ));

/** 按钮区与各条件的位置：几行、按钮区在哪一行、离结束边多远 */
function layout(root: Element) {
  const form = root.querySelector('form')!;
  const actions = [...form.querySelectorAll('button')].at(-1)!.parentElement!;
  const grid = actions.parentElement!.getBoundingClientRect();
  const box = actions.getBoundingClientRect();
  const tops = [...form.querySelectorAll('input')].map((input) =>
    Math.round(input.getBoundingClientRect().top),
  );
  const lastRowTop = Math.max(...tops);
  const input = [...form.querySelectorAll('input')].at(-1)!.getBoundingClientRect();
  return {
    rows: new Set(tops).size,
    // 按钮区和最后一个条件的控件在同一行（底边对齐）
    sameRowAsLast: Math.abs(box.bottom - input.bottom) < 2 && lastRowTop === Math.round(input.top),
    belowLast: box.top >= input.bottom,
    endGap: Math.abs(grid.right - box.right),
  };
}

it('6 个条件、一行放 4 个：按钮区在第二行的结束边，和第 5、6 个条件同一行', async () => {
  const root = mount(
    _component(() => () => (
      <div style="width: 70rem">
        <FilterBar>{fields(6)}</FilterBar>
      </div>
    )),
  );
  await expect.poll(() => layout(root).rows).toBe(2);
  const result = layout(root);
  expect(result.sameRowAsLast).toBe(true);
  expect(result.endGap).toBeLessThan(1);
});

it('4 个条件正好占满一行：按钮区换到下一行，仍贴着结束边', async () => {
  const root = mount(
    _component(() => () => (
      <div style="width: 70rem">
        <FilterBar>{fields(4)}</FilterBar>
      </div>
    )),
  );
  await expect.poll(() => layout(root).belowLast).toBe(true);
  expect(layout(root).endGap).toBeLessThan(1);
});

it('按钮比一格宽时跨几格，不和条件重叠', async () => {
  const root = mount(
    _component(() => () => (
      <div style="width: 70rem">
        <FilterBar
          more={fields(1)}
          actions={
            <>
              <Button variant="outline">导出筛选结果</Button>
              <Button variant="outline">保存为常用</Button>
            </>
          }
        >
          {fields(3)}
        </FilterBar>
      </div>
    )),
  );
  const form = root.querySelector('form')!;
  const actions = [...form.querySelectorAll('button')].at(-1)!.parentElement!;
  // 按钮在一行里，没有被挤成两行
  const rows = () =>
    new Set([...actions.children].map((button) => Math.round(button.getBoundingClientRect().top)))
      .size;
  await expect.poll(rows).toBe(1);
  const input = form.querySelectorAll('input')[2]!;
  const cell = [...actions.parentElement!.children]
    .find((child) => child.contains(input))!
    .getBoundingClientRect();
  const box = actions.getBoundingClientRect();
  expect(box.left >= cell.right - 1 || box.top >= cell.bottom).toBe(true);
});

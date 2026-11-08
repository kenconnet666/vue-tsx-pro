// FilterBar 在真实浏览器里：默认只有一排——start、放得下的条件与全部按钮（查询后面接 end），按钮在结束边；
// 放不下的条件（常用的与 more）收进“展开”，展开后从第二排起，左边、宽度和第一排的条件对齐；全部放得下时不出“展开”；
// 窄到放不下时按钮区整体换到下一行
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Field, TextField } from '@zerodep-dev/vue-tsx-pro-ui';
import { FilterBar } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

const fields = (names: string[]) =>
  names.map((name) => (
    <Field key={name} label={name}>
      <TextField />
    </Field>
  ));

const top = (element: Element) => Math.round(element.getBoundingClientRect().top);

function render(width: string, more = ['采购员', '下单日期', '金额'], common = ['关键字', '品类']) {
  const root = mount(
    _component(() => () => (
      <div style={`width: ${width}`}>
        <FilterBar
          start={<strong>采购单</strong>}
          more={fields(more)}
          end={<Button variant="outline">新建</Button>}
        >
          {fields(common)}
        </FilterBar>
      </div>
    )),
  );
  const form = root.querySelector('form')!;
  const button = (name: string) =>
    [...form.querySelectorAll('button')].find((item) => item.textContent?.startsWith(name));
  const label = (name: string) =>
    [...form.querySelectorAll('label')].find((item) => item.textContent === name)!;
  return { form, button: (name: string) => button(name)!, label, find: button };
}

it('第一排：标题、常用条件、展开、重置、查询、end 都在同一排，按钮靠结束边', async () => {
  const { form, button, label } = render('80rem');
  const row = () => top(form.querySelector('input')!);
  await expect.poll(() => top(button('新建'))).toBe(top(button('查询')));
  for (const name of ['展开', '重置', '查询', '新建']) {
    expect(Math.abs(top(button(name)) - row())).toBeLessThan(2);
  }
  expect(top(label('品类'))).toBe(top(label('关键字')));
  const end = form.getBoundingClientRect().right - button('新建').getBoundingClientRect().right;
  expect(Math.abs(end)).toBeLessThan(1);
});

it('展开后放不下的条件从第二排起，左边、宽度和第一排的条件对齐（不在标题下面）', async () => {
  const { button, label, find } = render('80rem');
  await expect.poll(() => find('展开') != null).toBe(true);
  // 收起时只有一排：最后一个条件还看不到
  expect([...document.querySelectorAll('label')].some((item) => item.textContent === '金额')).toBe(
    false,
  );
  button('展开').click();
  await expect.poll(() => find('收起') != null).toBe(true);
  await expect.poll(() => top(label('金额')) > top(label('关键字'))).toBe(true);
  // 按钮仍在第一排
  expect(top(button('查询'))).toBeLessThan(top(label('金额')));
  // 栅格里的那一格（第一排的 fields、第二排起的 more）：左边对齐、一样宽
  const cell = (name: string) =>
    label(name)
      .closest('[data-part="fields"] > *, [data-part="more"] > *')!
      .getBoundingClientRect();
  await expect.poll(() => Math.abs(cell('金额').width - cell('关键字').width)).toBeLessThan(2);
  const rows = [
    ...new Set(['关键字', '品类', '采购员', '下单日期', '金额'].map((n) => top(label(n)))),
  ];
  const lefts = ['关键字', '品类', '采购员', '下单日期', '金额']
    .filter((n) => top(label(n)) === rows.at(-1))
    .map((n) => cell(n).left);
  expect(Math.abs(lefts[0]! - cell('关键字').left)).toBeLessThan(2);
});

it('常用条件第一排放不下的也收进“展开”：默认只有一排', async () => {
  const names = ['关键字', '品类', '状态', '采购员', '部门', '项目'];
  const { form, button, find } = render('60rem', [], names);
  await expect.poll(() => find('展开') != null).toBe(true);
  const inputs = () => [...form.querySelectorAll('input')];
  const firstRow = top(inputs()[0]!);
  expect(inputs().every((input) => top(input) === firstRow)).toBe(true);
  expect(inputs().length).toBeLessThan(names.length);
  button('展开').click();
  await expect.poll(() => inputs().length).toBe(names.length);
});

it('窄到条件与按钮放不下一排时，按钮区整体换到下一行，按钮仍在一行', async () => {
  const { form, button } = render('30rem');
  await expect.poll(() => top(button('查询')) > top(form.querySelector('input')!)).toBe(true);
  expect(top(button('重置'))).toBe(top(button('查询')));
  expect(top(button('新建'))).toBe(top(button('查询')));
});

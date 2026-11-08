// FilterBar 在真实浏览器里：第一排是 start、常用条件与全部按钮（查询后面接 end），按钮都在这一排的结束边；
// 展开的条件从第二排起，左边、宽度和第一排的条件对齐；全部显示也不多出一排时直接显示、不出“展开”；
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

function render(width: string, more = ['采购员', '下单日期', '金额']) {
  const root = mount(
    _component(() => () => (
      <div style={`width: ${width}`}>
        <FilterBar
          start={<strong>采购单</strong>}
          more={fields(more)}
          end={<Button variant="outline">新建</Button>}
        >
          {fields(['关键字', '品类'])}
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

it('展开后更多的条件从第二排起，左边和第一排的条件对齐（不在标题下面）', async () => {
  const { button, label, find } = render('80rem');
  button('展开').click();
  await expect.poll(() => find('收起') != null).toBe(true);
  await expect.poll(() => top(label('采购员')) > top(label('关键字'))).toBe(true);
  const first = label('关键字').getBoundingClientRect().left;
  expect(Math.abs(label('采购员').getBoundingClientRect().left - first)).toBeLessThan(2);
  // 按钮仍在第一排
  expect(top(button('查询'))).toBeLessThan(top(label('采购员')));
  // 第二排的格子和第一排一样宽
  // 栅格里的那一格（第一排的 fields、第二排起的 more）
  const width = (name: string) =>
    label(name).closest('[data-part="fields"] > *, [data-part="more"] > *')!.getBoundingClientRect()
      .width;
  await expect.poll(() => Math.abs(width('采购员') - width('关键字'))).toBeLessThan(2);
});

it('收起的条件连同常用条件一起放得下、不多出一排时，直接显示，不出“展开”', async () => {
  const { label, find } = render('120rem', ['采购员']);
  await expect.poll(() => find('展开')).toBeUndefined();
  expect(top(label('采购员'))).toBe(top(label('关键字')));
});

it('窄到条件与按钮放不下一排时，按钮区整体换到下一行，按钮仍在一行', async () => {
  const { form, button } = render('30rem');
  await expect.poll(() => top(button('查询')) > top(form.querySelector('input')!)).toBe(true);
  expect(top(button('重置'))).toBe(top(button('查询')));
  expect(top(button('新建'))).toBe(top(button('查询')));
});

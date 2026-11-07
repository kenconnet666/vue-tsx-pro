// Grid 的 balanced 在真实浏览器里：按量出的宽度与项数取列数，4 项不排成 3 + 1
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Grid } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

const columnCount = (grid: Element) => getComputedStyle(grid).gridTemplateColumns.split(' ').length;

it('balanced：放得下 3 列时 4 项排成 2 + 2，放得下 4 列时一行，窄到 1 列时一列', async () => {
  const root = mount(
    _component(() => () => (
      <div style="width: 37rem">
        <Grid minItemWidth="10rem" gap="md" balanced>
          {['a', 'b', 'c', 'd'].map((item) => (
            <div key={item}>{item}</div>
          ))}
        </Grid>
        <Grid minItemWidth="10rem" gap="md">
          {['a', 'b', 'c', 'd'].map((item) => (
            <div key={item}>{item}</div>
          ))}
        </Grid>
      </div>
    )),
  );
  const box = root.firstElementChild as HTMLElement;
  const [balanced, plain] = [...box.children];
  await expect.poll(() => columnCount(balanced!)).toBe(2);
  expect(columnCount(plain!)).toBe(3);

  box.style.width = '50rem';
  await expect.poll(() => columnCount(balanced!)).toBe(4);
  box.style.width = '8rem';
  await expect.poll(() => columnCount(balanced!)).toBe(1);
});

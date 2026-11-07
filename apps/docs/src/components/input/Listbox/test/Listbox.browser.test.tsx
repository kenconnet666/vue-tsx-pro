// Listbox 在真实浏览器里：根元素带部件标记，border-box——写的高度就是整个列表的高度（内边距算在里面）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Listbox } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

const styles = css.create({ list: { height: '16rem' } });
const options = Array.from({ length: 30 }, (_, index) => ({
  value: `${index}`,
  label: `选项 ${index}`,
}));

it('写 16rem 高就是 16rem 高；根元素是 data-scope="listbox" data-part="root"', async () => {
  const root = mount(
    _component(() => () => (
      <Listbox items={options} selectionMode="multiple" sx={styles.list} aria-label="选项" />
    )),
  );
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]')!;
  expect(listbox.dataset.scope).toBe('listbox');
  expect(listbox.dataset.part).toBe('root');
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  // 写在 sx 上的高度落在最外层（自己滚动时是 ScrollArea 的根），整块就是这么高
  const outer = root.firstElementChild!.getBoundingClientRect().height;
  expect(Math.abs(outer - 16 * rem)).toBeLessThan(1);
});

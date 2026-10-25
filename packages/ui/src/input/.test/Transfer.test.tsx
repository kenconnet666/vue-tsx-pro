// Transfer：勾上之后移到另一边（value 按移过去的先后）、全选只管看得见的能勾的项、双击直接移、不可用的选项移不动；
// 在 Field 里整体是一组。TreeTransfer 见文档站的浏览器测试（树要真实的布局）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { Transfer } from '../Transfer';

const fruits = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃', disabled: true },
  { value: 'grape', label: '葡萄' },
];

const flush = async () => {
  for (let index = 0; index < 4; index++) await nextTick();
};
const listboxes = (root: Element) => [...root.querySelectorAll<HTMLElement>('[role="listbox"]')];
const option = (list: Element, text: string) =>
  [...list.querySelectorAll<HTMLElement>('[role="option"]')].find((item) =>
    item.textContent?.includes(text),
  )!;
const texts = (list: Element) =>
  [...list.querySelectorAll('[role="option"]')].map((item) => item.textContent);

describe('Transfer', () => {
  it('勾上之后点按钮移到右边，value 按移过去的先后；再移回来', async () => {
    let value = _state(['grape']);
    const root = mount(() => (
      <Field label="水果">
        <Transfer items={fruits} _value={_bind(value)} />
      </Field>
    ));
    await flush();
    const group = root.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-labelledby')).toBe(root.querySelector('label')!.id);
    const [left, right] = listboxes(root);
    expect(texts(right!)).toEqual(['葡萄']);
    const [toRight, toLeft] = [
      ...root.querySelectorAll<HTMLButtonElement>('button[aria-label^="移到"]'),
    ];
    expect(toRight!.getAttribute('aria-label')).toBe('移到已选');
    expect(toRight!.disabled).toBe(true);
    option(left!, '香蕉').click();
    option(left!, '苹果').click();
    await flush();
    expect(toRight!.disabled).toBe(false);
    toRight!.click();
    await flush();
    expect(value).toEqual(['grape', 'banana', 'apple']);
    expect(texts(listboxes(root)[0]!)).toEqual(['樱桃']);
    option(listboxes(root)[1]!, '葡萄').click();
    await flush();
    toLeft!.click();
    await flush();
    expect(value).toEqual(['banana', 'apple']);
  });

  it('全选只勾看得见、能勾的项；双击一项直接移过去', async () => {
    let value = _state<string[]>([]);
    const root = mount(() => <Transfer items={fruits} _value={_bind(value)} searchable />);
    await flush();
    const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = '葡';
    search.dispatchEvent(new Event('input'));
    await flush();
    const selectAll = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    selectAll.click();
    await flush();
    root.querySelector<HTMLButtonElement>('button[aria-label="移到已选"]')!.click();
    await flush();
    expect(value).toEqual(['grape']);
    search.value = '';
    search.dispatchEvent(new Event('input'));
    await flush();
    // 樱桃不可用：全选也不勾它
    selectAll.click();
    await flush();
    root.querySelector<HTMLButtonElement>('button[aria-label="移到已选"]')!.click();
    await flush();
    expect(value).toEqual(['grape', 'apple', 'banana']);
    option(listboxes(root)[1]!, '苹果').dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true }),
    );
    await flush();
    expect(value).toEqual(['grape', 'banana']);
  });
});

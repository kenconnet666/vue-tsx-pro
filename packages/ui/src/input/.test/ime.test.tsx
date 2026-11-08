// 输入法：组合输入中（Chrome、Firefox 的 isComposing，Safari 确认用的 keydown 的 keyCode 229）按 Enter、方向键是给输入法的，
// TagsInput 不加标签、Combobox 不选中、Mentions 不提及、NumberField 不加减、Select 的搜索框退格不删已选项、CommandPalette 不执行
// （快捷键的见 utils/dom/.test/hotkeys.test.ts）；组合结束后照常
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Combobox } from '../Combobox';
import { CommandPalette } from '../../overlay/CommandPalette';
import { Mentions } from '../Mentions';
import { NumberField } from '../NumberField';
import { Select } from '../Select';
import { TagsInput } from '../TagsInput';

const flush = async () => {
  for (let index = 0; index < 4; index++) await nextTick();
};

/** 组合中的按键：Chrome / Firefox 带 isComposing，Safari 带 keyCode 229 */
const composingKey = (key: string, safari = false) =>
  new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...(safari ? { keyCode: 229 } : { isComposing: true }),
  });
const key = (name: string) =>
  new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });

/** 在输入框里打一段字（组合已经结束的文字） */
async function typeInto(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
  input.focus();
  input.value = text;
  input.setSelectionRange?.(text.length, text.length);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
  await flush();
}

describe('输入法', () => {
  it('TagsInput：组合中按 Enter 不加标签（两种浏览器的写法），组合结束后的 Enter 才加', async () => {
    let tags = _state<string[]>([]);
    const root = mount(() => <TagsInput _value={tags} aria-label="标签" />);
    const input = root.querySelector('input')!;
    await typeInto(input, '加急');
    input.dispatchEvent(composingKey('Enter'));
    input.dispatchEvent(composingKey('Enter', true));
    await flush();
    expect(tags).toEqual([]);
    input.dispatchEvent(key('Enter'));
    await flush();
    expect(tags).toEqual(['加急']);
  });

  it('Combobox：组合中的 ↓ 与 Enter 不移动高亮、不选中', async () => {
    let value = _state<string | null>(null);
    const root = mount(() => (
      <Combobox items={['北京', '北海']} _value={value} aria-label="城市" />
    ));
    const input = root.querySelector('input')!;
    await typeInto(input, '北');
    input.dispatchEvent(composingKey('ArrowDown'));
    input.dispatchEvent(composingKey('Enter'));
    await flush();
    expect(value).toBeNull();
    input.dispatchEvent(key('ArrowDown'));
    input.dispatchEvent(key('Enter'));
    await flush();
    expect(value).not.toBeNull();
  });

  it('NumberField：组合中的 ↑ ↓ 不加减（选候选），Enter 不提交；组合结束后照常', async () => {
    let value = _state<number | null>(5);
    const root = mount(() => <NumberField _value={value} aria-label="数量" />);
    const input = root.querySelector('input')!;
    input.focus();
    input.dispatchEvent(composingKey('ArrowUp'));
    input.dispatchEvent(composingKey('ArrowUp', true));
    await flush();
    expect(value).toBe(5);
    input.dispatchEvent(key('ArrowUp'));
    await flush();
    expect(value).toBe(6);
  });

  it('Select 的搜索框：组合中的退格不删已选的项', async () => {
    let value = _state<string[]>(['北京', '上海']);
    mount(() => (
      <Select
        items={['北京', '上海', '广州']}
        _value={value}
        selectionMode="multiple"
        searchable
        _open
        aria-label="城市"
      />
    ));
    await flush();
    const search = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.dispatchEvent(composingKey('Backspace'));
    await flush();
    expect(value).toEqual(['北京', '上海']);
    search.dispatchEvent(key('Backspace'));
    await flush();
    expect(value).toEqual(['北京']);
  });

  it('CommandPalette：组合中的 ↓ 不移动高亮、Enter 不执行；组合结束后照常', async () => {
    const run: string[] = [];
    mount(() => (
      <CommandPalette
        _open
        items={['新建采购单', '查找供应商']}
        hotkey={false}
        trigger={false}
        onAction={(item: string) => run.push(item)}
      />
    ));
    await flush();
    const input = document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    const active = () => input.getAttribute('aria-activedescendant');
    const before = active();
    input.dispatchEvent(composingKey('ArrowDown'));
    input.dispatchEvent(composingKey('Enter', true));
    await flush();
    expect(active()).toBe(before);
    expect(run).toEqual([]);
    input.dispatchEvent(key('ArrowDown'));
    await flush();
    input.dispatchEvent(key('Enter'));
    await flush();
    expect(run).toHaveLength(1);
  });

  it('Mentions：列表开着时组合中的 Enter 不提及', async () => {
    let text = _state('');
    const root = mount(() => (
      <Mentions
        _value={text}
        items={[
          { value: 'U1', label: '周宁' },
          { value: 'U2', label: '陆川' },
        ]}
        aria-label="留言"
      />
    ));
    const textarea = root.querySelector('textarea')!;
    await typeInto(textarea, '@');
    expect(document.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
    textarea.dispatchEvent(composingKey('Enter'));
    await flush();
    expect(text).toBe('@');
    textarea.dispatchEvent(key('Enter'));
    await flush();
    expect(text).toBe('@周宁 ');
  });
});

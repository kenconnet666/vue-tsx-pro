// 输入法：组合输入中（Chrome、Firefox 的 isComposing，Safari 确认用的 keydown 的 keyCode 229）按 Enter、方向键是给输入法的，
// TagsInput 不加标签、Combobox 不选中、Mentions 不提及（快捷键的见 utils/dom/.test/hotkeys.test.ts）；组合结束后照常
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Combobox } from '../Combobox';
import { Mentions } from '../Mentions';
import { TagsInput } from '../TagsInput';

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

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

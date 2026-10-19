// NumberField：按语言解析、提交时夹到范围并对齐步长、方向键与按钮加减
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { NumberField, parseNumber } from '../NumberField';

describe('parseNumber', () => {
  it.each([
    ['1,234.5', 'en-US', 1234.5],
    ['1.234,5', 'de-DE', 1234.5],
    ['１２．５', 'zh-CN', 12.5],
    ['－3', 'zh-CN', -3],
    [' 42 ', 'zh-CN', 42],
    ['.5', 'en-US', 0.5],
    ['', 'zh-CN', null],
  ])('%s（%s）→ %s', (text, locale, expected) => {
    expect(parseNumber(text, locale)).toBe(expected);
  });

  it('解析不了时为 NaN', () => {
    expect(parseNumber('12abc', 'zh-CN')).toBeNaN();
    expect(parseNumber('1-2', 'zh-CN')).toBeNaN();
  });
});

describe('NumberField', () => {
  const setup = (props: { min?: number; max?: number; step?: number } = {}) => {
    let value = _state<number | null>(5);
    const root = mount(() => <NumberField value={_bind(value)} aria-label="数量" {...props} />);
    const input = root.querySelector('input')!;
    const type = async (text: string) => {
      input.dispatchEvent(new FocusEvent('focus'));
      input.value = text;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new FocusEvent('blur'));
      await nextTick();
    };
    const key = async (name: string) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
      await nextTick();
    };
    return { root, input, type, key, value: () => value };
  };

  it('role="spinbutton" 带取值；失焦时夹到范围并对齐步长，解析不了时恢复原值，清空写回 null', async () => {
    const field = setup({ min: 0, max: 10, step: 0.5 });
    expect(field.input.getAttribute('role')).toBe('spinbutton');
    expect(field.input.getAttribute('aria-valuenow')).toBe('5');
    await field.type('7.3');
    expect(field.value()).toBe(7.5);
    await field.type('99');
    expect(field.value()).toBe(10);
    await field.type('abc');
    expect(field.value()).toBe(10);
    expect(field.input.value).toBe('10');
    await field.type('');
    expect(field.value()).toBeNull();
  });

  it('方向键加减 step，没有浮点误差；Home / End 到两端；按钮在边界时不可用', async () => {
    const field = setup({ min: 0, max: 1, step: 0.1 });
    await field.type('0.2');
    await field.key('ArrowUp');
    expect(field.value()).toBe(0.3);
    await field.key('End');
    expect(field.value()).toBe(1);
    const [decrement, increment] = field.root.querySelectorAll('button');
    expect([decrement!.disabled, increment!.disabled]).toEqual([false, true]);
    expect([decrement!.tabIndex, decrement!.getAttribute('aria-label')]).toEqual([-1, '减少']);
    decrement!.click();
    await nextTick();
    expect(field.value()).toBe(0.9);
  });
});

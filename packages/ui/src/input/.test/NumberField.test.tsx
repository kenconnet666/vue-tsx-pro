// NumberField：按语言解析、提交时夹到范围并对齐步长、方向键与按钮加减
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import Decimal from 'decimal.js';
import type { NumericValue } from '../../utils/data/numeric';
import { NumberField, parseNumber, type NumberFieldProps } from '../NumberField';

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

  it('按住增加按钮：先走一步，400ms 后每 60ms 一步，松开就停', async () => {
    vi.useFakeTimers();
    try {
      const field = setup({ max: 100 });
      const increment = field.root.querySelectorAll('button')[1]!;
      increment.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
      expect(field.value()).toBe(6);
      vi.advanceTimersByTime(399);
      expect(field.value()).toBe(6);
      vi.advanceTimersByTime(1 + 60 * 2);
      expect(field.value()).toBe(9);
      window.dispatchEvent(new PointerEvent('pointerup'));
      vi.advanceTimersByTime(1000);
      expect(field.value()).toBe(9);
      // 随后的 click 不再多走一步
      increment.click();
      expect(field.value()).toBe(9);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('NumberField 的值类型', () => {
  const mountField = (
    initial: NumericValue | null,
    props: Partial<Pick<NumberFieldProps, 'min' | 'max' | 'step' | 'valueType' | 'name'>> = {},
  ) => {
    let value = _state.raw<NumericValue | null>(initial);
    const root = mount(() => <NumberField value={_bind(value)} aria-label="金额" {...props} />);
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

  it('Decimal：加减与对齐步长精确运算，写回 Decimal', async () => {
    const field = mountField(new Decimal('0.1'), { step: new Decimal('0.1') });
    await field.key('ArrowUp');
    await field.key('ArrowUp');
    expect(field.value()).toBeInstanceOf(Decimal);
    expect((field.value() as Decimal).toString()).toBe('0.3');
    await field.type('12345678901234567.891');
    expect((field.value() as Decimal).toFixed()).toBe('12345678901234567.9');
  });

  it('bigint：超过 Number 精度的大整数不丢位，步长至少为 1', async () => {
    const field = mountField(9007199254740993n);
    await field.key('ArrowUp');
    expect(field.value()).toBe(9007199254740994n);
    await field.type('123456789012345678901.6');
    expect(field.value()).toBe(123456789012345678902n);
    expect(field.input.getAttribute('aria-valuenow')).toBe(String(Number(123456789012345678902n)));
  });

  it('一开始为空时按 valueType 写回；min 可以是 Decimal', async () => {
    const field = mountField(null, { valueType: Decimal, min: new Decimal('0.5') });
    await field.key('ArrowUp');
    expect(field.value()).toBeInstanceOf(Decimal);
    expect((field.value() as Decimal).toString()).toBe('0.5');
    const big = mountField(null, { valueType: 'bigint' });
    await big.type('42');
    expect(big.value()).toBe(42n);
  });

  it('表单提交十进制文本，不是显示的货币格式', async () => {
    let value = _state.raw<NumericValue | null>(new Decimal('1234.5'));
    const root = mount(() => (
      <form>
        <NumberField
          value={_bind(value)}
          name="price"
          format={{ style: 'currency', currency: 'CNY' }}
          aria-label="单价"
        />
      </form>
    ));
    expect(root.querySelector('input[role="spinbutton"]')!.hasAttribute('name')).toBe(false);
    expect(new FormData(root.querySelector('form')!).get('price')).toBe('1234.5');
  });
});

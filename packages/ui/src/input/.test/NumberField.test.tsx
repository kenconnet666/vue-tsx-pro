// NumberField：提交时夹到范围并对齐步长、方向键与按钮加减（按语言解析见 utils/data/.test/number-parse.test.ts）
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import Decimal from 'decimal.js';
import type { NumericValue } from '../../utils/data/numeric';
import { NumberField, type NumberFieldProps } from '../NumberField';

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

  it('只是聚焦再离开不改值：不对齐步长、不夹到范围，表单不会变脏', async () => {
    let value = _state<number | null>(12.345);
    const root = mount(() => (
      <NumberField value={_bind(value)} step={0.01} max={10} aria-label="单价" />
    ));
    const input = root.querySelector('input')!;
    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect(value).toBe(12.345);
  });

  it('编辑中按 Home / End：输入框的文字跟着换，失焦后仍是两端的值', async () => {
    const field = setup({ min: 0, max: 10 });
    field.input.dispatchEvent(new FocusEvent('focus'));
    await field.key('End');
    expect(field.input.value).toBe('10');
    field.input.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect(field.value()).toBe(10);
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

  it('format.scale：值是元，按万元显示与输入，写回时精确移位；单位在输入框里', async () => {
    let value = _state.raw<NumericValue | null>(new Decimal('155353.2'));
    const root = mount(() => (
      <NumberField
        value={_bind(value)}
        format={{ scale: 10_000, maximumFractionDigits: 2 }}
        suffix="万元"
        step={100}
        aria-label="单机降本"
      />
    ));
    const input = root.querySelector('input')!;
    expect(input.value).toBe('15.54');
    expect(root.textContent).toContain('万元');
    // 编辑时显示完整的值（不取舍小数位），输入的是万元
    input.dispatchEvent(new FocusEvent('focus'));
    await nextTick();
    expect(input.value).toBe('15.53532');
    input.value = '12.345678';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    // 步长 100 元：123456.78 元对齐到 123500
    expect((value as Decimal).toFixed()).toBe('123500');
    expect(input.value).toBe('12.35');
  });
});

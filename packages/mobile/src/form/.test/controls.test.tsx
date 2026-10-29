// 选择类控件：Switch、Checkbox（组的上限）、Radio、Stepper（范围、输入修正）、Rate（键盘）、Slider（拖动、区间、点轨道）、Uploader（选图、上限、删除）
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { measureAs, swipe, WithHost } from '../../utils/.test/touch';
import { Checkbox, CheckboxGroup, type ChoiceValue } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { Rate } from '../Rate';
import { Slider, type SliderValue } from '../Slider';
import { Stepper } from '../Stepper';
import { Switch } from '../Switch';
import { Uploader, type UploaderFile } from '../Uploader';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Switch', () => {
  it('点一下切换 aria-checked；加载中不切换', async () => {
    const on = ref(false);
    const loading = ref(false);
    const root = mount(() => <Switch _checked={on.value} loading={loading.value} />);
    const button = root.querySelector('button')!;
    button.click();
    await nextTick();
    expect(on.value).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
    loading.value = true;
    await nextTick();
    button.click();
    expect(on.value).toBe(true);
  });
});

describe('Checkbox / Radio', () => {
  it('复选框组：点选写回数组，选满 max 后其余禁用', async () => {
    const picked = ref<ChoiceValue[]>(['a']);
    const root = mount(() => (
      <CheckboxGroup _value={picked.value} max={2}>
        <Checkbox name="a">甲</Checkbox>
        <Checkbox name="b">乙</Checkbox>
        <Checkbox name="c">丙</Checkbox>
      </CheckboxGroup>
    ));
    const boxes = root.querySelectorAll<HTMLButtonElement>('[role="checkbox"]');
    boxes[1]!.click();
    await nextTick();
    expect(picked.value).toEqual(['a', 'b']);
    expect(boxes[2]!.disabled).toBe(true);
    boxes[0]!.click();
    await nextTick();
    expect(picked.value).toEqual(['b']);
    expect(boxes[2]!.disabled).toBe(false);
  });

  it('单选组：选中一项，aria-checked 跟着变', async () => {
    const value = ref<ChoiceValue>('express');
    const root = mount(() => (
      <RadioGroup _value={value.value}>
        <Radio name="express">快递</Radio>
        <Radio name="pickup">自提</Radio>
      </RadioGroup>
    ));
    const radios = root.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    radios[1]!.click();
    await nextTick();
    expect(value.value).toBe('pickup');
    expect([...radios].map((radio) => radio.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
    ]);
  });
});

describe('Stepper', () => {
  it('加减按步长，到边界时按钮禁用；输入的数失焦时按范围修正', async () => {
    const count = ref(1);
    const root = mount(() => <Stepper _value={count.value} min={1} max={3} />);
    const [minus, plus] = root.querySelectorAll('button');
    expect(minus!.disabled).toBe(true);
    plus!.click();
    plus!.click();
    await nextTick();
    expect(count.value).toBe(3);
    expect(plus!.disabled).toBe(true);
    const input = root.querySelector('input')!;
    input.value = '99';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await nextTick();
    expect(count.value).toBe(3);
    expect(input.value).toBe('3');
  });

  it('小数步长按位数保留', async () => {
    const weight = ref(1);
    const root = mount(() => <Stepper _value={weight.value} step={0.1} min={0} />);
    root.querySelectorAll('button')[1]!.click();
    root.querySelectorAll('button')[1]!.click();
    await nextTick();
    expect(weight.value).toBe(1.2);
    expect(root.querySelector('input')!.value).toBe('1.2');
  });
});

describe('Rate', () => {
  it('方向键按一颗（或半颗）加减；只读时不变', async () => {
    const score = ref(3);
    const root = mount(() => <Rate _value={score.value} allowHalf />);
    const slider = root.querySelector<HTMLElement>('[role="slider"]')!;
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await nextTick();
    expect(score.value).toBe(3.5);
    expect(slider.getAttribute('aria-valuenow')).toBe('3.5');

    const fixed = mount(() => <Rate _value={4} readonly />);
    expect(fixed.querySelector('[role="slider"]')!.hasAttribute('tabindex')).toBe(false);
  });
});

describe('Slider', () => {
  it('横着拖动按位置取值，松手时 onChange；区间拖过另一端时两端互换', async () => {
    const volume = ref<SliderValue>(0);
    const onChange = vi.fn();
    const root = mount(() => (
      <WithHost host={{ measure: measureAs({ left: 0, width: 200 }) }}>
        <Slider _value={volume.value} onChange={onChange} />
      </WithHost>
    ));
    const slider = root.firstElementChild!;
    slider.dispatchEvent(
      Object.assign(new Event('touchstart', { bubbles: true }), {
        touches: [{ clientX: 0, clientY: 10 }],
      }),
    );
    await wait();
    swipe(slider, [0, 10], [100, 12]);
    await nextTick();
    expect(volume.value).toBe(50);
    expect(onChange).toHaveBeenLastCalledWith(50);

    const price = ref<SliderValue>([20, 40]);
    const range = mount(() => (
      <WithHost host={{ measure: measureAs({ left: 0, width: 100 }) }}>
        <Slider _value={price.value} />
      </WithHost>
    ));
    const thumbs = range.querySelectorAll<HTMLElement>('[role="slider"]');
    expect(thumbs).toHaveLength(2);
    thumbs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(price.value).toEqual([21, 40]);
    const box = range.firstElementChild!;
    box.dispatchEvent(
      Object.assign(new Event('touchstart', { bubbles: true }), {
        touches: [{ clientX: 21, clientY: 0 }],
      }),
    );
    await wait();
    swipe(box, [21, 0], [60, 1]);
    expect(price.value).toEqual([40, 60]);
  });
});

describe('Uploader', () => {
  it('选图加到列表并 onRead；到 maxCount 时不再显示选图；删除', async () => {
    const files = ref<UploaderFile[]>([]);
    const onRead = vi.fn();
    const chooseImages = vi.fn(async ({ count }: { count: number }) =>
      Array.from({ length: count }, (_, index) => ({ url: `blob:${index}`, size: 100 })),
    );
    const root = mount(() => (
      <WithHost host={{ chooseImages }}>
        <Uploader _value={files.value} maxCount={2} onRead={onRead} />
      </WithHost>
    ));
    root.querySelector<HTMLButtonElement>('button')!.click();
    await wait();
    await nextTick();
    expect(chooseImages).toHaveBeenCalledWith({ count: 2 });
    expect(files.value.map((file) => file.url)).toEqual(['blob:0', 'blob:1']);
    expect(onRead.mock.calls[0]![0]).toHaveLength(2);
    expect(root.textContent).not.toContain('上传图片');

    root.querySelector<HTMLButtonElement>('button[aria-label="删除"]')!.click();
    await nextTick();
    expect(files.value.map((file) => file.url)).toEqual(['blob:1']);
    expect(root.textContent).toContain('上传图片');
  });
});

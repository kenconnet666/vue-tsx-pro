// 滑块的取值、键盘与无障碍属性；真实拖动见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Field } from '../../form/Field';
import { Slider } from '../Slider';

const thumbOf = (root: Element) => root.querySelector<HTMLElement>('[role="slider"]')!;
const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('Slider', () => {
  it('滑块是 role="slider"，带取值范围与名称；属性落到滑块上', () => {
    const root = mount(() => <Slider _value={30} aria-label="音量" valueText={(v) => `${v}%`} />);
    const thumb = thumbOf(root);
    expect(thumb.getAttribute('aria-label')).toBe('音量');
    expect(thumb.getAttribute('aria-valuemin')).toBe('0');
    expect(thumb.getAttribute('aria-valuemax')).toBe('100');
    expect(thumb.getAttribute('aria-valuenow')).toBe('30');
    expect(thumb.getAttribute('aria-valuetext')).toBe('30%');
    expect(thumb.getAttribute('aria-orientation')).toBe('horizontal');
    expect(thumb.getAttribute('tabindex')).toBe('0');
  });

  it('键盘：方向键 ±step、Page 键 ±bigStep、Home/End 到两端，夹在范围内；每次都提交', async () => {
    let value = _state(50);
    const commit = vi.fn();
    const root = mount(() => (
      <Slider _value={value} step={5} aria-label="x" onValueCommit={commit} />
    ));
    const thumb = thumbOf(root);
    key(thumb, 'ArrowRight');
    expect(value).toBe(55);
    key(thumb, 'ArrowDown');
    expect(value).toBe(50);
    key(thumb, 'PageUp');
    expect(value).toBe(60);
    key(thumb, 'End');
    key(thumb, 'ArrowUp');
    expect(value).toBe(100);
    key(thumb, 'Home');
    expect(value).toBe(0);
    expect(commit).toHaveBeenLastCalledWith(0);
    await nextTick();
    expect(thumb.getAttribute('aria-valuenow')).toBe('0');
  });

  it('小数步长不带浮点误差', () => {
    let value = _state(0.1);
    const root = mount(() => <Slider _value={value} min={0} max={1} step={0.1} aria-label="x" />);
    key(thumbOf(root), 'ArrowRight');
    key(thumbOf(root), 'ArrowRight');
    expect(value).toBe(0.3);
  });

  it('点击轨道跳到对应位置（按轨道的位置换算并对齐步长）', () => {
    let value = _state(0);
    const root = mount(() => <Slider _value={value} step={10} aria-label="x" />);
    const track = thumbOf(root).previousElementSibling as HTMLElement;
    track.getBoundingClientRect = () =>
      ({ left: 0, width: 200, top: 0, bottom: 10, height: 10 }) as DOMRect;
    root.firstElementChild!.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 130, button: 0, pointerId: 1, bubbles: true }),
    );
    expect(value).toBe(70);
  });

  it('不可用：不能聚焦，键盘与指针都不改值；同原生的不可用控件，不随表单提交', () => {
    let value = _state(20);
    const root = mount(() => <Slider _value={value} disabled name="volume" aria-label="x" />);
    const thumb = thumbOf(root);
    expect(thumb.hasAttribute('tabindex')).toBe(false);
    expect(thumb.getAttribute('aria-disabled')).toBe('true');
    key(thumb, 'ArrowRight');
    expect(value).toBe(20);
    expect(root.querySelector('input[name="volume"]')).toBeNull();
  });
});

describe('Slider 的部件属性', () => {
  it('轨道与已选范围都能加属性', () => {
    const root = mount(() => (
      <Slider
        _value={30}
        aria-label="x"
        propsTrack={{ class: 'track' }}
        propsRange={{ class: 'range' }}
      />
    ));
    expect(root.querySelector('.track > .range')).not.toBeNull();
  });
});

describe('Slider 的边界情况', () => {
  it('父级传入超出范围的值时按范围内显示，滑块不跑出轨道', () => {
    const root = mount(() => <Slider _value={150} aria-label="x" />);
    expect(thumbOf(root).getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('Slider 的范围选择', () => {
  it('两个滑块：名称加上最小值 / 最大值，取值范围互相限制，键盘不能交叉', async () => {
    let range = _state<[number, number]>([20, 60]);
    const commit = vi.fn();
    const root = mount(() => (
      <Slider _value={range} step={10} aria-label="价格" name="price" onValueCommit={commit} />
    ));
    const [low, high] = root.querySelectorAll<HTMLElement>('[role="slider"]');
    expect(low!.getAttribute('aria-label')).toBe('价格 最小值');
    expect(high!.getAttribute('aria-label')).toBe('价格 最大值');
    expect([low!.getAttribute('aria-valuemax'), high!.getAttribute('aria-valuemin')]).toEqual([
      '60',
      '20',
    ]);
    key(low!, 'End');
    expect(range).toEqual([60, 60]);
    expect(commit).toHaveBeenLastCalledWith([60, 60]);
    key(high!, 'Home');
    expect(range).toEqual([60, 60]);
    key(high!, 'ArrowRight');
    expect(range).toEqual([60, 70]);
    await nextTick();
    expect(
      [...root.querySelectorAll<HTMLInputElement>('input[name="price"]')].map((i) => i.value),
    ).toEqual(['60', '70']);
  });

  it('点击轨道移动离得近的那个滑块', () => {
    let range = _state<[number, number]>([20, 60]);
    const root = mount(() => <Slider _value={range} aria-label="x" />);
    const track = root.querySelector<HTMLElement>('[role="slider"]')!
      .previousElementSibling as HTMLElement;
    track.getBoundingClientRect = () =>
      ({ left: 0, width: 100, top: 0, bottom: 10, height: 10 }) as DOMRect;
    root.firstElementChild!.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 90, button: 0, pointerId: 1, bubbles: true }),
    );
    expect(range).toEqual([20, 90]);
  });

  it('在 Field 里：名称连上隐藏的“最小值 / 最大值”', () => {
    const root = mount(() => (
      <Field label="价格">
        <Slider _value={[1, 2]} />
      </Field>
    ));
    const [low] = root.querySelectorAll<HTMLElement>('[role="slider"]');
    const ids = low!.getAttribute('aria-labelledby')!.split(' ');
    expect(ids.map((id) => document.getElementById(id)!.textContent)).toEqual(['价格', '最小值']);
  });
});

describe('Slider 的刻度', () => {
  it('每个刻度一个点，在已选范围里的点标记出来；有文字的刻度显示文字', () => {
    const root = mount(() => (
      <Slider
        _value={50}
        aria-label="x"
        marks={[0, { value: 50, label: '一半' }, 100]}
        propsMark={(mark) => ({ class: `mark-${mark.value}` })}
      />
    ));
    expect(root.querySelectorAll('[class^="mark-"]')).toHaveLength(3);
    expect(root.textContent).toBe('一半');
  });
});

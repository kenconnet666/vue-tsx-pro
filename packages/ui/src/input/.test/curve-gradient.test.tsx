// 曲线编辑与渐变编辑：取值的规则（和画出来的一样）、键盘改值、加删，每次操作都提交
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { CurveField, evaluateCurve, type CurveKey } from '../CurveField';
import { GradientField, gradientCss, sampleGradient, type GradientStop } from '../GradientField';

const key = (element: HTMLElement, name: string, shiftKey = false) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, shiftKey, bubbles: true }));

describe('evaluateCurve', () => {
  const keys: CurveKey[] = [
    { x: 0, y: 0 },
    { x: 0.5, y: 1 },
    { x: 1, y: 0 },
  ];
  it('折线、阶梯；两头之外取端点的值', () => {
    expect(evaluateCurve(keys, 0.25)).toBeCloseTo(0.5);
    expect(evaluateCurve(keys, 0.75, 'step')).toBe(1);
    expect(evaluateCurve(keys, -1)).toBe(0);
    expect(evaluateCurve(keys, 2)).toBe(0);
  });
  it('平滑：过关键帧，峰值不冲过头（单调三次）', () => {
    expect(evaluateCurve(keys, 0.5, 'smooth')).toBeCloseTo(1);
    for (let x = 0; x <= 1; x += 0.01)
      expect(evaluateCurve(keys, x, 'smooth')).toBeLessThanOrEqual(1 + 1e-9);
  });
});

describe('CurveField', () => {
  it('关键帧可聚焦、读屏念坐标；方向键挪（Shift 十倍），不越过相邻的帧；每次都提交', () => {
    let value = _state<readonly CurveKey[]>([
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
    ]);
    const commit = vi.fn();
    const root = mount(() => (
      <CurveField
        _value={value}
        yMin={0}
        yMax={1}
        xStep={0.1}
        yStep={0.1}
        aria-label="曲线"
        onValueCommit={commit}
      />
    ));
    const middle = root.querySelectorAll<HTMLElement>('[data-part="key"]')[1]!;
    expect(middle.getAttribute('tabindex')).toBe('0');
    expect(middle.getAttribute('aria-label')).toBe('关键帧 x 0.5，y 0.5');
    key(middle, 'ArrowUp');
    expect(value[1]).toEqual({ x: 0.5, y: 0.6 });
    key(middle, 'ArrowRight', true);
    // 往右十步会越过最后一帧，夹在它的位置
    expect(value[1]!.x).toBe(1);
    expect(commit).toHaveBeenCalledTimes(2);
  });

  it('Insert 在下一帧中间加一帧（值取曲线上的），Delete 删一帧，至少留一个', async () => {
    let value = _state<readonly CurveKey[]>([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    const root = mount(() => <CurveField _value={value} aria-label="曲线" />);
    const keys = () => root.querySelectorAll<HTMLElement>('[data-part="key"]');
    key(keys()[0]!, 'Insert');
    await nextTick();
    expect(value).toEqual([
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
    ]);
    key(keys()[2]!, 'Delete');
    key(keys()[1]!, 'Delete');
    await nextTick();
    expect(value.length).toBe(1);
    key(keys()[0]!, 'Delete');
    expect(value.length).toBe(1);
  });

  it('没给 yStep 时步长取整（范围 1.1 时一步 0.01），挪出来的值是整的', () => {
    let value = _state<readonly CurveKey[]>([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    const root = mount(() => <CurveField _value={value} aria-label="曲线" />);
    const last = root.querySelectorAll<HTMLElement>('[data-part="key"]')[1]!;
    key(last, 'ArrowUp');
    key(last, 'ArrowUp');
    expect(value[1]!.y).toBe(1.02);
  });

  it('只读、不可用时键盘不改值', () => {
    let value = _state<readonly CurveKey[]>([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    const root = mount(() => <CurveField _value={value} readonly aria-label="曲线" />);
    key(root.querySelector<HTMLElement>('[data-part="key"]')!, 'ArrowUp');
    expect(value[0]).toEqual({ x: 0, y: 0 });
  });
});

describe('sampleGradient、gradientCss', () => {
  const stops: GradientStop[] = [
    { offset: 0, color: '#ff0000ff' },
    { offset: 1, color: '#0000ff00' },
  ];
  it('相邻色标线性插值，透明度一起插；两头之外取端点', () => {
    expect(sampleGradient(stops, 0.5)).toBe('#800080' + '80');
    expect(sampleGradient(stops, -1)).toBe('#ff0000ff');
    expect(gradientCss(stops)).toBe('linear-gradient(to right, #ff0000ff 0%, #0000ff00 100%)');
  });
});

describe('GradientField', () => {
  it('色标是 role="slider"，念位置和颜色；方向键挪、越过别的色标时重新排序，选中的跟着', async () => {
    let value = _state<readonly GradientStop[]>([
      { offset: 0, color: '#ffffff' },
      { offset: 0.5, color: '#808080' },
      { offset: 1, color: '#000000' },
    ]);
    const commit = vi.fn();
    const root = mount(() => (
      <GradientField _value={value} aria-label="渐变" onValueCommit={commit} />
    ));
    const stops = () => root.querySelectorAll<HTMLElement>('[role="slider"]');
    expect(stops()[1]!.getAttribute('aria-valuetext')).toBe('50%，#808080');
    key(stops()[0]!, 'End');
    await nextTick();
    // 白的挪到 1：越过灰的，和黑的同一位置时排在它后面（往右挪就是越过它）
    expect(value.map((s) => s.color)).toEqual(['#808080', '#000000', '#ffffff']);
    expect(value[2]!.offset).toBe(1);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('Insert 加一个插值出来的色标，Delete 删掉，至少留一个', async () => {
    let value = _state<readonly GradientStop[]>([
      { offset: 0, color: '#000000' },
      { offset: 1, color: '#ffffff' },
    ]);
    const root = mount(() => <GradientField _value={value} aria-label="渐变" />);
    const stops = () => root.querySelectorAll<HTMLElement>('[role="slider"]');
    key(stops()[0]!, 'Insert');
    await nextTick();
    expect(value[1]).toEqual({ offset: 0.5, color: '#808080ff' });
    key(stops()[1]!, 'Delete');
    key(stops()[0]!, 'Delete');
    await nextTick();
    expect(value.length).toBe(1);
  });
});

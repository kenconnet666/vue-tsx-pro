// 拖动工具：位移、阈值、结束与取消；真实浏览器里的指针捕获见各组件的浏览器测试
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startMove } from '../move';

const pointer = (type: string, x: number, y = 0, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    clientX: x,
    clientY: y,
    pointerId: 1,
    button: 0,
    bubbles: true,
    ...init,
  });

/** 在元素上按下并开始跟踪；返回元素以便继续派发事件 */
function press(options: Parameters<typeof startMove>[1], init: PointerEventInit = {}) {
  const element = document.createElement('div');
  document.body.append(element);
  let cancel = () => {};
  element.addEventListener('pointerdown', (event) => (cancel = startMove(event, options)));
  element.dispatchEvent(pointer('pointerdown', 10, 10, init));
  return { element, cancel: () => cancel() };
}

describe('startMove', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.style.userSelect = '';
  });

  it('报告相对按下位置的位移；松开时结束并恢复文字选择', () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const { element } = press({ onMove, onEnd });
    expect(document.documentElement.style.userSelect).toBe('none');
    element.dispatchEvent(pointer('pointermove', 25, 4));
    expect(onMove).toHaveBeenLastCalledWith(
      { clientX: 25, clientY: 4, deltaX: 15, deltaY: -6 },
      expect.any(PointerEvent),
    );
    element.dispatchEvent(pointer('pointerup', 25, 4));
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ moved: true, cancelled: false }));
    expect(document.documentElement.style.userSelect).toBe('');
    // 结束后不再报告
    element.dispatchEvent(pointer('pointermove', 50, 4));
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('位移不到阈值时不算拖动；超过后拖动结束时吞掉随后的 click', () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const { element } = press({ onMove, onEnd, threshold: 5 });
    element.dispatchEvent(pointer('pointermove', 12, 10));
    expect(onMove).not.toHaveBeenCalled();
    element.dispatchEvent(pointer('pointermove', 20, 10));
    expect(onMove).toHaveBeenCalledTimes(1);
    element.dispatchEvent(pointer('pointerup', 20, 10));
    const click = vi.fn();
    element.addEventListener('click', click);
    element.click();
    expect(click).not.toHaveBeenCalled();
  });

  it('阈值为 0 时默认不吞 click；swallowClick 时照样吞（捕获在祖先上、click 会落到祖先的情形）', () => {
    const plain = press({ onMove: vi.fn() });
    plain.element.dispatchEvent(pointer('pointerup', 10, 10));
    const click = vi.fn();
    plain.element.addEventListener('click', click);
    plain.element.click();
    expect(click).toHaveBeenCalledTimes(1);

    const swallowed = press({ onMove: vi.fn(), swallowClick: true });
    swallowed.element.dispatchEvent(pointer('pointerup', 10, 10));
    const later = vi.fn();
    swallowed.element.addEventListener('click', later);
    swallowed.element.click();
    expect(later).not.toHaveBeenCalled();
  });

  it('pointercancel 与提前结束都按取消处理；其他指针的事件不理会', () => {
    const onEnd = vi.fn();
    const onMove = vi.fn();
    const { element } = press({ onMove, onEnd });
    element.dispatchEvent(pointer('pointermove', 30, 0, { pointerId: 2 }));
    expect(onMove).not.toHaveBeenCalled();
    element.dispatchEvent(pointer('pointercancel', 30, 0));
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true, moved: true }));

    const second = vi.fn();
    press({ onMove, onEnd: second }).cancel();
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
  });

  it('不是主按钮（如右键）时不开始', () => {
    const onEnd = vi.fn();
    const { cancel } = press({ onMove: vi.fn(), onEnd }, { button: 2 });
    cancel();
    expect(onEnd).not.toHaveBeenCalled();
    expect(document.documentElement.style.userSelect).toBe('');
  });
});

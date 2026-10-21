// 数值的小工具：夹在范围内、对齐到步长
import { describe, expect, it } from 'vitest';
import { clamp, snapToStep } from '../number';

describe('snapToStep', () => {
  it('对齐到 min + n × step、夹在范围里；结果不带浮点误差', () => {
    expect(snapToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(snapToStep(7.3, 0.5, 0, 10)).toBe(7.5);
    expect(snapToStep(99, 1, 0, 10)).toBe(10);
    expect(snapToStep(4, 3, 1)).toBe(4);
  });

  it('步长很小（String 写成科学计数法的 1e-7）也按它的小数位取整，不被取成 0', () => {
    expect(snapToStep(3e-7, 1e-7)).toBe(3e-7);
    expect(snapToStep(3.04e-7, 1e-7)).toBe(3e-7);
  });
});

it('clamp：夹在 [min, max] 之间', () => {
  expect([clamp(-1, 0, 10), clamp(5, 0, 10), clamp(11, 0, 10)]).toEqual([0, 5, 10]);
});

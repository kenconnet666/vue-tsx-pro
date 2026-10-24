// Sparkline：读屏的概括、空值处断开、柱从 0 起；Gauge：meter 的取值与念法、数值弧取所在区间的色调
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Gauge } from '../Gauge';
import { Sparkline } from '../Sparkline';

describe('Sparkline', () => {
  it('role=img，名称是 label 加上概括（几个值、从哪到哪、最低最高）', () => {
    const root = mount(() => <Sparkline data={[40, 70, 360, 150]} label="近 4 个月" />);
    const image = root.querySelector('[role="img"]')!;
    expect(image.getAttribute('aria-label')).toBe(
      '近 4 个月：4 个值，从 40 到 150，最低 40，最高 360',
    );
    expect(root.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('空值处断开成两段；默认标出最后一个点', () => {
    const root = mount(() => <Sparkline data={[1, 2, null, 4, 5]} />);
    expect(root.querySelectorAll('svg path')).toHaveLength(2);
    expect(root.querySelector('[role="img"] > span[aria-hidden]')).not.toBeNull();
  });

  it('柱：每个值一根（空值是空位），不标最后一个点；Decimal 按原值念', () => {
    const root = mount(() => (
      <Sparkline
        data={[new Decimal('1.5'), null, 3]}
        variant="bar"
        valueFormat={{ suffix: '万' }}
      />
    ));
    expect(root.querySelectorAll('rect')).toHaveLength(2);
    expect(root.querySelector('[role="img"] > span[aria-hidden]')).toBeNull();
    expect(root.querySelector('[role="img"]')!.getAttribute('aria-label')).toContain('从 1.5 万');
  });

  it('没有值时念“—”，什么也不画', () => {
    const root = mount(() => <Sparkline data={[null, undefined]} />);
    expect(root.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('—');
    expect(root.querySelector('svg path')).toBeNull();
  });
});

describe('Gauge', () => {
  it('meter：取值范围、当前值（夹在范围里）、格式化的数值与目标', () => {
    const root = mount(() => (
      <Gauge value={0.82} max={1} valueFormat={{ style: 'percent' }} target={0.9} label="完成率" />
    ));
    const meter = root.querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-label')).toBe('完成率');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('1');
    expect(meter.getAttribute('aria-valuenow')).toBe('0.82');
    expect(meter.getAttribute('aria-valuetext')).toBe('82%，目标 90%');
    expect(meter.textContent).toContain('82%');
    // 目标刻度
    expect(root.querySelector('line')).not.toBeNull();
  });

  it('外圈按区间分段；超出范围的值画满、念原值', () => {
    const root = mount(() => (
      <Gauge
        value={120}
        unit="分"
        bands={[
          { to: 60, tone: 'danger' },
          { to: 100, tone: 'success' },
        ]}
      />
    ));
    // 轨道、数值弧、两段区间
    expect(root.querySelectorAll('path')).toHaveLength(4);
    const meter = root.querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-valuenow')).toBe('100');
    expect(meter.getAttribute('aria-valuetext')).toBe('120 分');
  });
});

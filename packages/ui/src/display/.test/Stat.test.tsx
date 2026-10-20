// Stat：dl 结构、数值格式、单位、变化量的方向与色调、加载骨架（滚动见 AnimatedNumber）
import { ClipboardList } from '@lucide/icons';
import { expect, it, vi } from 'vitest';
import { shimmerStyles } from '../../utils/style/shimmer';
import { hasStyles, mount } from '../../utils/.test/mount';
import { Stat } from '../Stat';

it('指标名是 dt、数值与单位是 dd；数字按语言格式化，图标对读屏隐藏', () => {
  const root = mount(() => (
    <Stat
      label="预期降本金额"
      value={1087.5}
      format={{ minimumFractionDigits: 2 }}
      unit="万元"
      icon={ClipboardList}
    />
  ));
  // dl 的子元素只有 dt、dd；图标在 dt 里
  expect([...root.querySelector('dl')!.children].map((child) => child.tagName)).toEqual([
    'DT',
    'DD',
  ]);
  expect(root.querySelector('dt')!.textContent).toBe('预期降本金额');
  const value = root.querySelector('dd')!;
  expect(value.querySelector('[aria-hidden="true"]')!.textContent).toBe('1,087.50');
  expect(value.textContent).toContain('万元');
  expect(root.querySelector('dt [aria-hidden="true"] svg')).not.toBeNull();
});

it('字符串值原样显示', () => {
  const root = mount(() => <Stat label="状态" value="—" />);
  expect(root.querySelector('dd')!.textContent).toBe('—');
});

it('变化量：默认百分比带符号；上升为成功色、下降为危险色，invertChange 反过来', () => {
  const root = mount(() => (
    <>
      <Stat label="a" value={1} change={0.123} changeLabel="较上月" />
      <Stat label="b" value={1} change={-0.05} />
      <Stat label="c" value={1} change={-0.05} invertChange />
      <Stat label="d" value={1} change={0} />
    </>
  ));
  const changes = [...root.querySelectorAll('[data-trend]')];
  expect(changes.map((dd) => dd.getAttribute('data-trend'))).toEqual([
    'up',
    'down',
    'down',
    'flat',
  ]);
  expect(changes[0]!.textContent).toContain('+12.3%');
  expect(changes[0]!.textContent).toContain('较上月');
  const tone = (dd: Element) => dd.firstElementChild!.className;
  expect(tone(changes[1]!)).not.toBe(tone(changes[2]!));
  expect(tone(changes[0]!)).toBe(tone(changes[2]!));
});

it('loading：指标名照常显示，数值与变化量换成对读屏隐藏的骨架，dl 带 aria-busy', () => {
  const dl = mount(() => (
    <Stat label="营收" value={1200} unit="万元" change={0.1} loading />
  )).firstElementChild!;
  expect(dl.getAttribute('aria-busy')).toBe('true');
  expect(dl.querySelector('dt')!.textContent).toBe('营收');
  const values = dl.querySelectorAll('dd');
  expect(values).toHaveLength(2);
  for (const dd of values) {
    expect(dd.textContent).toBe('');
    expect(dd.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  }
});

it('骨架换回数值时数值与变化量淡入；一开始就有数值时不淡入', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  try {
    let loading = _state(false);
    const dl = mount(() => (
      <Stat label="营收" value={1200} change={0.1} loading={loading} />
    )).firstElementChild!;
    const values = () => [...dl.querySelectorAll('dd')];
    expect(values().some((dd) => hasStyles(dd, shimmerStyles.reveal))).toBe(false);
    loading = true;
    await vi.advanceTimersByTimeAsync(200);
    expect(values()[0]!.textContent).toBe('');
    loading = false;
    await vi.advanceTimersByTimeAsync(500);
    expect(values().every((dd) => hasStyles(dd, shimmerStyles.reveal))).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

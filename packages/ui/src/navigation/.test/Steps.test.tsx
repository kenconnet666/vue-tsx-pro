// Steps：当前步、点回已完成的步骤、每步的状态、竖排与读屏文字
import { Star } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Steps } from '../Steps';

describe('Steps', () => {
  const items = [{ title: '填写' }, { title: '确认', description: '核对信息' }, { title: '完成' }];

  it('ol 列表；当前步骤带 aria-current="step"；状态写在 data-state', () => {
    const root = mount(() => <Steps items={items} current={1} aria-label="下单" />);
    const steps = [...root.querySelectorAll('li')];
    expect(steps.map((step) => step.dataset.state)).toEqual(['complete', 'current', 'upcoming']);
    expect(steps[1]!.getAttribute('aria-current')).toBe('step');
    expect(steps[1]!.textContent).toContain('核对信息');
    // 已完成的显示对勾图标，其余显示序号
    expect(steps[0]!.querySelector('svg')).not.toBeNull();
    expect(steps[2]!.textContent).toContain('3');
  });

  it('navigable 时已完成的步骤是按钮，点了写回 current；不写时不能点', async () => {
    let step = _state(2);
    const root = mount(() => <Steps items={items} current={_bind(step)} navigable />);
    const buttons = root.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    buttons[0]!.click();
    await nextTick();
    expect(step).toBe(0);
    expect(mount(() => <Steps items={items} current={2} />).querySelector('button')).toBeNull();
  });

  it('已完成且有 href 的步骤是链接；disabled 的不是', () => {
    const linked = [
      { title: '概览', href: '/task/1' },
      { title: '测算', href: '/task/1/calc', disabled: true },
      { title: '认定', href: '/task/1/confirm' },
    ];
    const links = mount(() => <Steps items={linked} current={2} />).querySelectorAll('a');
    expect([...links].map((link) => link.getAttribute('href'))).toEqual(['/task/1']);
  });

  it('status 改写推出的状态；已完成、未开始、出错有读屏文字，当前步骤由 aria-current 表达', () => {
    const flow = [
      { title: '提出' },
      { title: '测算', status: 'error' as const },
      { title: '认定' },
    ];
    const steps = [...mount(() => <Steps items={flow} current={1} />).querySelectorAll('li')];
    expect(steps.map((step) => step.dataset.state)).toEqual(['complete', 'error', 'upcoming']);
    expect(steps.map((step) => step.textContent)).toEqual([
      '提出（已完成）',
      expect.stringContaining('测算（出错）'),
      expect.stringContaining('认定（未开始）'),
    ]);
    expect(steps[1]!.hasAttribute('aria-current')).toBe(false);
  });

  it('竖排时最后一步之外都有连接线', () => {
    const root = mount(() => (
      <Steps items={items} current={1} orientation="vertical" propsConnector={{ class: 'line' }} />
    ));
    expect(root.querySelectorAll('.line')).toHaveLength(2);
  });

  it('步骤的 icon 代替序号；已完成的仍显示对勾', () => {
    const withIcons = items.map((item) => ({ ...item, icon: Star }));
    const steps = [...mount(() => <Steps items={withIcons} current={1} />).querySelectorAll('li')];
    expect(steps.map((step) => step.querySelector('svg') != null)).toEqual([true, true, true]);
    expect(steps[2]!.textContent).not.toContain('3');
  });
});

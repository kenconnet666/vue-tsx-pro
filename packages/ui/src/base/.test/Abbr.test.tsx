// Abbr：abbr 元素，全称在提示里（不用原生 title）；能聚焦，触屏点一下打开提示，读屏把全称当作描述
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Abbr } from '../Abbr';

describe('Abbr', () => {
  it('渲染 abbr，可以聚焦，不写原生 title；提示的内容是全称、与 abbr 用 aria-describedby 关联', async () => {
    const root = mount(() => <Abbr title="服务等级协议">SLA</Abbr>);
    await nextTick();
    const abbr = root.querySelector('abbr')!;
    expect(abbr.textContent).toBe('SLA');
    expect(abbr.hasAttribute('title')).toBe(false);
    expect(abbr.getAttribute('tabindex')).toBe('0');
    const tooltip = document.getElementById(abbr.getAttribute('aria-describedby')!)!;
    expect(tooltip.textContent).toBe('服务等级协议');
    expect(tooltip.getAttribute('role')).toBe('tooltip');
  });

  it('点一下（触屏没有悬停）打开提示', async () => {
    const root = mount(() => <Abbr title="服务等级协议">SLA</Abbr>);
    await nextTick();
    const abbr = root.querySelector('abbr')!;
    const tooltip = document.getElementById(abbr.getAttribute('aria-describedby')!)!;
    expect(tooltip.dataset.state).not.toBe('open');
    abbr.click();
    for (let i = 0; i < 3; i++) await nextTick();
    expect(tooltip.dataset.state).toBe('open');
  });
});

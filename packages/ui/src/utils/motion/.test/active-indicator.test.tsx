// useActiveIndicator：挂载时对齐到当前项，换方向时清掉旧方向的尺寸（滑动的终态见浏览器测试）
import { _component } from '@vue-tsx-pro/tsx';
import { nextTick, shallowRef } from 'vue';
import { expect, it } from 'vitest';
import { mount } from '../../.test/mount';
import { useActiveIndicator, type IndicatorAxes } from '../active-indicator';

it('写当前项的位置与尺寸；axis 换了清掉旧的尺寸', async () => {
  const axis = shallowRef<keyof IndicatorAxes>('horizontal');
  const Bar = _component(() => {
    const container = shallowRef<HTMLElement | null>(null);
    const indicator = shallowRef<HTMLElement | null>(null);
    useActiveIndicator(() => ({
      container: container.value,
      indicator: indicator.value,
      active: '[data-active]',
      axis: axis.value,
      value: 'a',
    }));
    return () => (
      <div ref={container}>
        <button data-active>a</button>
        <span ref={indicator} />
      </div>
    );
  });
  const host = mount(() => <Bar />);
  const indicator = host.querySelector('span')!;
  expect(indicator.style.width).toBe('0px');
  expect(indicator.style.height).toBe('');

  axis.value = 'vertical';
  await nextTick();
  expect(indicator.style.width).toBe('');
  expect(indicator.style.height).toBe('0px');
});

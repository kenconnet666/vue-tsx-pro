// TimelineChart 在真实浏览器里：每段画一条线、行标签与里程碑文字画出、刻度是整齐的月份
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Projects from '../demo/Projects';

/** 等到条件成立（Unovis 在动画帧里绘制），最多 3 秒 */
async function until<T>(read: () => T | undefined | false): Promise<T> {
  const deadline = performance.now() + 3000;
  for (;;) {
    const value = read();
    if (value) return value;
    if (performance.now() > deadline) throw new Error('等待超时');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

it('每段一条线；行标签、今天与里程碑的文字、按月的刻度都画出', async () => {
  const root = mount(Projects);
  // Unovis 给每段画一个 class 带“-line”的 rect
  const segments = () => root.querySelectorAll('rect[class*="-line"]');
  await until(() => segments().length === 10);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const text = root.querySelector('svg')!.textContent!;
  for (const label of [
    '整流罩支架换材',
    '供应商年度议价',
    '今天',
    '年中评审',
    '预算截止',
    '7月',
    '10月',
  ])
    expect(text).toContain(label);
});

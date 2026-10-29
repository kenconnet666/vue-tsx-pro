// TimelineChart 在真实浏览器里：每段画一条线、行标签与里程碑文字画出、刻度是整齐的月份
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Projects from '../demo/Projects';

it('每段一条线；行标签、今天与里程碑的文字、按月的刻度都画出', async () => {
  const root = mount(Projects);
  const segments = () => root.querySelectorAll('[data-part="segment"]');
  await until(() => segments().length === 10);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const text = root.querySelector('svg')!.textContent!;
  for (const label of [
    '官网首页改版',
    '供应商年度议价',
    '今天',
    '年中评审',
    '预算截止',
    '7月',
    '10月',
  ])
    expect(text).toContain(label);
});

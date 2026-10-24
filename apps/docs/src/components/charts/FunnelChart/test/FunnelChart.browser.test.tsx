// FunnelChart 在真实浏览器里：横条长短按数值（第一环节占满），环节之间写转化率；点一个环节下钻
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Channel from '../demo/Channel';

const stages = ['提交建议', '通过初审', '立项', '转入任务', '收益兑现'];
const values = [186, 121, 64, 52, 23];

/** 各环节的一行：名称、轨道（里面是横条）、数值 */
const rows = (root: Element) =>
  stages.map(
    (name) =>
      [...root.querySelectorAll<HTMLElement>('[role="figure"] span')].find(
        (span) => span.textContent === name,
      )!.parentElement!,
  );

it('横条的长度与数值成比例，第一环节占满轨道', () => {
  const root = mount(Channel);
  rows(root).forEach((row, index) => {
    const track = row.children[1]!;
    const ratio =
      track.firstElementChild!.getBoundingClientRect().width / track.getBoundingClientRect().width;
    expect(ratio).toBeCloseTo(values[index]! / values[0]!, 2);
  });
});

it('环节之间写比上一环节的转化率，末尾写总转化；点“立项”下钻', async () => {
  const root = mount(Channel);
  const text = root.querySelector('[role="figure"]')!.textContent!;
  // 121 / 186、23 / 186
  expect(text).toContain('65.1%');
  expect(text).toContain('12.4%');
  rows(root)[2]!.click();
  await new Promise((resolve) => setTimeout(resolve));
  expect(root.textContent).toContain('点了：立项');
});

// 内容块：StatusDot、ItemList、ProportionBar、StatGroup 与 Stat 的色调、Card 的 extra、Descriptions 的行内排列
import { describe, expect, it } from 'vitest';
import { Text } from '../../base/Text';
import { mount, styleOf } from '../../utils/.test/mount';
import { Card } from '../Card';
import { Descriptions } from '../Descriptions';
import { ItemList, ItemListItem } from '../ItemList';
import { ProportionBar } from '../ProportionBar';
import { Stat, StatGroup } from '../Stat';
import { StatusDot } from '../../base/StatusDot';

describe('StatusDot', () => {
  it('没有 label 时是装饰（aria-hidden）；有 label 时是一张图，读屏念 label', () => {
    const plain = mount(() => <StatusDot tone="danger" />).querySelector('span')!;
    expect(plain.getAttribute('aria-hidden')).toBe('true');
    expect(plain.dataset.tone).toBe('danger');
    const labeled = mount(() => <StatusDot label="未读" />).querySelector('span')!;
    expect([labeled.getAttribute('role'), labeled.getAttribute('aria-label')]).toEqual([
      'img',
      '未读',
    ]);
  });
});

describe('ItemList', () => {
  it('ul > li：起始、标题、说明、结束四块；没有 start 时不留第一列', () => {
    const root = mount(() => (
      <ItemList divided>
        <ItemListItem
          start={<StatusDot />}
          title="齐全性检查"
          description="JY-2026-0187"
          end="剩 2 天"
        />
        <ItemListItem title="只有标题" />
      </ItemList>
    ));
    const items = root.querySelectorAll('ul > li');
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toBe('齐全性检查JY-2026-0187剩 2 天');
    expect(items[0]!.children).toHaveLength(3);
    // 第二条没有起始边：主体 + 结束边的占位
    expect(items[1]!.children).toHaveLength(2);
  });
});

describe('ProportionBar', () => {
  it('横条的名称带上各段的数量；数量为 0 的段不画但留在图例里', () => {
    const root = mount(() => (
      <ProportionBar
        aria-label="任务池"
        segments={[
          { key: 'a', label: '已确认', value: 25, tone: 'success' },
          { key: 'b', label: '挂账', value: 0 },
          { key: 'c', label: '待定', value: 35 },
        ]}
        valueText={(segment) => `${segment.value} 项`}
      />
    ));
    const bar = root.querySelector('[role="img"]')!;
    expect(bar.getAttribute('aria-label')).toBe('任务池：已确认 25，挂账 0，待定 35');
    expect(bar.children).toHaveLength(2);
    expect([...root.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      '已确认25 项',
      '挂账0 项',
      '待定35 项',
    ]);
  });
});

describe('Stat、StatGroup', () => {
  it('tone 给数值着色；StatGroup 里的每个 Stat 都带分隔样式', () => {
    const root = mount(() => (
      <StatGroup>
        <Stat label="超时" value="10" tone="danger" />
        <Stat label="待认定" value="5" />
      </StatGroup>
    ));
    const stats = root.querySelectorAll('dl');
    expect(stats).toHaveLength(2);
    const solo = mount(() => <Stat label="超时" value="10" />).querySelector('dl')!;
    // 组里的 Stat 比单独的多分隔的样式
    expect(styleOf(stats[1]!).size).toBeGreaterThan(styleOf(solo).size);
    const danger = mount(() => <Stat label="超时" value="10" tone="danger" />).querySelector(
      'dd span',
    )!;
    const plain = mount(() => <Stat label="超时" value="10" />).querySelector('dd span')!;
    expect(danger.className).not.toBe(plain.className);
  });
});

describe('Card、Descriptions、Text', () => {
  it('Card 的 extra 和 header 在同一个页头里', () => {
    const root = mount(() => (
      <Card header="超时最久" extra={<a href="#">全部</a>}>
        内容
      </Card>
    ));
    const header = root.firstElementChild!.firstElementChild!;
    expect(header.textContent).toBe('超时最久全部');
    // 只有 extra 也有页头
    const onlyExtra = mount(() => <Card extra="操作">内容</Card>);
    expect(onlyExtra.firstElementChild!.children).toHaveLength(2);
  });

  it('Descriptions 的 inline 排法：不按栏分（没有 grid-template-columns）', () => {
    const root = mount(() => (
      <Descriptions layout="inline" columns={3} items={[{ label: '主办', value: '宋知行' }]} />
    ));
    expect(root.firstElementChild!.getAttribute('data-layout')).toBe('inline');
    expect(root.querySelector('dl')!.getAttribute('style') ?? '').not.toContain('repeat(3');
  });

  it('Text 的 mono、numeric 各加一个样式', () => {
    const plain = mount(() => <Text>1</Text>).querySelector('span')!;
    const both = mount(() => (
      <Text mono numeric>
        1
      </Text>
    )).querySelector('span')!;
    const count = (element: Element) => styleOf(element).size;
    expect(count(both)).toBe(count(plain) + 2);
  });
});

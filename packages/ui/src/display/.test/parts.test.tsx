// 部件标记（data-scope / data-part）：使用方的全局样式与测试按它选中部件，写在部件上的宽高按 border-box 算
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ItemList, ItemListItem } from '../ItemList';
import { Timeline } from '../Timeline';
import { FieldCompare } from '../FieldCompare';

const partsOf = (root: Element, scope: string) =>
  new Set(
    [...root.querySelectorAll(`[data-scope="${scope}"]`)].map((node) =>
      node.getAttribute('data-part'),
    ),
  );

describe('部件标记', () => {
  it('Timeline：根、每项、节点列、节点、内容、标题、时间、说明', () => {
    const root = mount(() => (
      <Timeline
        items={[
          { key: 'a', title: '提交', time: '10-23', description: '说明' },
          { key: 'b', title: '审批', time: '10-24' },
        ]}
      />
    ));
    const parts = partsOf(root, 'timeline');
    for (const part of [
      'root',
      'item',
      'rail',
      'marker',
      'line',
      'content',
      'title',
      'time',
      'description',
    ])
      expect(parts.has(part)).toBe(true);
  });

  it('ItemList：列表是 root，条目是 item（不同组件不共用 root）', () => {
    const root = mount(() => (
      <ItemList>
        <ItemListItem title="资料审核" description="PO-2026-0187" />
      </ItemList>
    ));
    expect(root.querySelector('ul')!.getAttribute('data-part')).toBe('root');
    expect(root.querySelector('li')!.getAttribute('data-part')).toBe('item');
    expect(partsOf(root, 'item-list').has('title')).toBe(true);
  });

  it('FieldCompare：根元素也带标记', () => {
    const root = mount(() => (
      <FieldCompare fields={[{ key: 'a', header: '金额' }]} before={{ a: 1 }} after={{ a: 2 }} />
    ));
    expect(root.firstElementChild!.getAttribute('data-scope')).toBe('field-compare');
  });
});

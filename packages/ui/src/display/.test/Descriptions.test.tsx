// Descriptions：dl > div > dt + dd；跨列不超过栏数。Timeline：有序列表、时间用 <time>、pending 是最后一项
import { Truck } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Descriptions } from '../Descriptions';
import { Timeline } from '../Timeline';

describe('Descriptions', () => {
  it('每项是 dl 里的 div > dt + dd；标题与部件属性', () => {
    const root = mount(() => (
      <Descriptions
        title="订单信息"
        columns={2}
        items={[
          { label: '订单号', value: 'A-1024' },
          { label: '地址', value: '上海', span: 5 },
        ]}
        propsItem={(_, index) => ({ class: `item-${index}` })}
      />
    ));
    const list = root.querySelector('dl')!;
    expect([...list.children].map((item) => item.tagName)).toEqual(['DIV', 'DIV']);
    expect(list.querySelector('.item-0 dt')!.textContent).toBe('订单号');
    expect(list.querySelector('.item-0 dd')!.textContent).toBe('A-1024');
    expect(root.textContent!.startsWith('订单信息')).toBe(true);
  });
});

describe('Timeline', () => {
  it('有序列表；时间写在 <time datetime>；pending 是最后一项，带 aria-busy', () => {
    const root = mount(() => (
      <Timeline
        items={[
          { title: '已下单', time: '10-18 09:12', dateTime: '2026-10-18T09:12' },
          { title: '已发货', icon: Truck, tone: 'success' },
        ]}
        pending="正在派送"
      />
    ));
    const items = [...root.querySelectorAll('ol > li')];
    expect(items).toHaveLength(3);
    expect(items[0]!.querySelector('time')!.getAttribute('datetime')).toBe('2026-10-18T09:12');
    expect(items[1]!.querySelector('svg')).not.toBeNull();
    expect(items[2]!.getAttribute('aria-busy')).toBe('true');
    expect(items[2]!.textContent).toBe('正在派送');
  });
});

// Timeline：有序列表、时间用 <time>、pending 是最后一项、reverse 新的在前、部件属性
import { Truck } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Timeline } from '../Timeline';

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

  it('部件属性落到各自的节点上；组件管理的 datetime、aria-hidden 不被覆盖', () => {
    const root = mount(() => (
      <Timeline
        items={[
          { title: '已下单', time: '09:12', dateTime: '2026-10-18T09:12', description: '说明' },
          { title: '已发货' },
        ]}
        propsRail={{ class: 'rail' }}
        propsLine={{ class: 'line', 'aria-hidden': false }}
        propsTitle={{ class: 'title' }}
        propsTime={{ class: 'time', title: '下单时间' }}
        propsDescription={{ class: 'description' }}
      />
    ));
    const first = root.querySelector('ol > li')!;
    expect(first.querySelector('.rail .line')!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.line')).toHaveLength(1);
    expect(first.querySelector('.title')!.textContent).toBe('已下单');
    const time = first.querySelector('time')!;
    expect(time.className).toContain('time');
    expect(time.getAttribute('title')).toBe('下单时间');
    expect(time.getAttribute('datetime')).toBe('2026-10-18T09:12');
    expect(first.querySelector('.description')!.textContent).toBe('说明');
  });

  it('reverse：新的在前，进行中的一项也在最前；ol 带 reversed', () => {
    const root = mount(() => (
      <Timeline reverse items={[{ title: '已下单' }, { title: '已发货' }]} pending="正在派送" />
    ));
    const titles = [...root.querySelectorAll('ol > li')].map((item) => item.textContent);
    expect(titles).toEqual(['正在派送', '已发货', '已下单']);
    expect(root.querySelector('ol')!.hasAttribute('reversed')).toBe(true);
    // 连接线：最后一项（最旧的）没有
    expect(root.querySelectorAll('ol > li')[2]!.querySelectorAll('span[aria-hidden]').length).toBe(
      1,
    );
  });
});

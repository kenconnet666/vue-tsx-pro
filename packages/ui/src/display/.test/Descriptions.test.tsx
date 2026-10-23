// Descriptions：dl > div > dt + dd；跨列不超过栏数
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Descriptions } from '../Descriptions';

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

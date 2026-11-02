// ValueChange：原值是 del、新值是 ins，两者之间有“改为”；没有原值时只有新值
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ValueChange } from '../ValueChange';

describe('ValueChange', () => {
  it('有原值：del、改为、ins', () => {
    const root = mount(() => <ValueChange before="1280" after="1281" />);
    expect(root.querySelector('del')!.textContent).toBe('1280');
    expect(root.querySelector('ins')!.textContent).toBe('1281');
    expect(root.textContent).toContain('改为');
  });

  it('没有原值：只有新值', () => {
    const root = mount(() => <ValueChange after="新值" />);
    expect(root.querySelector('del')).toBeNull();
    expect(root.querySelector('ins')!.textContent).toBe('新值');
    expect(root.textContent).toBe('新值');
  });
});

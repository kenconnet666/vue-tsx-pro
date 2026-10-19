import { Star } from '@lucide/icons';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { Badge } from '../Badge';
import { Tag } from '../Tag';

describe('Badge', () => {
  it('span，属性落到元素上，可带图标；色调与样式各自换样式', () => {
    const root = mount(() => (
      <>
        <Badge data-x="1" icon={Star} propsIcon={{ class: 'star' }}>
          新
        </Badge>
        <Badge tone="danger" variant="solid">
          12
        </Badge>
      </>
    ));
    const [plain, solid] = root.querySelectorAll('span');
    expect(plain!.dataset.x).toBe('1');
    expect(plain!.querySelector('svg.star')).not.toBeNull();
    expect(plain!.className).not.toBe(solid!.className);
  });

  it('Provider 的 defaults.Badge 改默认外观', () => {
    const root = mount(() => (
      <>
        <Badge class="a">a</Badge>
        <Provider defaults={{ Badge: { tone: 'success' } }}>
          <Badge class="b">b</Badge>
        </Provider>
      </>
    ));
    const strip = (el: Element, own: string) => el.className.replace(own, '');
    expect(strip(root.querySelector('.a')!, 'a')).not.toBe(strip(root.querySelector('.b')!, 'b'));
  });
});

describe('Tag', () => {
  it('给了 onRemove 才有移除按钮；名称带上标签文字，可以改；离场结束后才调用', async () => {
    const onRemove = vi.fn();
    const root = mount(() => (
      <>
        <Tag>只读</Tag>
        <Tag onRemove={onRemove}>上海</Tag>
        <Tag onRemove={onRemove} removeLabel="删除筛选条件">
          北京
        </Tag>
      </>
    ));
    const buttons = root.querySelectorAll('button');
    expect([...buttons].map((b) => b.getAttribute('aria-label'))).toEqual([
      '移除 上海',
      '删除筛选条件',
    ]);
    buttons[0]!.click();
    await nextTick();
    expect(buttons[0]!.parentElement!.dataset.state).toBe('closed');
    await vi.waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    // 使用方没移除：重新显示
    await nextTick();
    expect(buttons[0]!.parentElement!.dataset.state).toBe('open');
  });
});

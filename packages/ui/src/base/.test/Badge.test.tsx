import { Star } from '@lucide/icons';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from '../../config/Provider';
import { createStatusMap } from '../../utils/data/status';
import { mount } from '../../utils/.test/mount';
import { Badge, StatusBadge } from '../Badge';
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

  it('dot：文字前一个对读屏隐藏的圆点；有图标时不画圆点', () => {
    const root = mount(() => (
      <>
        <Badge dot>待审核</Badge>
        <Badge dot icon={Star}>
          推荐
        </Badge>
      </>
    ));
    const [dotted, iconed] = root.querySelectorAll(':scope > span');
    expect(dotted!.querySelector('span[aria-hidden="true"]')).not.toBeNull();
    expect(iconed!.querySelector('span[aria-hidden="true"]')).toBeNull();
    expect(iconed!.querySelector('svg')).not.toBeNull();
  });

  it('StatusBadge：名字与色调取自状态映射，不认识的状态显示 key', () => {
    const statuses = createStatusMap({
      draft: { label: '草稿', tone: 'neutral' },
      approved: { label: '已通过', tone: 'success' },
    });
    const root = mount(() => (
      <>
        <StatusBadge statuses={statuses} value="draft" />
        <StatusBadge statuses={statuses} value="approved" />
        <StatusBadge statuses={statuses} value="archived" />
      </>
    ));
    const [draft, approved, unknown] = root.querySelectorAll<HTMLElement>('[data-status]');
    expect(draft!.textContent).toBe('草稿');
    expect(approved!.textContent).toBe('已通过');
    expect(draft!.className).not.toBe(approved!.className);
    expect(unknown!.textContent).toBe('archived');
    expect(unknown!.className).toBe(draft!.className);
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

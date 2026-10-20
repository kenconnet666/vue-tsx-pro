// Card、Avatar
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { shimmerStyles } from '../../utils/style/shimmer';
import { statusToneStyles } from '../../utils/style/tone-styles';
import { hasStyles, mount } from '../../utils/.test/mount';
import { Avatar, initials } from '../Avatar';
import { Card } from '../Card';

const first = (root: Element) => root.firstElementChild as HTMLElement;

describe('Card', () => {
  it('页头、正文、页脚各一层，都能加部件属性；没有页头页脚时只有正文', () => {
    const full = first(
      mount(() => (
        <Card header="标题" footer="操作" propsHeader={{ class: 'h' }} propsBody={{ class: 'b' }}>
          内容
        </Card>
      )),
    );
    expect([...full.children].map((el) => el.textContent)).toEqual(['标题', '内容', '操作']);
    expect(full.querySelector('.h')).not.toBeNull();
    expect(first(mount(() => <Card>内容</Card>)).children).toHaveLength(1);
  });

  it('loading：正文换成对读屏隐藏的骨架，页头照常显示，卡片带 aria-busy', async () => {
    let loading = _state(true);
    const card = first(
      mount(() => (
        <Card header="标题" loading={loading} propsSkeleton={{ lines: 4 }}>
          内容
        </Card>
      )),
    );
    expect(card.getAttribute('aria-busy')).toBe('true');
    const skeleton = card.children[1]!.firstElementChild!;
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.children).toHaveLength(4);
    expect(card.textContent).toBe('标题');
    loading = false;
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(card.hasAttribute('aria-busy')).toBe(false);
    expect(card.textContent).toBe('标题内容');
  });

  it('骨架换回正文时正文淡入；一开始就有正文时不淡入', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      let loading = _state(false);
      const card = first(mount(() => <Card loading={loading}>内容</Card>));
      const body = () => card.firstElementChild!;
      expect(hasStyles(body(), shimmerStyles.reveal)).toBe(false);
      loading = true;
      await vi.advanceTimersByTimeAsync(200);
      expect(body().textContent).toBe('');
      loading = false;
      await vi.advanceTimersByTimeAsync(500);
      expect(body().textContent).toBe('内容');
      expect(hasStyles(body(), shimmerStyles.reveal)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Avatar', () => {
  it.each([
    ['张三', '三'],
    ['Ada Lovelace', 'AL'],
    ['grace', 'G'],
    ['  ', ''],
  ])('initials(%s) = %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it('role="img" 加名称；没有图片时显示首字母；图片失败时退回首字母', async () => {
    const plain = first(mount(() => <Avatar name="张三" />));
    expect([plain.getAttribute('role'), plain.getAttribute('aria-label')]).toEqual(['img', '张三']);
    expect(plain.textContent).toBe('三');
    // 没有名字：装饰性的，不是没有名称的图片
    const anonymous = first(mount(() => <Avatar />));
    expect([anonymous.hasAttribute('role'), anonymous.getAttribute('aria-hidden')]).toEqual([
      false,
      'true',
    ]);

    const withImage = first(mount(() => <Avatar name="Ada Lovelace" src="/missing.png" />));
    const img = withImage.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    img.dispatchEvent(new Event('error'));
    await nextTick();
    expect(withImage.querySelector('img')).toBeNull();
    expect(withImage.textContent).toBe('AL');
    expect(withImage.dataset.state).toBe('error');
  });

  it('variant × tone 用状态色调的配色：默认 soft accent', () => {
    const plain = first(mount(() => <Avatar name="张三" />));
    const solid = first(mount(() => <Avatar name="张三" variant="solid" tone="success" />));
    expect(hasStyles(plain, statusToneStyles.soft.accent)).toBe(true);
    expect(hasStyles(solid, statusToneStyles.solid.success)).toBe(true);
  });
});

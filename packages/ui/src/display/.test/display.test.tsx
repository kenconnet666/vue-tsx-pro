// Card、Avatar
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
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
});

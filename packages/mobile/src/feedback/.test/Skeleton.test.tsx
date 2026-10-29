// Skeleton：占位的块数与行宽，加载完换成内容
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Skeleton } from '../Skeleton';

describe('Skeleton（H5）', () => {
  it('头像 + 标题 + 三行，最后一行短；loading 为 false 时显示内容', async () => {
    const loading = ref(true);
    const root = mount(() => (
      <Skeleton loading={loading.value} avatar title rows={3}>
        <p>文章</p>
      </Skeleton>
    ));
    const box = root.firstElementChild as HTMLElement;
    expect(box.getAttribute('aria-busy')).toBe('true');
    const body = box.lastElementChild!;
    const rows = [...body.children].slice(1) as HTMLElement[];
    expect(box.children).toHaveLength(2);
    expect(rows.map((row) => row.style.width)).toEqual(['100%', '100%', '60%']);

    loading.value = false;
    await nextTick();
    expect(root.innerHTML).toBe('<p>文章</p>');
  });

  it('rowWidth 给数组时按行取', () => {
    const root = mount(() => <Skeleton rows={2} rowWidth={['80%', '30%']} />);
    const rows = [...root.firstElementChild!.lastElementChild!.children] as HTMLElement[];
    expect(rows.map((row) => row.style.width)).toEqual(['80%', '30%']);
  });
});

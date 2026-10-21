// Tour：卡片里各部件的属性透传与无障碍关联（遮罩、定位、焦点见浏览器测试）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Tour } from '../Tour';

const steps = [
  { title: '搜索', content: '按名称或编号查找订单' },
  { title: '导出', content: '导出为 Excel' },
];

describe('Tour', () => {
  it('部件属性：标题、说明、底部一行、步数；标题与说明的 id 仍关联到 dialog', () => {
    const root = mount(() => (
      <Tour
        steps={steps}
        propsTitle={{ class: 'title' }}
        propsContent={{ class: 'content' }}
        propsFooter={{ class: 'footer' }}
        propsProgress={{ class: 'progress' }}
      />
    ));
    const dialog = root.querySelector('dialog')!;
    const title = dialog.querySelector('.title')!;
    const content = dialog.querySelector('.content')!;
    expect([title.tagName, title.textContent]).toEqual(['H2', '搜索']);
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(content.textContent).toBe('按名称或编号查找订单');
    expect(dialog.getAttribute('aria-describedby')).toBe(content.id);
    expect(dialog.querySelector('.footer .progress')!.textContent).toContain('1');
  });

  it('部件属性：跳过、上一步、下一步；点击由组件管理，下一步可以先不可用', async () => {
    let step = _state(0);
    let ready = _state(false);
    const root = mount(() => (
      <Tour
        steps={steps}
        current={_bind(step)}
        propsSkip={{ class: 'skip', variant: 'outline' }}
        propsPrevious={{ class: 'previous' }}
        // 完成某个操作后才能继续
        propsNext={{ class: 'next', disabled: !ready }}
      />
    ));
    expect(root.querySelector('button.skip')!.textContent).toBe('跳过');
    expect(root.querySelector('button.previous')).toBeNull();
    const next = root.querySelector<HTMLButtonElement>('button.next')!;
    expect(next.disabled).toBe(true);
    ready = true;
    await nextTick();
    next.click();
    await nextTick();
    expect(step).toBe(1);
    expect(root.querySelector('button.skip')).toBeNull();
    root.querySelector<HTMLButtonElement>('button.previous')!.click();
    await nextTick();
    expect(step).toBe(0);
  });

  it('封面在标题之前；→ / ← 切换步骤，焦点在输入框里时不处理', async () => {
    let step = _state(0);
    const root = mount(() => (
      <Tour
        steps={[{ ...steps[0]!, cover: <img alt="" src="cover.png" /> }, steps[1]!]}
        current={_bind(step)}
        propsCover={{ class: 'cover' }}
      />
    ));
    const dialog = root.querySelector('dialog')!;
    const cover = dialog.querySelector('.cover')!;
    expect(cover.querySelector('img')).not.toBeNull();
    expect(cover.nextElementSibling!.tagName).toBe('H2');

    const press = (key: string, target: EventTarget = dialog) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    press('ArrowRight');
    await nextTick();
    expect(step).toBe(1);
    expect(dialog.querySelector('.cover')).toBeNull();
    press('ArrowLeft');
    await nextTick();
    expect(step).toBe(0);

    const input = document.createElement('input');
    dialog.append(input);
    press('ArrowRight', input);
    await nextTick();
    expect(step).toBe(0);
  });
});

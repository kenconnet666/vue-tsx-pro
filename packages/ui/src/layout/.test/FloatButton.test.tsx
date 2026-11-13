// FloatButton、FloatButtonGroup：单个固定在角落、组里跟着组排；速拨的展开收起与 Esc；BackTop 放进组里
import { MessageCircle, Plus, Settings } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { BackTop } from '../BackTop';
import { FloatButton, FloatButtonGroup } from '../FloatButton';

describe('FloatButton', () => {
  it('单个与组里的按钮外观不同（单个自己固定在角落）；组是带名称的 group', () => {
    const root = mount(() => (
      <>
        <FloatButton icon={MessageCircle} aria-label="联系客服" tooltip={false} />
        <FloatButtonGroup aria-label="页面操作">
          <FloatButton icon={MessageCircle} aria-label="组里的客服" tooltip={false} />
          <BackTop />
        </FloatButtonGroup>
      </>
    ));
    const single = root.querySelector('[aria-label="联系客服"]')!;
    const inGroup = root.querySelector('[aria-label="组里的客服"]')!;
    expect(single.className).not.toBe(inGroup.className);
    const group = root.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('页面操作');
    expect(group.contains(root.querySelector('[aria-label="回到顶部"]'))).toBe(true);
  });

  it('badge={false}（没有未读）和没写角标一样：照常固定在角落', () => {
    const root = mount(() => (
      <>
        <FloatButton icon={MessageCircle} aria-label="没写" tooltip={false} />
        <FloatButton icon={MessageCircle} aria-label="没有未读" tooltip={false} badge={false} />
      </>
    ));
    expect(root.querySelector('[aria-label="没有未读"]')!.className).toBe(
      root.querySelector('[aria-label="没写"]')!.className,
    );
  });

  it('速拨：主按钮 aria-expanded 跟着切换、关联展开的那一列；Esc 收起', async () => {
    let open = _state(false);
    const root = mount(() => (
      <FloatButtonGroup icon={Plus} aria-label="快捷操作" _open={open}>
        <FloatButton icon={Settings} aria-label="设置" tooltip={false} />
      </FloatButtonGroup>
    ));
    const trigger = root.querySelector<HTMLButtonElement>('[aria-label="快捷操作"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)!.textContent).toBe('');
    trigger.click();
    await nextTick();
    expect([open, trigger.getAttribute('aria-expanded')]).toEqual([true, 'true']);
    root
      .querySelector('[role="group"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(open).toBe(false);
  });
});

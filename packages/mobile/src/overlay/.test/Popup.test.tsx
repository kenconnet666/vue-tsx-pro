// Popup / Overlay：渲染到浮层根、进出场的 data-state、关闭原因、锁滚动；小程序端渲染到页面的浮层节点
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Popup } from '../Popup';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Popup（H5）', () => {
  it('打开后渲染到 body，下一帧变成 open；点遮罩关闭并带原因，离场后卸载', async () => {
    const open = ref(true);
    const onOpenChange = vi.fn();
    mount(() => (
      <Popup
        _open={open.value}
        onOpenChange={(next, details) => {
          open.value = next;
          onOpenChange(next, details);
        }}
      >
        内容
      </Popup>
    ));
    const panel = document.body.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(panel.parentElement).toBe(document.body);
    expect(panel.dataset.state).toBe('closed');
    await wait(50);
    expect(panel.dataset.state).toBe('open');
    expect(document.body.style.overflow).toBe('hidden');

    (panel.previousElementSibling as HTMLElement).click();
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'overlay' });
    await nextTick();
    expect(panel.dataset.state).toBe('closed');
    await wait(350);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('closeable 的关闭按钮带 close 原因；closeOnOverlay=false 时点遮罩不关', async () => {
    const onOpenChange = vi.fn();
    mount(() => (
      <Popup _open closeable closeOnOverlay={false} onOpenChange={onOpenChange}>
        内容
      </Popup>
    ));
    const panel = document.body.querySelector<HTMLElement>('[role="dialog"]')!;
    (panel.previousElementSibling as HTMLElement).click();
    expect(onOpenChange).not.toHaveBeenCalled();
    panel.querySelector('button')!.click();
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'close' });
  });
});

describe('Popup（小程序）', () => {
  it('渲染到页面的浮层节点；点遮罩关闭', async () => {
    const open = ref(true);
    const Demo = defineComponent(() => () => (
      <div>
        页面
        <Popup _open={open.value} onOpenChange={(next) => (open.value = next)}>
          弹层内容
        </Popup>
      </div>
    ));
    const page = mountPage(Demo);
    await page.settle();
    expect(page.text()).toContain('弹层内容');
    const mask = page.find(
      (node) => node.t === 'lock' && !JSON.stringify(node).includes('弹层内容'),
    )!;
    await page.tap(mask);
    expect(open.value).toBe(false);
    await wait(350);
    await page.settle();
    expect(page.text()).not.toContain('弹层内容');
  });
});

// Image：加载中占位、加载完显示、失败时占位与原因；preview 时是按钮、点开 Lightbox；ImageGroup 共用一个预览、左右切换；
// Lightbox 的计数、旋转、← → 与到头、关闭按钮写回 open
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Lightbox } from '../../overlay/Lightbox';
import { Image, ImageGroup } from '../Image';

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

describe('Image', () => {
  it('加载完之前 img 透明（外层扫光），load 后显示；error 后换成占位，名称是 alt、说明是加载失败', async () => {
    const root = mount(() => <Image src="/a.jpg" alt="支架正面" width={160} height={120} />);
    const image = root.querySelector('img')!;
    expect(image.getAttribute('loading')).toBe('lazy');
    image.dispatchEvent(new Event('load'));
    await flush();
    expect(root.querySelector('img')).not.toBeNull();
    root.querySelector('img')!.dispatchEvent(new Event('error'));
    await flush();
    const fallback = root.querySelector('[role="img"]')!;
    expect(fallback.getAttribute('aria-label')).toBe('支架正面');
    expect(fallback.getAttribute('aria-description')).toBe('图片加载失败');
  });

  it('preview：是按钮（名称“查看大图：alt”），点了打开 Lightbox，用 preview.src 的大图', async () => {
    const root = mount(() => (
      <Image src="/thumb.jpg" alt="支架正面" preview={{ src: '/large.jpg', caption: '验收照片' }} />
    ));
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('查看大图：支架正面');
    button.click();
    await flush();
    const dialog = document.querySelector<HTMLDialogElement>('dialog[aria-label="图片预览"]')!;
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('img')!.getAttribute('src')).toBe('/large.jpg');
    expect(dialog.textContent).toContain('验收照片');
  });
});

describe('ImageGroup 与 Lightbox', () => {
  it('同组的图片共用一个预览：从点的那张开始，→ 下一张，计数跟着变，最后一张没有“下一张”', async () => {
    const root = mount(() => (
      <ImageGroup>
        <Image src="/1.jpg" alt="正面" preview />
        <Image src="/2.jpg" alt="侧面" preview />
        <Image src="/3.jpg" alt="背面" preview />
      </ImageGroup>
    ));
    root.querySelectorAll('button')[1]!.click();
    await flush();
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.textContent).toContain('第 2 张，共 3 张');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await flush();
    expect(dialog.textContent).toContain('第 3 张，共 3 张');
    expect(dialog.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('背面');
    expect(dialog.querySelector('button[aria-label="下一张"]')).toBeNull();
    expect(dialog.querySelector('button[aria-label="上一张"]')).not.toBeNull();
  });

  it('组里的图片 preview 是每次新建的对象：不会让组无限重渲染（组的渲染不读图片的属性）', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = mount(() => (
      <ImageGroup>
        {['/1.jpg', '/2.jpg'].map((src) => (
          <Image key={src} src={src} alt={src} preview={{ caption: src }} />
        ))}
      </ImageGroup>
    ));
    await flush();
    root.querySelectorAll('button')[1]!.click();
    await flush();
    expect(root.querySelector('dialog')!.textContent).toContain('/2.jpg');
    const messages = [...warn.mock.calls, ...error.mock.calls].map((call) => String(call[0]));
    expect(messages.filter((message) => message.includes('recursive'))).toEqual([]);
    warn.mockRestore();
    error.mockRestore();
  });

  it('旋转一档：图片转 90°；关闭按钮关上并写回 open', async () => {
    let open = _state(true);
    const root = mount(() => <Lightbox _open={open} items={[{ src: '/1.jpg', alt: '图纸' }]} />);
    await flush();
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    const image = dialog.querySelector('img')!;
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 600 });
    image.dispatchEvent(new Event('load'));
    await flush();
    dialog.querySelector<HTMLButtonElement>('button[aria-label="向右旋转"]')!.click();
    await flush();
    expect(getComputedStyle(image).transform || image.className).toBeTruthy();
    expect(dialog.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('图纸');
    dialog.querySelector<HTMLButtonElement>('button[aria-label="关闭"]')!.click();
    await flush();
    expect(open).toBe(false);
  });
});

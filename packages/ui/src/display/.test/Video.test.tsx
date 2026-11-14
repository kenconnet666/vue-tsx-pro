// Video：原生控制条、定比例的外框、多种格式与字幕轨道；自动播放默认静音，减少动态效果时不自动播放
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Video } from '../Video';

afterEach(() => vi.unstubAllGlobals());

/** 系统要不要减少动态效果 */
function preferReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('Video', () => {
  it('默认：有控制条、只预加载元数据、行内播放，外面是定比例的框；属性落到 video 上', () => {
    const root = mount(() => (
      <Video src="/demo.mp4" poster="/cover.png" aria-label="产品演示" loop />
    ));
    const frame = root.querySelector('[data-scope="video"][data-part="root"]')!;
    const video = frame.querySelector('video')!;
    expect(video.getAttribute('src')).toBe('/demo.mp4');
    expect(video.getAttribute('poster')).toBe('/cover.png');
    expect(video.hasAttribute('controls')).toBe(true);
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.hasAttribute('autoplay')).toBe(false);
    expect(video.getAttribute('aria-label')).toBe('产品演示');
    expect(video.hasAttribute('loop')).toBe(true);
  });

  it('sources、tracks 渲染成 source、track；写了 sources 时不再写 src；ratio={null} 时没有外框', () => {
    const root = mount(() => (
      <Video
        src="/fallback.mp4"
        sources={[
          { src: '/clip.webm', type: 'video/webm' },
          { src: '/clip.mp4', type: 'video/mp4' },
        ]}
        tracks={[{ src: '/zh.vtt', srclang: 'zh', label: '中文', default: true }]}
        ratio={null}
      />
    ));
    expect(root.querySelector('[data-scope="video"][data-part="root"]')).toBeNull();
    const video = root.querySelector('video')!;
    expect(video.hasAttribute('src')).toBe(false);
    expect(
      [...video.querySelectorAll('source')].map((source) => source.getAttribute('type')),
    ).toEqual(['video/webm', 'video/mp4']);
    const track = video.querySelector('track')!;
    expect(track.getAttribute('srclang')).toBe('zh');
    expect(track.getAttribute('label')).toBe('中文');
    expect(track.hasAttribute('default')).toBe(true);
  });

  it('autoplay：静音、自动播放；可以不要控制条', async () => {
    preferReducedMotion(false);
    const root = mount(() => <Video src="/loop.mp4" autoplay loop controls={false} />);
    await nextTick();
    const video = root.querySelector('video')!;
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.controls).toBe(false);
  });

  it('减少动态效果：不自动播放，并显示控制条（让人自己决定要不要播）', async () => {
    preferReducedMotion(true);
    const root = mount(() => <Video src="/loop.mp4" autoplay loop controls={false} />);
    await nextTick();
    const video = root.querySelector('video')!;
    expect(video.autoplay).toBe(false);
    expect(video.controls).toBe(true);
  });
});

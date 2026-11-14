// Video 的自绘控制条在真实浏览器里：按钮与键盘（K、M、空格）控制播放、静音；点画面切换播放并接住焦点；
// 播放中鼠标离开就收起，菜单开着时不收起；倍速菜单改播放速度
import { expect, it } from 'vitest';
import { server, userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Player from '../demo/Player';

// Playwright 的 WebKit 在 Windows 上不带视频解码，Linux 上靠系统装的 GStreamer：要真的播起来的断言只在 Chromium、Firefox 里跑
const canPlay = server.browser !== 'webkit';

it.skipIf(!canPlay)(
  '自绘控制条：按钮、键盘、点画面控制播放；鼠标离开收起，菜单开着不收起；倍速菜单改速度',
  async () => {
    const root = mount(Player);
    const video = root.querySelector('video')!;
    const frame = root.querySelector<HTMLElement>('[data-scope="video"][data-part="root"]')!;
    const bar = frame.querySelector<HTMLElement>('[data-part="controls"]')!;
    const button = (name: string) =>
      frame.querySelector<HTMLElement>(`button[aria-label="${name}"]`);
    // 没有原生控制条，画的是自己的；读到时长后显示出来
    expect(video.controls).toBe(false);
    expect(frame.dataset.state).toBe('paused');
    await expect
      .poll(() => frame.querySelector('[data-part="time"]')!.textContent, { timeout: 5000 })
      .toBe('0:00 / 0:10');

    await userEvent.click(button('播放')!);
    await expect.poll(() => video.paused).toBe(false);
    await expect.poll(() => frame.dataset.state).toBe('playing');
    expect(button('暂停')).not.toBeNull();

    // 鼠标点过按钮留下的焦点不算“正在用”：鼠标离开画面就收起
    await userEvent.unhover(frame);
    await expect.poll(() => bar.dataset.state).toBe('hidden');
    await expect.poll(() => getComputedStyle(bar).opacity).toBe('0');

    // 鼠标回来：出现。焦点在播放器里：K 暂停，M 静音
    await userEvent.hover(video, { position: { x: 20, y: 20 } });
    await expect.poll(() => bar.dataset.state).toBe('visible');
    await userEvent.keyboard('k');
    await expect.poll(() => video.paused).toBe(true);
    await userEvent.keyboard('m');
    await expect.poll(() => video.muted).toBe(true);
    await expect.poll(() => button('取消静音')?.getAttribute('aria-pressed')).toBe('true');

    // 点画面：继续播放，焦点落在播放器里（Firefox 落在 video 上，其余落在外框上），之后键盘照样可用
    await userEvent.click(video, { position: { x: 20, y: 20 } });
    await expect.poll(() => video.paused).toBe(false);
    expect(frame.contains(document.activeElement)).toBe(true);

    // 倍速菜单：开着的时候鼠标在画面外（菜单上）也不收起
    await userEvent.click(button('播放速度')!);
    const option = () =>
      [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find(
        (item) => item.textContent === '1.5×',
      );
    await expect.poll(option).toBeTruthy();
    await userEvent.hover(option()!);
    expect(bar.dataset.state).toBe('visible');
    await userEvent.click(option()!);
    await expect.poll(() => video.playbackRate).toBe(1.5);

    // 焦点回到按钮（键盘可见的焦点不一定有）；空格在按钮上是按钮自己的，K 始终是播放 / 暂停
    await userEvent.keyboard('k');
    await expect.poll(() => video.paused).toBe(true);
    expect(bar.dataset.state).toBe('visible');
  },
);

it('不用真的播起来的部分（三个浏览器都跑）：没有原生控制条；M 静音；字幕、倍速菜单写到 video 上', async () => {
  const root = mount(Player);
  const video = root.querySelector('video')!;
  const frame = root.querySelector<HTMLElement>('[data-scope="video"][data-part="root"]')!;
  const button = (name: string) => frame.querySelector<HTMLElement>(`button[aria-label="${name}"]`);
  const pick = async (text: string) => {
    const option = () =>
      [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find(
        (item) => item.textContent === text,
      );
    await expect.poll(option).toBeTruthy();
    await userEvent.click(option()!);
  };
  expect(video.controls).toBe(false);
  expect(['播放', '静音', '字幕', '播放速度'].every((name) => button(name) != null)).toBe(true);

  // 点静音按钮（焦点进了播放器），再按 M 取消
  await userEvent.click(button('静音')!);
  await expect.poll(() => video.muted).toBe(true);
  await userEvent.keyboard('m');
  await expect.poll(() => video.muted).toBe(false);

  await userEvent.click(button('播放速度')!);
  await pick('2×');
  await expect.poll(() => video.playbackRate).toBe(2);

  await userEvent.click(button('字幕')!);
  await pick('English');
  await expect
    .poll(() => [...video.textTracks].map((track) => track.mode))
    .toEqual(['disabled', 'showing']);
});

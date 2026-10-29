// 缩放与导出在真实浏览器里：滑块选的一段只画这些类目、“显示全部”恢复；导出菜单生成 PNG 与 CSV（拦下下载链接检查）
import { afterEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Zoom from '../demo/Zoom';

const tickLabels = (root: Element) =>
  [...root.querySelectorAll('svg text')].map((text) => text.textContent ?? '');

afterEach(() => vi.restoreAllMocks());

it('缩放：只画选中的 12 个月；“显示全部”后刻度回到第一年', async () => {
  const root = mount(Zoom);
  // 刻度放不下时隔一个写一个：选中的一段从 2026-01 起，前两年的都不出现
  await until(() => tickLabels(root).includes('2026-01'));
  expect(tickLabels(root).some((label) => /^202[45]-/.test(label))).toBe(false);
  const reset = [...root.querySelectorAll('button')].find((b) => b.textContent === '显示全部')!;
  reset.click();
  await nextTick();
  await until(() => tickLabels(root).some((label) => label.startsWith('2024')));
  expect(root.textContent).toContain('全部 36 个月');
});

it('导出：图片是 PNG、数据是带表头的 CSV，文件名是图表的名称', async () => {
  // 拦下下载：记下每个链接的文件名与内容，不真的下载
  const blobs = new Map<string, Blob>();
  const downloads: { name: string; blob: Blob }[] = [];
  const createUrl = URL.createObjectURL.bind(URL);
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    const url = createUrl(blob as Blob);
    blobs.set(url, blob as Blob);
    return url;
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({ name: this.download, blob: blobs.get(this.href)! });
  });

  const root = mount(Zoom);
  await until(() => root.querySelector('svg text'));
  const choose = async (label: string) => {
    root.querySelector<HTMLButtonElement>('button[aria-label="导出"]')!.click();
    const item = await until(() =>
      [...document.querySelectorAll('[role="menuitem"]')].find((element) =>
        element.textContent?.includes(label),
      ),
    );
    item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  await choose('CSV');
  await until(() => downloads.length === 1);
  expect(downloads[0]!.name).toBe('月度订单与退货.csv');
  // 开头是 BOM（Excel 按 UTF-8 读）；Blob.text() 会把它去掉，先看字节
  const bytes = new Uint8Array(await downloads[0]!.blob.arrayBuffer());
  expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const lines = (await downloads[0]!.blob.text()).split('\r\n');
  expect(lines[0]).toBe('类目,订单（单）,退货（单）');
  expect(lines).toHaveLength(37);

  await choose('PNG');
  await until(() => downloads.length === 2);
  expect(downloads[1]!.name).toBe('月度订单与退货.png');
  expect(downloads[1]!.blob.type).toBe('image/png');
  expect(downloads[1]!.blob.size).toBeGreaterThan(1000);
});

// downloadFile：按类型建 Blob 地址，点一个带文件名的链接，过一会儿再回收地址
import { afterEach, expect, it, vi } from 'vitest';
import { downloadFile } from '../download';

afterEach(() => vi.useRealTimers());

it('点带 download 文件名的链接；地址在点击之后过一会儿才回收', async () => {
  vi.useFakeTimers();
  let blob: Blob | undefined;
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
    blob = value as Blob;
    return 'blob:test';
  });
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const clicked: HTMLAnchorElement[] = [];
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push(this);
  });

  downloadFile('数据.csv', '\uFEFF名称\n上海', 'text/csv');
  expect([clicked[0]!.download, clicked[0]!.href]).toEqual(['数据.csv', 'blob:test']);
  expect(blob!.type).toBe('text/csv');
  // 按字节比：按 UTF-8 解码成文字时开头的 BOM 会被去掉
  const bytes = new Uint8Array(await blob!.arrayBuffer());
  expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(revoke).not.toHaveBeenCalled();
  vi.advanceTimersByTime(40_000);
  expect(revoke).toHaveBeenCalledWith('blob:test');

  for (const spy of [create, revoke, click]) spy.mockRestore();
});

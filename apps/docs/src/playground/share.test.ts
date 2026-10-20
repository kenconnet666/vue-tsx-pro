// 代码演练场的分享链接：代码压缩进 hash，再原样读出
import { expect, it } from 'vitest';
import { decodeCode, encodeCode, playgroundHref } from './share';
import { STARTER } from './starter';

it('代码 → hash → 代码，原样往返（含中文、模板字符串）', async () => {
  const hash = await encodeCode(STARTER);
  expect(hash).toMatch(/^#code=[\w-]+$/);
  // 压缩后明显更短
  expect(hash.length).toBeLessThan(STARTER.length);
  expect(await decodeCode(hash)).toBe(STARTER);
  expect(await playgroundHref(STARTER)).toBe(`/playground${hash}`);
});

it('不是分享链接的 hash 返回 undefined，内容损坏时抛出', async () => {
  expect(await decodeCode('')).toBeUndefined();
  expect(await decodeCode('#variants')).toBeUndefined();
  const hash = await encodeCode(STARTER);
  await expect(decodeCode(hash.slice(0, -20))).rejects.toThrow();
});

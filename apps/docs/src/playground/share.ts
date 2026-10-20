/**
 * 代码演练场的分享链接：代码压缩（deflate-raw）后转成 base64url 放进地址栏的 hash，`/playground#code=…`。
 * hash 不发给服务器，链接多长都不影响请求；1 KB 左右的示例压缩后约 600 个字符。
 */

/** 演练场的地址 */
export const PLAYGROUND_PATH = '/playground';

const PREFIX = '#code=';

async function pipeBytes(bytes: Uint8Array, transform: CompressionStream | DecompressionStream) {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** 代码 → hash（含 #） */
export async function encodeCode(code: string): Promise<string> {
  const compressed = await pipeBytes(
    new TextEncoder().encode(code),
    new CompressionStream('deflate-raw'),
  );
  return PREFIX + toBase64Url(compressed);
}

/** hash → 代码；不是分享链接的 hash 返回 undefined，内容损坏（复制时截断了）时抛出 */
export async function decodeCode(hash: string): Promise<string | undefined> {
  if (!hash.startsWith(PREFIX)) return undefined;
  const bytes = await pipeBytes(
    fromBase64Url(hash.slice(PREFIX.length)),
    new DecompressionStream('deflate-raw'),
  );
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/** 打开演练场并带上这段代码的站内地址 */
export async function playgroundHref(code: string): Promise<string> {
  return PLAYGROUND_PATH + (await encodeCode(code));
}

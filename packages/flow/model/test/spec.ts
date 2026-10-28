/** 读 packages/flow/spec/ 下的样例（从 flow 仓库的 spec/ 复制来，语言无关） */
import { readdirSync, readFileSync } from 'node:fs';

const SPEC = new URL('../../spec/', import.meta.url);

/** 读一份 JSON 样例，路径相对 spec/ */
export function readSpec<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, SPEC), 'utf8')) as T;
}

/** 一个目录下的样例文件名，按名字排序 */
export function listSpec(dir: string): string[] {
  return readdirSync(new URL(`${dir}/`, SPEC))
    .filter((name) => name.endsWith('.json'))
    .sort();
}

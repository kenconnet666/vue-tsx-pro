/**
 * 浏览器里没有文件系统：Babel 关掉配置文件后，仍会按文件名往上找 package.json（existsSync），
 * 这里一律回答“不存在”。vite.config.ts 里把 fs 映射过来，只影响浏览器端
 */
export const existsSync = (): boolean => false;

export function readFileSync(path: string): never {
  throw new Error(`浏览器里不能读文件：${path}`);
}

export function statSync(path: string): never {
  throw new Error(`浏览器里不能读文件：${path}`);
}

export default { existsSync, readFileSync, statSync };

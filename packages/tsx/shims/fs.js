/**
 * Babel 在浏览器里用的 fs 替身：浏览器里没有文件系统。Babel 关掉配置文件后，仍会按文件名往上找 package.json（existsSync），
 * 这里一律回答“不存在”。browserCompile() 插件（src/vite/browser-compile.ts）把 fs 映射过来，只影响浏览器端。
 */
export const existsSync = () => false;

export function readFileSync(path) {
  throw new Error(`浏览器里不能读文件：${path}`);
}

export function statSync(path) {
  throw new Error(`浏览器里不能读文件：${path}`);
}

export default { existsSync, readFileSync, statSync };

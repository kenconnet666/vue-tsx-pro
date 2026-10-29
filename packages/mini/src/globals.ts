/**
 * 小程序逻辑层缺的全局函数：组件库的依赖（animejs 等）在模块顶层就会取用，构建时排在打包入口最前面（build/index.ts）。
 * 只补缺的，宿主已有的不动；都用 setTimeout 实现，逻辑层没有屏幕刷新的回调。
 */
// 支付宝的逻辑层跑在 Worker 里，旧环境没有 globalThis，全局对象是 self（同 Vue 的 getGlobalThis）
const scope = (
  typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : {}
) as Record<string, unknown>;

/** 一帧按 16ms 算 */
const FRAME = 16;

const fill = (name: string, value: unknown) => {
  if (typeof scope[name] === 'undefined') scope[name] = value;
};

fill('setImmediate', (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
  setTimeout(callback, 0, ...args),
);
fill('clearImmediate', (id: ReturnType<typeof setTimeout>) => clearTimeout(id));
fill('requestAnimationFrame', (callback: (time: number) => void) =>
  setTimeout(() => callback(Date.now()), FRAME),
);
fill('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id));

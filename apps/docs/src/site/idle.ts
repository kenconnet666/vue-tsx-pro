/**
 * 首屏用不到的内容（页面底部的 API 表、首屏之外的示例）放到首帧画出来以后、浏览器空闲时再渲染：换页时先把看得见的画出来。
 * 都返回取消函数（组件卸载时调用）。
 */

/** 浏览器空闲时执行；没有 requestIdleCallback 的（Safari）退到下一个任务 */
export function whenIdle(run: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(run, { timeout: 500 });
    return () => cancelIdleCallback(handle);
  }
  const handle = setTimeout(run);
  return () => clearTimeout(handle);
}

/** 首帧画出来以后、浏览器空闲时执行 */
export function afterFirstPaint(run: () => void): () => void {
  let cancel = () => {};
  const frame = requestAnimationFrame(() => (cancel = whenIdle(run)));
  return () => {
    cancelAnimationFrame(frame);
    cancel();
  };
}

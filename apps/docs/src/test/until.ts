// 浏览器测试的等待：图表量到绘图区的大小（ResizeObserver）之后才画，逐帧检查直到条件成立
//
//   const bars = await until(() => root.querySelectorAll('path').length === 12 && root.querySelectorAll('path'));

/** 等到 read 返回真值并返回它，最多 3 秒，超时抛错 */
export async function until<T>(read: () => T | undefined | false): Promise<T> {
  const deadline = performance.now() + 3000;
  for (;;) {
    const value = read();
    if (value) return value;
    if (performance.now() > deadline) throw new Error('等待超时');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

/**
 * 先读后写：当前任务里登记的读取在一个微任务里依次执行，全部读完再依次执行它们返回的写入。
 * 各组件挂载后、尺寸变化时各自“读布局 → 写样式”，一个写完下一个读就要重新布局；
 * 合并后一整轮只布局一次（同 fastdom 的 measure / mutate）。
 *
 *   batchLayout(() => {
 *     const width = item.offsetWidth;                      // 读
 *     return () => (bar.style.width = `${width}px`);       // 写
 *   });
 */

type Read = () => (() => void) | void;

const reads: Read[] = [];

function flush() {
  const writes = reads.splice(0).map((read) => read());
  for (const write of writes) write?.();
}

/** 登记一次读取（返回写入）：这一轮的读取都执行完，再执行写入 */
export function batchLayout(read: Read): void {
  reads.push(read);
  if (reads.length === 1) queueMicrotask(flush);
}

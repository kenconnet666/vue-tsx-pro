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

/** 一个读取或写入出错：报出来（下一个微任务里抛出），这一轮别的读写照常执行 */
function safely<T>(task: () => T): T | undefined {
  try {
    return task();
  } catch (error) {
    queueMicrotask(() => {
      throw error;
    });
    return undefined;
  }
}

function flush() {
  const writes = reads.splice(0).map((read) => safely(read));
  for (const write of writes) if (write) safely(write);
}

/** 登记一次读取（返回写入）：这一轮的读取都执行完，再执行写入 */
export function batchLayout(read: Read): void {
  reads.push(read);
  if (reads.length === 1) queueMicrotask(flush);
}

// batchLayout：一轮里的读取全部执行完再执行写入；一个读取出错不影响别的，错误随后抛出
import { expect, it } from 'vitest';
import { batchLayout } from '../layout-batch';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve));

it('先读后写：两次登记的读取都在写入之前', async () => {
  const log: string[] = [];
  batchLayout(() => {
    log.push('read 1');
    return () => log.push('write 1');
  });
  batchLayout(() => {
    log.push('read 2');
    return () => log.push('write 2');
  });
  expect(log).toEqual([]); // 在微任务里执行
  await tick();
  expect(log).toEqual(['read 1', 'read 2', 'write 1', 'write 2']);
});

it('读取出错：其余读写照常执行，错误在之后的微任务里抛出', async () => {
  const log: string[] = [];
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    errors.push(event.error);
    event.preventDefault();
  };
  window.addEventListener('error', onError);
  const handler = (reason: unknown) => errors.push(reason);
  process.on('uncaughtException', handler);
  batchLayout(() => {
    throw new Error('坏了');
  });
  batchLayout(() => () => log.push('write'));
  await tick();
  await tick();
  window.removeEventListener('error', onError);
  process.off('uncaughtException', handler);
  expect(log).toEqual(['write']);
  expect(errors).toEqual([expect.objectContaining({ message: '坏了' })]);
});

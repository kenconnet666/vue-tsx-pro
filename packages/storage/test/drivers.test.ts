// 驱动的共同约定：每个驱动跑同一组用例；IndexedDB 由 fake-indexeddb 提供（vitest.config 的 setupFiles）
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  indexedDbDriver,
  memoryDriver,
  webStorageDriver,
  type StorageDriver,
} from '../src/index.ts';

/** 内存里的 Storage（Node 没有 localStorage） */
class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  clear() {
    this.items.clear();
  }
}

let databases = 0;
/** 每个用例一个新库，互不影响 */
const freshIndexedDb = () => indexedDbDriver({ name: `test-${++databases}`, fallback: null });

const drivers: [string, () => StorageDriver][] = [
  ['memoryDriver', memoryDriver],
  [
    'webStorageDriver',
    () => {
      const storage = new MemoryStorage();
      return webStorageDriver({ storage: () => storage });
    },
  ],
  ['indexedDbDriver', freshIndexedDb],
];

describe.each(drivers)('%s', (_name, open) => {
  it('存取对象，没有的键是 undefined，写 undefined 等于删除', async () => {
    const driver = open();
    assert.equal(await driver.get('missing'), undefined);
    await driver.set('user:1', { name: '张三', tags: ['a', 'b'], age: 30 });
    assert.deepEqual(await driver.get('user:1'), { name: '张三', tags: ['a', 'b'], age: 30 });
    await driver.set('user:1', undefined);
    assert.equal(await driver.get('user:1'), undefined);
  });

  it('读出来的是副本：改它不改存着的', async () => {
    const driver = open();
    await driver.set('list', [1, 2]);
    const list = (await driver.get<number[]>('list'))!;
    list.push(3);
    assert.deepEqual(await driver.get('list'), [1, 2]);
  });

  it('keys 按前缀列出，delete 删一个或几个（没有的键不报错），clear 清空', async () => {
    const driver = open();
    await driver.set('a:1', 1);
    await driver.set('a:2', 2);
    await driver.set('b:1', 3);
    assert.deepEqual((await driver.keys('a:')).sort(), ['a:1', 'a:2']);
    assert.deepEqual((await driver.keys()).sort(), ['a:1', 'a:2', 'b:1']);
    await driver.delete(['a:1', 'nope']);
    await driver.delete('b:1');
    assert.deepEqual(await driver.keys(), ['a:2']);
    await driver.clear();
    assert.deepEqual(await driver.keys(), []);
  });
});

describe('webStorageDriver', () => {
  it('前缀把数据和页面上别的键分开：keys、clear 只管自己的', async () => {
    const storage = new MemoryStorage();
    storage.setItem('other', 'x');
    const driver = webStorageDriver({ storage: () => storage, prefix: 'app:' });
    await driver.set('k', 1);
    assert.equal(storage.getItem('app:k'), '1');
    assert.deepEqual(await driver.keys(), ['k']);
    await driver.clear();
    assert.equal(storage.getItem('other'), 'x');
    assert.equal(storage.length, 1);
  });

  it('解析不了的文字当作没有；存不进去、存储不可用时以带驱动名的错误失败', async () => {
    const storage = new MemoryStorage();
    storage.setItem('bad', '{oops');
    assert.equal(await webStorageDriver({ storage: () => storage }).get('bad'), undefined);

    const full = new MemoryStorage();
    full.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    await assert.rejects(webStorageDriver({ storage: () => full }).set('big', 'x'), {
      message: 'webStorage: cannot write "big" (storage full or disabled)',
    });
    const disabled = webStorageDriver({
      storage: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    await assert.rejects(disabled.get('k'), {
      message: 'webStorage: web storage is not available',
    });
  });

  it('codec 换成带类型的编码', async () => {
    const storage = new MemoryStorage();
    const driver = webStorageDriver({
      storage: () => storage,
      codec: {
        encode: (v) => `D${(v as Date).toISOString()}`,
        decode: (t) => new Date(t.slice(1)),
      },
    });
    await driver.set('at', new Date('2026-10-30T08:00:00Z'));
    assert.equal(storage.getItem('at'), 'D2026-10-30T08:00:00.000Z');
    assert.ok((await driver.get('at')) instanceof Date);
  });
});

describe('indexedDbDriver', () => {
  it('结构化克隆原样存：Date、Map、Uint8Array 不变成文字', async () => {
    const driver = freshIndexedDb();
    const value = { at: new Date(0), tags: new Map([['a', 1]]), bytes: new Uint8Array([1, 2]) };
    await driver.set('v', value);
    const back = await driver.get<typeof value>('v');
    assert.ok(back?.at instanceof Date);
    assert.equal(back.tags.get('a'), 1);
    assert.deepEqual([...back.bytes], [1, 2]);
  });

  it('同一个库里几个仓库各自一个驱动：后加的仓库升版本建上，已有数据还在', async () => {
    const name = `test-${++databases}`;
    const first = indexedDbDriver({ name, store: 'first', fallback: null });
    await first.set('k', 1);
    const second = indexedDbDriver({ name, store: 'second', fallback: null });
    await second.set('k', 2);
    // first 的连接收到 versionchange 关掉了，下次读写重新打开
    assert.equal(await first.get('k'), 1);
    assert.equal(await second.get('k'), 2);
  });

  it('别的实例（别的标签页）写入时 watch 收到改了的键；自己的写入不回调', async () => {
    const name = `test-${++databases}`;
    const here = indexedDbDriver({ name, fallback: null });
    const there = indexedDbDriver({ name, fallback: null });
    const seen: (readonly string[] | undefined)[] = [];
    const stop = here.watch!((keys) => seen.push(keys));
    await here.set('mine', 1);
    await there.set('a', 1);
    await there.delete(['a', 'b']);
    await there.clear();
    await new Promise((resolve) => setTimeout(resolve, 50));
    stop();
    assert.deepEqual(seen, [['a'], ['a', 'b'], undefined]);
  });

  it('打不开时默认退回内存，available() 是 false；fallback: null 时以错误失败', async () => {
    const saved = globalThis.indexedDB;
    try {
      Reflect.deleteProperty(globalThis, 'indexedDB');
      const driver = indexedDbDriver({ name: 'gone' });
      await driver.set('k', 1);
      assert.equal(await driver.get('k'), 1);
      assert.equal(await driver.available(), false);
      await assert.rejects(indexedDbDriver({ name: 'gone', fallback: null }).get('k'), {
        message: 'indexedDb(gone/kv): cannot open IndexedDB',
      });
    } finally {
      globalThis.indexedDB = saved;
    }
    assert.equal(await freshIndexedDb().available(), true);
  });
});

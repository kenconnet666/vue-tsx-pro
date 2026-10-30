import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { cacheStore, createCache, indexedDbDriver, memoryDriver } from '../src/index.ts';

/** 手动拨的时钟 */
function clock(start = 1_000_000) {
  let time = start;
  return { now: () => time, advance: (ms: number) => (time += ms) };
}

describe('createCache', () => {
  it('ttl 之内新鲜；过期后 stale 窗口里 read 还给旧值（fresh: false），窗口过了删掉', async () => {
    const time = clock();
    const driver = memoryDriver();
    const cache = createCache(driver, { ttl: 1000, stale: 5000, now: time.now });
    await cache.set('k', { v: 1 });
    assert.deepEqual(await cache.read('k'), { value: { v: 1 }, fresh: true });
    time.advance(1000);
    assert.equal(await cache.get('k'), undefined);
    assert.deepEqual(await cache.read('k'), { value: { v: 1 }, fresh: false });
    time.advance(5000);
    assert.equal(await cache.read('k'), undefined);
    assert.deepEqual(await driver.keys(), []);
  });

  it('单次写入改过期时间；Infinity 一直新鲜（存得进只能存文字的驱动）；时长不合法时报错', async () => {
    const time = clock();
    const cache = createCache(memoryDriver(), { now: time.now });
    await cache.set('forever', 1, { ttl: Infinity });
    await cache.set('short', 2, { ttl: 10 });
    time.advance(1e12);
    assert.equal(await cache.get('forever'), 1);
    assert.equal(await cache.get('short'), undefined);
    await assert.rejects(cache.set('x', 1, { ttl: -1 }), /non-negative number of milliseconds/);
    assert.throws(() => createCache(memoryDriver(), { stale: Number.NaN }), /cache stale/);
  });

  it('load：新鲜的直接给；并发只调一次 loader；loader 失败不写', async () => {
    const cache = createCache(memoryDriver());
    let calls = 0;
    const loader = async () => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return ['浙江', '江苏'];
    };
    const [a, b] = await Promise.all([
      cache.load('provinces', loader),
      cache.load('provinces', loader),
    ]);
    assert.deepEqual(a, b);
    assert.deepEqual(await cache.load('provinces', loader), a);
    assert.equal(calls, 1);
    await assert.rejects(
      cache.load('bad', () => Promise.reject(new Error('down'))),
      /down/,
    );
    assert.equal(await cache.get('bad'), undefined);
  });

  it('invalidate / invalidatePrefix 只动缓存前缀下的键', async () => {
    const driver = memoryDriver();
    await driver.set('draft', 'keep');
    const cache = createCache(driver);
    await cache.set('user:1', 1);
    await cache.set('user:2', 2);
    await cache.set('order:1', 3);
    await cache.invalidate('order:1');
    assert.equal(await cache.get('order:1'), undefined);
    await cache.invalidatePrefix('user:');
    assert.deepEqual(await driver.keys(), ['draft']);
  });

  it('IndexedDB 上：别的标签页失效时 watch 收到去掉前缀的键', async () => {
    const here = createCache(indexedDbDriver({ name: 'cache-watch', fallback: null }));
    const there = createCache(indexedDbDriver({ name: 'cache-watch', fallback: null }));
    const seen: (readonly string[] | undefined)[] = [];
    const stop = here.watch((keys) => seen.push(keys));
    await there.set('user:1', { name: '张三' });
    assert.deepEqual(await here.get('user:1'), { name: '张三' });
    await there.invalidate('user:1');
    await new Promise((resolve) => setTimeout(resolve, 50));
    stop();
    assert.deepEqual(seen, [['user:1'], ['user:1']]);
  });
});

describe('标签与本页的失效通知', () => {
  it('invalidateTag 让标了这些标签的全部失效，连同它们别的标签的索引；没标的不动', async () => {
    const driver = memoryDriver();
    const cache = createCache(driver);
    await cache.set('cities:浙江', ['杭州'], { tags: ['t_city'] });
    await cache.set('report', { n: 1 }, { tags: ['t_city', 't_order'] });
    await cache.set('orders', [1], { tags: ['t_order'] });
    await cache.set('plain', 1);
    await cache.invalidateTag('t_city');
    assert.equal(await cache.get('cities:浙江'), undefined);
    assert.equal(await cache.get('report'), undefined);
    assert.deepEqual(await cache.get('orders'), [1]);
    assert.equal(await cache.get('plain'), 1);
    // report 的 t_order 索引也删了：只剩 orders 的
    assert.deepEqual(
      (await driver.keys()).filter((key) => key.includes('\u001e')),
      ['cache:\u001et_order\u001eorders'],
    );
    await assert.rejects(cache.set('x', 1, { tags: [''] }), /non-empty string/);
  });

  it('值过期删掉后只剩索引：invalidateTag 照样清掉索引', async () => {
    const time = clock();
    const driver = memoryDriver();
    const cache = createCache(driver, { ttl: 10, now: time.now });
    await cache.set('k', 1, { tags: ['t'] });
    await driver.delete('cache:k');
    await cache.invalidateTag('t');
    assert.deepEqual(await driver.keys(), []);
  });

  it('watch 收到本页的 invalidate / invalidateTag / invalidatePrefix，set 不通知；清空整个缓存是 undefined', async () => {
    const cache = createCache(memoryDriver());
    const seen: (readonly string[] | undefined)[] = [];
    const stop = cache.watch((keys) => seen.push(keys));
    await cache.set('a', 1, { tags: ['t'] });
    await cache.set('b', 2);
    await cache.invalidateTag('t');
    await cache.invalidate('b');
    await cache.set('user:1', 1);
    await cache.invalidatePrefix('user:');
    await cache.invalidatePrefix('');
    stop();
    await cache.invalidate('b');
    assert.deepEqual(seen, [['a'], ['b'], ['user:1'], undefined]);
  });
});

describe('cacheStore（easy-query 二级缓存的存储）', () => {
  it('一个键下多个字段，各自过期，按键删除全部字段', async () => {
    const time = clock();
    const store = cacheStore(memoryDriver(), time.now);
    await store.set('CACHE:user:1', 'id=1', '{"id":1}', 1000);
    await store.set('CACHE:user:1', 'id=1&tenant=2', '{"id":1}', 5000);
    await store.set('CACHE:user:10', 'id=10', '{"id":10}', 5000);
    time.advance(1000);
    assert.equal(await store.get('CACHE:user:1', 'id=1'), undefined);
    assert.equal(await store.get('CACHE:user:1', 'id=1&tenant=2'), '{"id":1}');
    await store.delete(['CACHE:user:1']);
    assert.equal(await store.get('CACHE:user:1', 'id=1&tenant=2'), undefined);
    // 前缀按分隔符截断：删 user:1 不会删到 user:10
    assert.equal(await store.get('CACHE:user:10', 'id=10'), '{"id":10}');
  });
});

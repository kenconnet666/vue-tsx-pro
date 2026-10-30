/** ORM：缓存、分库分表、读写分离（官方 cache、super） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 缓存与分库分表',
    description: '二级缓存（kv / all）、单库分表、分库路由与跨库归并、读写分离。',
  },
  official: 'cache/*、super/sharding-*、super/README（读写分离）',
  sections: [
    {
      id: 'cache',
      title: '二级缓存',
      text: '`easy-query-ts-cache`：kv 模式按主键缓存单行，all 模式缓存整张小表；写入时由拦截器失效（按改之前的行算出要删的键），事务提交后再删一次（官方的延迟双删）；`onEvict` 收到删掉的键与表，转给别的实例；`tableChanges` 报出每次写入的表名，经 kit 的失效推送让前端缓存按表名失效。浏览器里跑时用前端存储包 `@zerodep-dev/storage` 的 `cacheStore(indexedDbDriver())` 当存储。',
      code: `const cache = createCache({ entities: [User, Province], store: memoryStore() }); // 多实例部署见下一节
const db = createDb({ schema, adapter, interceptors: [cache.interceptor] });
await cache.of(db).kv(User).find(1);
await cache.of(db).all(Province).where((p) => p.name.startsWith('浙')).toPage(1, 20);`,
    },
    {
      id: 'distributed-cache',
      title: '多实例缓存与最终一致',
      text: '浏览器 → 每个实例的本机内存 → Redis → 数据库四层：`tieredStore` 叠本机与 Redis；`createBus(transport)` 是失效的消息通道（PG 的 NOTIFY、Redis 发布订阅，或自己的 MQ 实现 send / listen 两个方法），别的实例收到后只删本机层，再经 kit 的失效推送送到浏览器。写回守卫挡住"读到旧值后写回"，`lateEvictMs` 再删一次，发件箱让消息和写入同一个事务、提交了就一定发出；消息丢了靠各层的过期时间兜底。',
      code: `const bus = createBus(pgTransport(pool));
const cache = createCache({
  entities: [User],
  store: tieredStore({ local: memoryStore(), shared: redisStore(redis) }),
  bus,
  lateEvictMs: 1000,
});
const db = createDb({ schema, adapter, interceptors: [cache.interceptor, tableChanges(bus)] });
await bus.subscribe((message) => hub.publish(message.tables), () => hub.reset()); // kit 的失效推送`,
    },
    {
      id: 'sharding',
      title: '单库分表',
      text: '实体声明分片规则；查询按 where 里分片键上的条件裁剪出要查的表（一张直接查，几张 UNION ALL），insert 按行路由，update / delete 按表逐张执行。',
      code: `const Order = entity('t_order', { /* … */ createdAt: col.datetime() }, { sharding: byMonth('createdAt', { from: '2025-01' }) });
const Log = entity('t_log', { /* … */ userId: col.bigint() }, { sharding: byMod('userId', 4) }); // t_log_0 … t_log_3`,
    },
    {
      id: 'databases',
      title: '分库',
      code: `const sdb = shardDatabases({
  shards: { ds0: db0, ds1: db1 },
  routes: { Order: byMod('userId', 2, { table: (_, i) => \`ds\${i}\` }) },
});
await sdb.query(Order, (q) => q.orderBy((o) => o.createdAt.desc())).toPage(3, 20); // 各库取前 60 条，归并再切`,
      items: [
        '跨库：count / sum / min / max 各库算完再合并；跨库的 groupBy、avg 报错。写入只在各自的库里，不是分布式事务。',
      ],
    },
    {
      id: 'replicas',
      title: '读写分离',
      text: '`createDb({ replicas })`：读走从库（轮询），写和事务里的读走主库；`usePrimary()` 让一段读也走主库（刚写完就要读到）。',
    },
    {
      id: 'readonly',
      title: '只读 Db 与请求上下文',
      text: '`db.readonly()` 在类型上去掉写入、DDL、迁移与加锁，运行时写入也报错，适合只连从库的服务；`requestContext<T>()` 把请求里的租户、用户交给拦截器。',
      code: `const request = requestContext<{ tenantId: number }>();
const db = createDb({ schema, adapter, interceptors: [tenant('tenantId', () => request.get().tenantId)] });
const reader = db.readonly();
reader.insert(Order); // 类型错误：只读
await request.run({ tenantId: 7 }, () => reader.queryable(Order).toList());`,
    },
    {
      id: 'timeout',
      title: '超时与取消',
      text: '`db.withTimeout(ms)`（或 createDb 的 `statementTimeout`）给每条语句计时，`withSignal(signal)` 跟着请求取消；到点调用方立刻失败，PG、MySQL 的驱动还会在服务端终止正在跑的语句（`pg_cancel_backend`、`KILL QUERY`），连接照常可用。',
      code: `const ac = new AbortController();
req.on('close', () => ac.abort());
await db.withSignal(ac.signal).withTimeout(5000).queryable(Order).toList();`,
    },
    {
      id: 'observability',
      title: '链路追踪、N+1 与慢查询',
      text: '`statementSpans(tracer)` 给每条语句记一个 OpenTelemetry span（按数据库语义约定，不依赖 OTel 包）；开发环境的 `queryWatch` 在一个请求里同一条 SQL 反复执行（N+1）或单条太慢时报出来。',
      code: `const watch = queryWatch({ repeat: 5, slowMs: 200 });
const db = createDb({ schema, adapter, onExecute: [statementSpans(trace.getTracer('app')), watch.onExecute] });
app.use((req, res, next) => watch.run(next));`,
    },
  ],
});

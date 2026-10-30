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
      text: '`easy-query-ts-cache`：kv 模式按主键缓存单行，all 模式缓存整张小表；写入时由拦截器失效（按改之前的行算出要删的键），事务提交后再删一次（官方的延迟双删）。',
      code: `const cache = createCache({ entities: [User, Province], store: memoryStore() }); // 多实例部署换成自己的 Redis store
const db = createDb({ schema, adapter, interceptors: [cache.interceptor] });
await cache.of(db).kv(User).find(1);
await cache.of(db).all(Province).where((p) => p.name.startsWith('浙')).toPage(1, 20);`,
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
  ],
});

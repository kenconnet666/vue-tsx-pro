/** ORM：方言（官方 sql-db-support 的各模块） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 方言',
    description:
      '官方支持的数据库都有对应的方言包，另外支持 HANA、Doris；按版本渲染的原则与各库的差异。',
  },
  official:
    'sql-db-support（mysql、pgsql、sqlite、mssql、oracle、dameng、kingbase-es、gauss-db、duckdb、clickhouse、db2、tsdb、h2）',
  sections: [
    {
      id: 'packages',
      title: '方言包',
      items: [
        '`-mysql`：MySQL 8.0.18（PolarDB 基线）起、8.4；`mysql.detect` 读版本；`doris(pool)`：Apache Doris（MySQL 协议，官方没有）。',
        '`-pg`：PostgreSQL 12 起；`opengauss(pool)`：openGauss / GaussDB；`kingbase(pool)`：人大金仓（PG 模式）。',
        '`-sqlite`：node:sqlite；`-duckdb`：@duckdb/node-api（嵌入式）。',
        '`-mssql`：SQL Server 2008 起（2012 以前 ROW_NUMBER 分页）；`-oracle`：11.2 起（12c 以前 ROWNUM 分页），Thin 模式不装客户端。',
        '`-dameng`：达梦 DM8（方言继承 Oracle）；`-db2`：IBM Db2 11.5 / 12.1；`-hana`：SAP HANA 2.0（官方没有）。',
        '`-clickhouse`：查询完整，写入是 mutation，主键由应用给值；`-tdengine`：时序表，写入覆盖、没有 UPDATE（官方 sql-tsdb）。',
        'H2 运行在 JVM 里，Node 没有驱动，不适用。',
      ],
    },
    {
      id: 'capabilities',
      title: '方言能力写进类型',
      text: '方言包的 adapter 带上它支持的能力（`Adapter<Without<\x27returning\x27>>`），`createDb` 把能力挂在 schema 类型上：TDengine 上 `db.update`、ClickHouse 上 `db.transaction`、MySQL 上 `returning()` 在编辑器里就标红，错误信息写出缺的能力；运行时的报错留作兜底。',
      code: `const db = createDb({ schema, adapter: tdengine(sql) });
db.update(Reading); // 类型错误：Unsupported<"update">
db.insert(Reading).values(row).onConflict((r) => r.ts).merge(); // 写同一时间戳就是覆盖，照常可用`,
    },
    {
      id: 'versions',
      title: '按版本渲染',
      text: '默认一套各版本都能跑的写法；只在三种情况按版本分支：旧写法在新版本里被弃用（MySQL upsert 的 `VALUES(col)` 换成行别名）、旧版本没有这个能力（渲染时报出最低版本，例如 `STRING_AGG needs sqlserver 2017 or later`）、新旧写法语义或性能差别大（分页、`IF NOT EXISTS`）。部署时用 `detect` 连库读版本；`version` 选项用在不连库只看 SQL、或要锁定基线的场合。',
    },
    {
      id: 'differences',
      title: '各库的差异由方言吸收',
      items: [
        '引号、参数写法（`?`、`$1`、`:1`、`@p1`、ClickHouse 带类型的 `{p1:Int64}`、TDengine 写成字面量）。',
        'upsert：`ON CONFLICT`、`ON DUPLICATE KEY UPDATE`、`MERGE`；经导航的更新删除：`UPDATE … JOIN`、`UPDATE … FROM`、多列子查询加 `EXISTS`、mutation 的主键 `IN` 子查询。',
        '条件能不能当值（SQL Server、23ai 之前的 Oracle、达梦写成 `CASE WHEN`）、递归 CTE 的写法、子查询里的 `WITH` 提到开头。',
        '各库没有的能力在渲染时报错并说明原因，而不是把一条库里才报错的 SQL 发出去。',
      ],
    },
    {
      id: 'tests',
      title: '测试',
      text: '同一套实库用例（共用套件）跑在每个方言上，开发容器在仓库的 `infra/dev/compose.yaml`（按 profile 启动），CI 里每个库一个服务容器或单独的 runner；取不回自增主键的分析库（ClickHouse、Doris）跑主键由应用给值的分析型套件。',
    },
  ],
});

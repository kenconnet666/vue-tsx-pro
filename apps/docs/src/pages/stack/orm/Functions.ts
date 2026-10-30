/** ORM：函数（官方 func/*） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 函数',
    description:
      '字符串、日期、数学、条件、JSON、窗口与方言专属函数：写在列上，按方言渲染，类型跟着列走。',
  },
  official: 'func/string、datetime、math、number、general、offset、json、custom',
  sections: [
    {
      id: 'columns',
      title: '写在列上',
      text: '函数是表达式上的方法，参数可以是值也可以是别的列；返回的表达式带类型，可空性跟着输入走。各方言的写法差异（`SUBSTRING` 要不要长度、`||` 还是 `CONCAT`、日期加减）由方言处理。',
      code: `db.queryable(User).select((u) => ({
  initials: u.name.left(1).upper(),
  padded: u.code.padStart(6, '0'),
  label: stringFormat('{0}（{1}）', u.name, u.company.name),
  month: u.createdAt.dateTrunc('month'),
  text: u.createdAt.format('yyyy-MM-dd HH:mm'),
  days: u.createdAt.diffDays(now()),
  score: u.score.orElse(0).round(2),
  biggest: maxColumns(u.a, u.b, u.c),       // GREATEST，忽略 NULL
  firstTag: u.attrs.jsonText('tags', 0),     // 路径按列的 TS 类型检查
}));`,
    },
    {
      id: 'families',
      title: '覆盖的函数族',
      items: [
        '字符串：upper、lower、trim / ltrim / rtrim、length、concat、substring、replace、indexOf、left / right、padStart / padEnd、stringFormat、compareTo、like 家族。',
        '日期：year … second、dayOfWeek / dayOfYear、format、加年月日时分秒、diffDays、duration、dateTrunc、now / utcNow。',
        '数学：abs、floor、ceil、round、truncate、mod、power、sqrt、exp、log、sign、三角函数，加减乘除。',
        '条件：orElse、nullIf、caseWhen、maxColumns / minColumns。',
        'JSON：json、jsonText、jsonNumber、jsonBoolean、jsonHas、jsonLength（Db2 没有 jsonLength，渲染时报错）；更新写法 jsonSet、jsonRemove、jsonMerge、jsonAppend 与按元素过滤的 jsonSome（PG、MySQL、SQLite）。',
        '窗口：rowNumber、rank、denseRank、sum / avg / count over、lag / lead、firstValue / lastValue / nthValue。',
      ],
    },
    {
      id: 'dialect',
      title: '方言专属函数',
      text: '专属函数用静态入口按列包装：`MySQL.json(u.attrs).contains(…)`、`MySQL.match(u.name).against(…)`、`Pg.jsonb(u.attrs).hasKey(…)`、`Pg.array(…)`、`Pg.fulltext(…)`、`Hana.*`、`MsSql.contains` / `freetext`。用到别的方言上，渲染时报出是哪个函数、哪个方言不支持。',
    },
    {
      id: 'custom',
      title: '自定义',
      text: '库里有、这里没有的函数用 `sql` 模板写片段：列与值都能插进去，值绑定成参数，结果类型写在 `sql<number>` 的类型参数里。',
    },
  ],
});

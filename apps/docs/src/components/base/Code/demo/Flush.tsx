// 嵌在已有外框的容器里：flush 去掉代码块自己的边框、圆角和底色，几段代码共用一个外框
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, CodeBlock, Separator } from '@zerodep-dev/vue-tsx-pro-ui';

const query = `db.queryable(User)
  .where((u) => u.age.ge(18))
  .toList();`;

const sql = `SELECT * FROM t_user WHERE age >= $1;`;

export default _component(() => () => (
  <Card variant="outline" padding="none">
    <CodeBlock flush title="TypeScript" code={query} lang="ts" />
    <Separator />
    <CodeBlock flush title="SQL" code={sql} lang="sql" />
  </Card>
));

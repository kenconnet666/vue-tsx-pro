// 文案写在数据里（配置、接口返回、表格的说明列）时用 CodeText：反引号里的是行内代码，不用拆成多个节点
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { CodeText, List, ListItem } from '@zerodep-dev/vue-tsx-pro-ui';

const tips = [
  '`where` 里写数组就是 AND，要 OR 用 `or(a, b)`。',
  '开发时运行 `pnpm dev`，提交前运行 `pnpm check`。',
  '环境变量写在 `.env.local` 里，这个文件不提交。',
];

export default _component(() => () => (
  <List>
    {tips.map((tip) => (
      <ListItem key={tip}>
        <CodeText text={tip} />
      </ListItem>
    ))}
  </List>
));

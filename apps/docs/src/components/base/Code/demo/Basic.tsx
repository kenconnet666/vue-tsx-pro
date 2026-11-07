// 行内代码：句子里的命令、文件名、标识符用 Code；文案写在数据里（配置、接口返回、表格的说明列）时用 CodeText，
// 反引号里的是行内代码，不用拆成多个节点
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeText, Flex, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';

const tips = [
  '`where` 里写数组就是 AND，要 OR 用 `or(a, b)`。',
  '开发时运行 `pnpm dev`，提交前运行 `pnpm check`。',
  '环境变量写在 `.env.local` 里，这个文件不提交。',
];

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <Paragraph>
      运行 <Code>pnpm add @zerodep-dev/vue-tsx-pro-ui</Code> 安装，然后在 <Code>main.ts</Code>{' '}
      里调用 <Code>app.use(createUi())</Code>。
    </Paragraph>
    <List>
      {tips.map((tip) => (
        <ListItem key={tip}>
          <CodeText text={tip} />
        </ListItem>
      ))}
    </List>
  </Flex>
));

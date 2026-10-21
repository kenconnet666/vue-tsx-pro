import { _component } from '@vue-tsx-pro/tsx';
import {
  Blockquote,
  Code,
  CodeBlock,
  H2,
  H3,
  Kbd,
  Link,
  List,
  ListItem,
  OrderedList,
  Paragraph,
  Prose,
  Small,
  Strong,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@vue-tsx-pro/ui';

const install = `pnpm add @vue-tsx-pro/ui @vue-tsx-pro/tsx
pnpm add -D vite @vitejs/plugin-vue`;

export default _component(() => () => (
  <Prose>
    <H2 size="xxl">从零搭一个后台</H2>
    <Small tone="muted">10 月 18 日 · 阅读约 6 分钟</Small>
    <Paragraph>
      这篇带你用 <Strong>AppShell</Strong>、<Strong>NavList</Strong> 和 <Strong>DataTable</Strong>{' '}
      搭出一个能用的订单后台。全文的段落、标题、列表、代码块都放在 <Code>Prose</Code>{' '}
      里：块之间的间距统一给，行长限制在约 70 个字宽，长文读起来不累。
    </Paragraph>
    <H3 size="xl">准备工作</H3>
    <Paragraph>先装好依赖，再在入口里用 createUi 装上主题与语言包：</Paragraph>
    <CodeBlock code={install} lang="bash" />
    <OrderedList>
      <ListItem>新建 Vite 项目，选 Vue + TypeScript 模板；</ListItem>
      <ListItem>
        在 <Code>vite.config.ts</Code> 里加上 vue-tsx-pro 的插件；
      </ListItem>
      <ListItem>
        运行 <Code>pnpm dev</Code>，按 <Kbd>O</Kbd> 在浏览器里打开。
      </ListItem>
    </OrderedList>
    <Blockquote>先把骨架搭起来再填内容：布局定下来以后，每个页面只是往正文里放组件。</Blockquote>
    <H3 size="xl">页面清单</H3>
    <List>
      <ListItem>概览：今日销售额、订单数、新客户（Stat）</ListItem>
      <ListItem>订单：可排序、可勾选的表格（DataTable）</ListItem>
      <ListItem>设置：团队成员与账单（Form）</ListItem>
    </List>
    <Table aria-label="各页用到的组件">
      <TableHead>
        <TableRow>
          <TableHeaderCell>页面</TableHeaderCell>
          <TableHeaderCell>主要组件</TableHeaderCell>
          <TableHeaderCell>预计工时</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>概览</TableCell>
          <TableCell>Stat、Card、Grid</TableCell>
          <TableCell>0.5 天</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>订单</TableCell>
          <TableCell>DataTable、Pagination</TableCell>
          <TableCell>1 天</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>设置</TableCell>
          <TableCell>Form、Field、Select</TableCell>
          <TableCell>1 天</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <Paragraph>
      页面里的分栏与间距见 <Link href="/components/flex">Flex 弹性与网格布局</Link>。
    </Paragraph>
  </Prose>
));

// 同一个时刻的几种写法，跟着语言变：dateStyle / timeStyle 定详略，options 逐项指定
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import {
  Card,
  Code,
  DateTime,
  enUS,
  Provider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  zhCN,
} from '@zerodep-dev/vue-tsx-pro-ui';

const at = '2026-10-20T14:30';

const rows: { label: string; render: () => VNodeChild }[] = [
  { label: '默认', render: () => <DateTime value={at} /> },
  {
    label: 'dateStyle="full"',
    render: () => <DateTime value={at} dateStyle="full" timeStyle="short" />,
  },
  { label: 'dateStyle="short"', render: () => <DateTime value={at} dateStyle="short" /> },
  {
    label: "options={{ month: 'short', day: 'numeric' }}",
    render: () => <DateTime value={at} options={{ month: 'short', day: 'numeric' }} />,
  },
  {
    label: "options={{ weekday: 'long', hour: 'numeric' }}",
    render: () => <DateTime value={at} options={{ weekday: 'long', hour: 'numeric' }} />,
  },
];

export default _component(() => () => (
  <Card padding="none">
    <Table aria-label="日期时间的写法" density="compact">
      <TableHead>
        <TableRow>
          <TableHeaderCell>写法</TableHeaderCell>
          <TableHeaderCell>简体中文</TableHeaderCell>
          <TableHeaderCell>English</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableHeaderCell>
              <Code>{row.label}</Code>
            </TableHeaderCell>
            <TableCell nowrap>
              <Provider lang={zhCN}>{row.render()}</Provider>
            </TableCell>
            <TableCell nowrap>
              <Provider lang={enUS}>{row.render()}</Provider>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
));

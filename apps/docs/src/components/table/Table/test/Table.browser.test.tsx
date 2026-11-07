// 静态 Table 在真实浏览器里：stickyHeader 的表头、sticky 的第一列在两个方向滚动后仍贴着滚动区域的顶边与起始边
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

const columns = Array.from({ length: 12 }, (_, index) => `列 ${index + 1}`);
const rows = Array.from({ length: 40 }, (_, index) => index + 1);

it('stickyHeader 与 sticky：滚动后表头贴着顶边、第一列贴着起始边', async () => {
  const root = mount(
    _component(() => () => (
      <Table
        aria-label="明细"
        stickyHeader
        propsRoot={{ axis: 'both', style: 'width: 20rem; height: 12rem' }}
      >
        <TableHead>
          <TableRow>
            <TableHeaderCell sticky>行</TableHeaderCell>
            {columns.map((column) => (
              <TableHeaderCell key={column} nowrap width="6rem">
                {column}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row}>
              <TableHeaderCell scope="row" sticky>
                {row}
              </TableHeaderCell>
              {columns.map((column) => (
                <TableCell key={column} nowrap>
                  {row}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )),
  );
  const table = root.querySelector('table')!;
  // 滚动的是 ScrollArea 的视口：表格最近的可滚动祖先
  let viewport = table.parentElement!;
  while (viewport.scrollHeight <= viewport.clientHeight) viewport = viewport.parentElement!;
  viewport.scrollTop = 200;
  viewport.scrollLeft = 150;
  await expect.poll(() => viewport.scrollTop).toBe(200);

  const area = viewport.getBoundingClientRect();
  const head = table.querySelector('thead')!.getBoundingClientRect();
  const rowHeader = table.querySelector('tbody th')!.getBoundingClientRect();
  expect(Math.abs(head.top - area.top)).toBeLessThan(1);
  expect(Math.abs(rowHeader.left - area.left)).toBeLessThan(2);
});

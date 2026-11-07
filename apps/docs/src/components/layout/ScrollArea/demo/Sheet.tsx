// 两个方向都能滚的明细表：Table 外层本来就是 ScrollArea，propsRoot 改成两个方向、限高；
// 表头吸顶（stickyHeader），行号固定在起始边（sticky），滚到哪都看得到
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from '@zerodep-dev/vue-tsx-pro-ui';

const columns = Array.from({ length: 14 }, (_, index) => String.fromCharCode(65 + index));
const rows = Array.from({ length: 30 }, (_, index) => index + 1);

const styles = css.create({
  area: { height: '18rem' },
});

const value = (row: number, column: number) => ((row * 7919 + column * 104_729) % 100_000) / 100;

export default _component(() => () => (
  <Table
    aria-label="销售明细表"
    density="compact"
    stickyHeader
    propsRoot={{ axis: 'both', sx: styles.area }}
  >
    <TableHead>
      <TableRow>
        <TableHeaderCell sticky width="3rem">
          <VisuallyHidden>行号</VisuallyHidden>
        </TableHeaderCell>
        {columns.map((column) => (
          <TableHeaderCell key={column} align="center" width="5.5rem">
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
          {columns.map((column, index) => (
            <TableCell key={column} align="end" nowrap>
              {value(row, index).toFixed(2)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

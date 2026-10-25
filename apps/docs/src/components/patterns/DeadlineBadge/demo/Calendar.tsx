// 开始日加几个工作日，按工作日历跳过节假日：国庆前后开始的几件事，只按周末算与按工作日历（放假、调休补班）对照
import { _component } from '@vue-tsx-pro/tsx';
import {
  addWorkdays,
  createWorkCalendar,
  Provider,
  Small,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';

const TODAY = '2026-10-09';
const holidays = createWorkCalendar({
  holidays: [['2026-10-01', '2026-10-08']],
  workdays: ['2026-09-27', '2026-10-10'],
});

const rows = [
  { name: '齐全性检查', code: 'PO-2026-0187', start: '2026-09-28', workdays: 3 },
  { name: '财务复核', code: 'PO-2026-0233', start: '2026-09-28', workdays: 10 },
  { name: '方案设计评审', code: 'PO-2026-0214', start: '2026-09-25', workdays: 5 },
  { name: '供应商报价回复', code: 'PO-2026-0102', start: '2026-09-30', workdays: 2 },
  { name: '验证结论确认', code: 'PO-2026-0308', start: '2026-10-09', workdays: 1 },
  { name: '计划调整审批', code: 'PO-2026-0276', start: '2026-10-08', workdays: 5 },
];

export default _component(() => () => (
  <Table density="compact" aria-label="国庆前后开始的事项">
    <TableHead>
      <TableRow>
        <TableHeaderCell>事项</TableHeaderCell>
        <TableHeaderCell>开始</TableHeaderCell>
        <TableHeaderCell align="end">时限</TableHeaderCell>
        <TableHeaderCell>只按周末</TableHeaderCell>
        <TableHeaderCell>按工作日历</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.code}>
          <TableCell>
            <Text>{row.name}</Text> <Small tone="muted">{row.code}</Small>
          </TableCell>
          <TableCell>
            <Text numeric>{row.start}</Text>
          </TableCell>
          <TableCell align="end">
            <Text numeric>{row.workdays} 个工作日</Text>
          </TableCell>
          <TableCell>
            <Small tone="muted">{addWorkdays(row.start, row.workdays)}</Small>{' '}
            <DeadlineBadge start={row.start} workdays={row.workdays} today={TODAY} />
          </TableCell>
          <TableCell>
            <Provider workCalendar={holidays}>
              <Small tone="muted">{addWorkdays(row.start, row.workdays, holidays)}</Small>{' '}
              <DeadlineBadge start={row.start} workdays={row.workdays} today={TODAY} />
            </Provider>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

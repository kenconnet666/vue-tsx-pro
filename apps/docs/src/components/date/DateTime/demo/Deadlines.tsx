// 工作日时限：开始日加 N 个工作日得出截止日，按工作日历跳过周末与法定节假日、算上调休补班；
// deadlineOf 给出剩余工作日与状态（还早、快到期、今天到期、超期、已完成），名字与色调来自状态映射
import { _component } from '@vue-tsx-pro/tsx';
import {
  createStatusMap,
  createWorkCalendar,
  DateTime,
  deadlineOf,
  Provider,
  Small,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useWorkCalendar,
  type DeadlineStates,
} from '@vue-tsx-pro/ui';

/** 国庆放假与调休（应用里写在 createUi 的 workCalendar，所有页面共用） */
const workCalendar = createWorkCalendar({
  holidays: [['2026-10-01', '2026-10-08']],
  workdays: ['2026-09-27', '2026-10-10'],
});

const states = createStatusMap<keyof DeadlineStates>({
  pending: { label: '还早', tone: 'neutral' },
  soon: { label: '快到期', tone: 'warning' },
  due: { label: '今天到期', tone: 'warning' },
  overdue: { label: '超期', tone: 'danger' },
  done: { label: '已完成', tone: 'success' },
});

/** 示例里的“今天”：固定下来，状态每次都一样 */
const TODAY = '2026-10-21';

const tasks = [
  // 跨国庆：放假的日子不算、10 月 10 日（周六）调休算，10 个工作日后是 10 月 21 日
  { name: '财务复核', start: '2026-09-30', workdays: 10 },
  { name: '商务回填 B 值', start: '2026-10-09', workdays: 5 },
  { name: '工程评估', start: '2026-10-19', workdays: 4 },
  { name: '供应商报价', start: '2026-10-09', workdays: 3, done: '2026-10-12' },
  { name: '方案评审', start: '2026-10-15', workdays: 10 },
];

const Deadlines = _component(() => {
  const calendar = useWorkCalendar();
  return () => (
    <Table aria-label="审批时限">
      <TableHead>
        <TableRow>
          <TableHeaderCell>事项</TableHeaderCell>
          <TableHeaderCell>开始</TableHeaderCell>
          <TableHeaderCell>时限</TableHeaderCell>
          <TableHeaderCell>截止</TableHeaderCell>
          <TableHeaderCell>剩余</TableHeaderCell>
          <TableHeaderCell>状态</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tasks.map((task) => {
          const { due, remaining, state } = deadlineOf({ ...task, today: TODAY }, calendar);
          return (
            <TableRow key={task.name}>
              <TableCell>{task.name}</TableCell>
              <TableCell>
                <DateTime value={task.start} />
              </TableCell>
              <TableCell>{task.workdays} 个工作日</TableCell>
              <TableCell>
                <DateTime value={due} />
              </TableCell>
              <TableCell>
                <Small tone={remaining < 0 ? 'danger' : 'muted'}>
                  {state === 'done'
                    ? remaining > 0
                      ? `提前 ${remaining} 天`
                      : remaining === 0
                        ? '按时'
                        : `晚了 ${-remaining} 天`
                    : remaining < 0
                      ? `超 ${-remaining} 天`
                      : `${remaining} 天`}
                </Small>
              </TableCell>
              <TableCell>
                <StatusBadge statuses={states} value={state} radius="full" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});

export default _component(() => () => (
  <Provider workCalendar={workCalendar}>
    <Deadlines />
  </Provider>
));

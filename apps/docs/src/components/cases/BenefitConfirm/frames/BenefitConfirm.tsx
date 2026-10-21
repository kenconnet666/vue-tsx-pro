// 案例：收益认定（表格页，成本团队）。按设计规格：顶栏页签待认定、已认定、退回（条数在页签上）；一页只有一种单位，
// 单机降本（万元）与降 DMC（美元 / FH）用分段切换；列是编码、项目名称、验证窗结论、最新测算版本与金额、协商轮次、
// 剩余工作日（验证完成后 10 个工作日内认定，超期标红）。“认定并锁定 A”确认后推进到已认定，“退回”写原因、任务回到验证中。
// 编码链到项目详情。数据是虚构的
import { BadgeCheck, Search, Undo2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Button,
  createToaster,
  DataTable,
  Dialog,
  Field,
  Flex,
  Link,
  Small,
  Tab,
  TabList,
  Tabs,
  Textarea,
  TextField,
  Toaster,
  ToggleGroup,
  ToggleItem,
  useConfirm,
  useFormat,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { space } from '@vue-tsx-pro/ui/tokens.stylex';
import { layoutVars } from '@vue-tsx-pro/ui/vars.stylex';
import Decimal from 'decimal.js';
import {
  advanceTask,
  CONFIRM_WORKDAYS,
  confirmWorkdaysLeft,
  confirmReturns,
  costKinds,
  latestEstimate,
  reached,
  returnTask,
  saveTask,
  taskStore,
  type CostTask,
} from '../../data';
import { ledgerColumns } from '../../ledger';
import { CaseShell, casePath, useCaseQuery } from '../../shell';

const tabs = [
  { value: 'awaiting', label: '待认定' },
  { value: 'confirmed', label: '已认定' },
  { value: 'returned', label: '退回' },
] as const;

/** 表格的一行：任务卡加上退回的原因与日期 */
interface Row {
  task: CostTask;
  returned?: { reason: string; at: string };
}

const verifiedOn = (task: CostTask) =>
  task.milestones.find((item) => item.label === '验证完成')?.done ?? null;
const confirmedOn = (task: CostTask) =>
  task.milestones.find((item) => item.label === '收益确认')?.done ?? null;
/** 协商轮次：成本团队与产品团队就测算来回了几轮（虚构：按编号定） */
const rounds = (task: CostTask) => 1 + (Number(task.code.split('-').at(-1)) % 3);

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    height: `calc(100dvh - ${layoutVars.stickyOffset} - 2 * ${space.md})`,
    minHeight: '28rem',
  },
  toolbar: { display: 'flex', alignItems: 'center', gap: '_md', flexWrap: 'wrap' },
  search: { width: '18rem' },
  table: { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', maxHeight: 'none', minHeight: 0 },
  code: { fontFamily: '_mono', fontSize: '_sm' },
  number: { fontVariantNumeric: 'tabular-nums' },
  overdue: { color: '_dangerText', fontWeight: '_semibold' },
  tabDivider: {
    alignSelf: 'center',
    width: '_borderWidths.xs',
    height: '1.25em',
    marginInline: '_sm',
    backgroundColor: '_border',
  },
});

export default _component(() => {
  const format = useFormat();
  const confirm = useConfirm();
  const toaster = createToaster();
  // 从统计看板跳过来时带着单位与页签
  const route = useCaseQuery();
  let tab = _state<string>(route().tab ?? 'awaiting');
  let kind = _state<'unit' | 'dmc'>(route().kind === 'dmc' ? 'dmc' : 'unit');
  let keyword = _state('');
  let returning = _state.raw<CostTask | null>(null);
  let reason = _state('');
  let reasonError = _state('');

  const amount = () => costKinds[kind];
  const money = (value: Decimal) => format.number(value, amount().format);

  /** 各页签的行：当前单位、关键字下 */
  function rowsOf(view: string): Row[] {
    const own = taskStore.value.filter(
      (task) =>
        task.kind === kind &&
        (!keyword || task.code.includes(keyword) || task.name.includes(keyword)),
    );
    if (view === 'awaiting')
      return own.filter((task) => task.status === 'awaiting').map((task) => ({ task }));
    if (view === 'confirmed')
      return own
        .filter((task) => task.a != null && reached(task.status, 'confirmed'))
        .map((task) => ({ task }));
    return confirmReturns.value.flatMap((item) => {
      const task = own.find((candidate) => candidate.code === item.code);
      return task ? [{ task, returned: { reason: item.reason, at: item.at } }] : [];
    });
  }

  async function approve(task: CostTask) {
    const estimate = latestEstimate(task);
    const ok = await confirm({
      title: `认定 ${task.code} 的收益？`,
      description: `按最新一版测算（V2）锁定测算金额 A：${money(estimate)} ${amount().unit}。锁定后不能改，商务谈定后再回填 B。`,
      confirmText: '认定并锁定 A',
    });
    if (!ok) return;
    saveTask(advanceTask(task, 'confirmed'));
    toaster.show({ title: `已认定 ${task.code}，A 已锁定`, tone: 'success' });
  }

  function openReturn(task: CostTask) {
    returning = task;
    reason = '';
    reasonError = '';
  }
  function submitReturn() {
    if (!returning) return;
    if (reason.trim().length < 4) {
      reasonError = '写明退回的原因（至少 4 个字），产品团队按它补材料';
      return;
    }
    returnTask(returning, reason.trim());
    toaster.show({ title: `已退回 ${returning.code}，任务回到验证中`, tone: 'success' });
    returning = null;
  }

  const columns = (): DataTableColumn<Row>[] => [
    {
      key: 'code',
      header: amount().codeHeader,
      width: 150,
      sticky: 'start',
      sortable: true,
      value: (row) => row.task.code,
      cell: (row) => (
        <Link href={casePath('TaskDetail', { code: row.task.code })} sx={styles.code}>
          {row.task.code}
        </Link>
      ),
    },
    {
      key: 'name',
      header: '项目名称',
      // 写宽度：更宽时多出来的按比例摊给各列，不只撑大名称
      width: 240,
      sortable: true,
      value: (row) => row.task.name,
    },
    {
      ...ledgerColumns.team,
      value: (row) => ledgerColumns.team.value(row.task),
      cell: (row) => ledgerColumns.team.cell(row.task),
    },
    {
      key: 'verification',
      header: '验证窗结论',
      width: 150,
      value: (row) => verifiedOn(row.task),
      cell: (row) => {
        const verified = verifiedOn(row.task);
        return row.returned ? (
          <Small tone="muted">已作废，待重新验证</Small>
        ) : verified ? (
          <span>
            达标 <Small tone="muted">{verified}</Small>
          </span>
        ) : (
          <Small tone="muted">—</Small>
        );
      },
    },
    {
      key: 'version',
      header: '测算版本',
      width: 110,
      cell: (row) =>
        row.task.a != null ? (
          <Badge tone="accent">V2 已锁定</Badge>
        ) : (
          <Badge tone="neutral">V2 待锁定</Badge>
        ),
    },
    {
      key: 'amount',
      header: `测算金额（${amount().unit}）`,
      width: 140,
      align: 'end',
      sortable: true,
      value: (row) => row.task.a ?? latestEstimate(row.task),
      cell: (row) => (
        <span {...stylex.attrs(styles.number)}>
          {money(row.task.a ?? latestEstimate(row.task))}
        </span>
      ),
    },
    {
      key: 'rounds',
      header: '协商轮次',
      width: 90,
      align: 'end',
      sortable: true,
      value: (row) => rounds(row.task),
    },
    ...(tab === 'awaiting'
      ? [
          {
            key: 'left',
            header: '剩余工作日',
            width: 110,
            align: 'end',
            sortable: true,
            value: (row: Row) => confirmWorkdaysLeft(row.task),
            cell: (row: Row) => {
              const left = confirmWorkdaysLeft(row.task);
              return left == null ? (
                <Small tone="muted">—</Small>
              ) : left < 0 ? (
                <span {...stylex.attrs(styles.overdue)}>超 {-left} 天</span>
              ) : left === 0 ? (
                <Small tone="warning">今天到期</Small>
              ) : (
                <Small tone={left <= 3 ? 'warning' : undefined}>{left} 天</Small>
              );
            },
          } satisfies DataTableColumn<Row>,
        ]
      : []),
    ...(tab === 'confirmed'
      ? [
          {
            key: 'confirmedOn',
            header: '认定日期',
            width: 110,
            sortable: true,
            value: (row: Row) => confirmedOn(row.task),
          } satisfies DataTableColumn<Row>,
        ]
      : []),
    ...(tab === 'returned'
      ? [
          {
            key: 'reason',
            header: '退回原因',
            width: 280,
            value: (row: Row) => row.returned?.reason,
          } satisfies DataTableColumn<Row>,
          {
            key: 'returnedAt',
            header: '退回日期',
            width: 110,
            sortable: true,
            value: (row: Row) => row.returned?.at,
          } satisfies DataTableColumn<Row>,
        ]
      : []),
    {
      key: 'actions',
      header: '操作',
      width: tab === 'awaiting' ? 180 : 90,
      sticky: 'end',
      cell: (row) =>
        tab === 'awaiting' ? (
          <Flex gap="sm" align="center">
            <Button
              size="sm"
              variant="link"
              icon={BadgeCheck}
              onClick={() => void approve(row.task)}
            >
              认定并锁定 A
            </Button>
            <Button
              size="sm"
              variant="link"
              tone="danger"
              icon={Undo2}
              onClick={() => openReturn(row.task)}
            >
              退回
            </Button>
          </Flex>
        ) : (
          <Link href={casePath('TaskDetail', { code: row.task.code })}>看收益</Link>
        ),
    },
  ];

  return () => {
    const rows = rowsOf(tab);
    return (
      <CaseShell
        current="confirm"
        nav={
          <Tabs value={_bind(tab)}>
            <TabList aria-label="认定视图">
              {tabs.map((item) => (
                <Tab key={item.value} value={item.value}>
                  {item.label}
                  <Badge radius="full" tone={tab === item.value ? 'accent' : 'neutral'}>
                    {rowsOf(item.value).length}
                  </Badge>
                </Tab>
              ))}
            </TabList>
          </Tabs>
        }
      >
        <div {...stylex.attrs(styles.page)}>
          <div {...stylex.attrs(styles.toolbar)}>
            <ToggleGroup value={_bind(kind)} aria-label="降本类型" required>
              {(['unit', 'dmc'] as const).map((value) => (
                <ToggleItem key={value} value={value}>
                  {costKinds[value].label}（{costKinds[value].unit}）
                </ToggleItem>
              ))}
            </ToggleGroup>
            <TextField
              value={_bind(keyword)}
              icon={Search}
              placeholder="编码 / 名称"
              clearable
              aria-label="关键字"
              sx={styles.search}
            />
            <Small tone="muted">
              验证完成后 {CONFIRM_WORKDAYS} 个工作日内认定；认定按最新一版测算锁定测算金额 A
            </Small>
          </div>
          <DataTable
            rows={rows}
            columns={columns()}
            getKey={(row) => row.task.code}
            aria-label="收益认定"
            empty={tab === 'awaiting' ? '没有待认定的项目' : '没有记录'}
            propsRoot={{ sx: styles.table }}
          />
        </div>
        <Dialog
          open={_bind(
            () => returning != null,
            (open: boolean) => {
              if (!open) returning = null;
            },
          )}
          title={`退回 ${returning?.code ?? ''}`}
          description="退回后任务回到验证中，验证窗结论作废；产品团队按原因补材料后重新提交"
          footer={
            <Flex justify="end" gap="sm">
              <Button variant="ghost" tone="neutral" onClick={() => (returning = null)}>
                取消
              </Button>
              <Button tone="danger" onClick={submitReturn}>
                退回
              </Button>
            </Flex>
          }
        >
          <Field label="退回原因" required error={reasonError || undefined}>
            <Textarea
              value={_bind(reason)}
              rows={3}
              placeholder="如：验证窗结论缺少试验报告"
              autofocus
            />
          </Field>
        </Dialog>
        <Toaster controller={toaster} />
      </CaseShell>
    );
  };
});

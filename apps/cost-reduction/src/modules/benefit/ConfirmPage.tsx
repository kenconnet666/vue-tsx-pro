/**
 * 收益认定（表格页，成本团队）：顶栏页签待认定、已认定、退回；一页只有一种单位。
 * 一期的参考实现，按新的设计规格重建
 */
import { BadgeCheck, Search, Undo2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Button,
  DataTable,
  DeadlineTag,
  Link,
  Flex,
  Small,
  Tab,
  TabList,
  Tabs,
  Text,
  TextField,
  ToggleGroup,
  ToggleItem,
  useConfirm,
  useFormat,
  useFormDialog,
  useRequest,
  type DataTableColumn,
  queryCodecs,
  useQueryState,
  ViewportFill,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { approveBenefit, listConfirmRows, returnBenefit } from '../../api/benefit';
import { notifyError, toaster } from '../../app/feedback';
import { PageNav } from '../../app/layout/PageNav';
import { paths } from '../../app/paths';
import {
  CONFIRM_WORKDAYS,
  confirmDeadline,
  latestEstimate,
  milestoneDone,
  negotiationRounds,
  type ConfirmRow as Row,
  type ConfirmView,
} from '../../domain/task/benefit';
import type { CostKind, CostTask } from '../../domain/task/types';
import { TODAY } from '../../domain/clock';
import { CodeLink } from '../../shared/CodeLink';
import { costKindKeys, costKinds } from '../../shared/kinds';
import { taskColumns } from '../tasks/ledger/columns';

const tabs: readonly { value: ConfirmView; label: string }[] = [
  { value: 'awaiting', label: '待认定' },
  { value: 'confirmed', label: '已认定' },
  { value: 'returned', label: '退回' },
];

const styles = stylex.create({
  search: { width: '18rem' },
});

export default _component(() => {
  const format = useFormat();
  const confirm = useConfirm();
  const prompt = useFormDialog();
  // 单位与页签在地址里：从统计看板跳过来时带着，刷新、分享也还是这份
  let tab = _fromRef(
    useQueryState<ConfirmView>(
      'tab',
      'awaiting',
      queryCodecs.oneOf(['awaiting', 'confirmed', 'returned']),
    ),
  );
  let kind = _fromRef(useQueryState<CostKind>('kind', 'unit', queryCodecs.oneOf(['unit', 'dmc'])));
  let keyword = _state('');

  const amount = () => costKinds[kind];
  const money = (value: Decimal) => format.number(value, amount().format);

  // 三个页签的行一次取回（条数在页签上）；关键字停下 300 ms 再查
  const rows = useRequest(
    (query: { kind: CostKind; keyword: string }, signal) => listConfirmRows(query, signal),
    { params: () => ({ kind, keyword }), debounce: 300 },
  );
  const rowsOf = (view: ConfirmView): Row[] => rows.data?.[view] ?? [];

  async function approve(task: CostTask) {
    const estimate = latestEstimate(task);
    const ok = await confirm({
      title: `认定 ${task.code} 的收益？`,
      description: `按最新一版测算（V2）锁定测算金额 A：${money(estimate)} ${amount().unit}。锁定后不能改，商务谈定后再回填 B。`,
      confirmText: '认定并锁定 A',
    });
    if (!ok) return;
    try {
      await approveBenefit(task.code);
      toaster.show({ title: `已认定 ${task.code}，A 已锁定`, tone: 'success' });
      void rows.refresh();
    } catch (error) {
      notifyError(`${task.code} 没能认定`, error);
    }
  }

  /** 退回验证：原因必填，产品团队按它补材料 */
  async function sendBack(task: CostTask) {
    const values = await prompt({
      title: `退回 ${task.code}`,
      description: '退回后任务回到验证中，验证窗结论作废；产品团队按原因补材料后重新提交',
      confirmText: '退回',
      tone: 'danger',
      fields: [
        {
          name: 'reason',
          label: '退回原因',
          type: 'textarea',
          required: true,
          placeholder: '如：验证窗结论缺少试验报告',
          validate: (value) =>
            value.length < 4 ? '写明退回的原因（至少 4 个字），产品团队按它补材料' : null,
        },
      ],
      onSubmit: async ({ reason }) => {
        try {
          await returnBenefit(task.code, reason ?? '');
        } catch (error) {
          notifyError(`${task.code} 没能退回`, error);
          throw error;
        }
      },
    });
    if (!values) return;
    toaster.show({ title: `已退回 ${task.code}，任务回到验证中`, tone: 'success' });
    void rows.refresh();
  }

  const columns = (): DataTableColumn<Row>[] => [
    {
      key: 'code',
      header: amount().codeHeader,
      width: 150,
      sticky: 'start',
      sortable: true,
      value: (row) => row.task.code,
      cell: (row) => <CodeLink code={row.task.code} />,
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
      ...taskColumns.team,
      value: (row) => taskColumns.team.value(row.task),
      cell: (row) => taskColumns.team.cell(row.task),
    },
    {
      key: 'verification',
      header: '验证窗结论',
      width: 150,
      value: (row) => milestoneDone(row.task, '验证完成'),
      cell: (row) => {
        const verified = milestoneDone(row.task, '验证完成');
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
      cell: (row) => <Text numeric>{money(row.task.a ?? latestEstimate(row.task))}</Text>,
    },
    {
      key: 'rounds',
      header: '协商轮次',
      width: 90,
      align: 'end',
      sortable: true,
      value: (row) => negotiationRounds(row.task),
    },
    ...(tab === 'awaiting'
      ? [
          {
            key: 'left',
            header: '剩余工作日',
            width: 110,
            align: 'end',
            sortable: true,
            value: (row: Row) => confirmDeadline(row.task)?.remaining,
            cell: (row: Row) => {
              const deadline = confirmDeadline(row.task);
              return deadline ? (
                <DeadlineTag due={deadline.due} today={TODAY} soon={3} />
              ) : (
                <Small tone="muted">—</Small>
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
            value: (row: Row) => milestoneDone(row.task, '收益确认'),
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
              onClick={() => void sendBack(row.task)}
            >
              退回
            </Button>
          </Flex>
        ) : (
          <Link href={paths.task(row.task.code)}>看收益</Link>
        ),
    },
  ];

  return () => (
    <>
      <PageNav>
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
      </PageNav>
      <ViewportFill gap="sm">
        <Flex align="center" gap="md" wrap>
          <ToggleGroup value={_bind(kind)} aria-label="降本类型" required>
            {costKindKeys.map((value) => (
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
        </Flex>
        <DataTable
          rows={rowsOf(tab)}
          loading={rows.loading}
          columns={columns()}
          getKey={(row) => row.task.code}
          aria-label="收益认定"
          empty={tab === 'awaiting' ? '没有待认定的项目' : '没有记录'}
          flexible
        />
      </ViewportFill>
    </>
  );
});

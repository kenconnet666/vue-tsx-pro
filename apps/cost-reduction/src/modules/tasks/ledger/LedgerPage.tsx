/**
 * 降本项目台账（表格页）：单机降本与降 DMC 各一页，字段、明细与单位都不同，共用这一份页面骨架。
 * - 顶栏页签两组：状态分组（全部、执行中、待认定、商务中、已兑现、已关闭、异常）与关注（超时、7 天内到期、可关闭、
 *   关闭材料不全），条数只在页签上；查询栏不放状态；
 * - 一页只有一种单位：金额列放在“收益（万元）”或“收益（美元 / FH）”分组下，不在页内合计；
 * - 增删改查：新建、编辑去编辑页（主表与明细只在那里维护），编码去项目详情；删除只限待启动，确认后可撤销；
 * - 筛选、排序、分页都在后端做；页签、条件、页码、排序都在地址里（统计看板点数字跳过来时带着）
 */
import {
  CircleX,
  Columns3,
  Download,
  Ellipsis,
  FastForward,
  FilePen,
  Pause,
  Plus,
  Search,
  Send,
  Trash2,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Button,
  DataTable,
  dataTableStyles,
  downloadFile,
  Field,
  FilterBar,
  Flex,
  IconButton,
  Link,
  LinkButton,
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuLinkItem,
  PageSizeSelect,
  Pagination,
  SelectionBar,
  Small,
  Tab,
  TabList,
  Tabs,
  tableToCsv,
  TextField,
  useFormat,
  usePersistentState,
  useQueryState,
  useTableQuery,
  type DataTableColumn,
  type DataTableColumnGroup,
} from '@vue-tsx-pro/ui';
import { space } from '@vue-tsx-pro/ui/tokens.stylex';
import { layoutVars } from '@vue-tsx-pro/ui/vars.stylex';
import type Decimal from 'decimal.js';
import { watch, type VNodeChild } from 'vue';
import { getTasks, listTasks } from '../../../api/tasks';
import { notifyError } from '../../../app/feedback';
import { PageNav } from '../../../app/layout/PageNav';
import { paths } from '../../../app/paths';
import { canDo } from '../../../app/session';
import { nextStepOf } from '../../../domain/task/lifecycle';
import { blankLedgerQuery, ledgerViews, type LedgerQuery } from '../../../domain/task/query';
import { canClose, isFinished, overdueDays, taskFocuses } from '../../../domain/task/status';
import type { CostKind, CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';
import { ProgressDots } from '../../../shared/Progress';
import { focusTones, taskStatuses, valueStates } from '../../../shared/statuses';
import { useTaskActions } from '../task-actions';
import { LedgerDetail } from './LedgerDetail';

const styles = stylex.create({
  // 正好占满窗口（减去顶栏与正文的上下内边距）：表格按行数自己的高度，最多到剩下的高度、再多就在表格里滚动；
  // 分页紧跟在表格下面。窗口太矮时整页滚动
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_md',
    minWidth: 0,
    height: `calc(100dvh - ${layoutVars.stickyOffset} - 2 * ${space.md})`,
    minHeight: '32rem',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '_sm', flexGrow: 1, minHeight: 0 },
  table: { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', maxHeight: 'none', minHeight: 0 },
  // 两组页签之间的竖线
  tabDivider: {
    alignSelf: 'center',
    width: '_borderWidths.xs',
    height: '1.25em',
    marginInline: '_sm',
    backgroundColor: '_border',
  },
  code: { fontFamily: '_mono', fontSize: '_sm' },
  actionsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  unit: { color: '_textMuted', fontSize: '_xs', marginInlineStart: '0.25em' },
  overdue: { color: '_dangerText', fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
  number: { fontVariantNumeric: 'tabular-nums' },
});

/** 台账页的参数 */
export interface LedgerPageProps {
  /** 降本类型：决定编码列的表头、金额的单位与格式 */
  kind: CostKind;
  /** 编码、名称之后、收益之前的列（各台账自己的字段） */
  middle: readonly DataTableColumn<CostTask>[];
  /** 收益之后、状态之前的列 */
  after?: readonly DataTableColumn<CostTask>[];
  /** 详情行里描述之后的一段：各台账自己的明细摘要（用 DetailSection） */
  detailExtra?: (task: CostTask) => VNodeChild;
  /** 查询栏：常用的条件与收起的条件（拿到可写的查询条件） */
  filters: (query: LedgerQuery) => { main: VNodeChild; more: VNodeChild; moreActive: number };
}

/** 降本项目台账 */
export const LedgerPage = _component(
  ({ kind, middle, after = [], detailExtra, filters }: LedgerPageProps) => {
    const format = useFormat();
    // 台账的类型是页面写死的配置：取一次
    const ledgerKind = _untrack(kind);
    const amount = costKinds[ledgerKind];
    // 页签在地址里：从看板点进来（?view=…&valueState=…）、刷新、分享都是同一份列表
    let tab = _fromRef(useQueryState('view', 'all'));
    /** 查询栏里编辑中的条件；点“查询”才应用 */
    let query = _state(blankLedgerQuery());
    let selected = _state<string[]>([]);
    // 隐藏了哪些列：各人记住，两本台账分开记
    let hidden = _fromRef(
      usePersistentState(`cost-reduction:${ledgerKind}:hiddenColumns`, [] as string[]),
    );
    let expanded = _state<string[]>([]);

    /** 金额：单位在分组表头里，格子里只写数；没有值时显示 empty */
    const money = (value: Decimal | null, empty: string) =>
      value == null ? (
        <Small tone="muted">{empty}</Small>
      ) : (
        <span {...stylex.attrs(styles.number)}>{format.number(value, amount.format)}</span>
      );

    // 编码、名称、操作一直显示，其余的可以隐藏
    const fixed = ['code', 'name', 'actions'];
    const toggleColumn = (key: string, on: boolean) =>
      (hidden = on ? hidden.filter((item) => item !== key) : [...hidden, key]);
    /** 列设置：操作列表头里的按钮。单独成组件，勾选状态跟着 hidden 更新（列定义只建一次） */
    const ColumnSettings = _component(() => () => (
      <Menu
        trigger={(trigger) => (
          <IconButton
            {...trigger}
            size="xs"
            icon={Columns3}
            aria-label="显示哪些列"
            sx={dataTableStyles.cellControl}
          />
        )}
      >
        {columns
          .filter((column) => !fixed.includes(column.key))
          .map((column) => (
            <MenuCheckboxItem
              key={column.key}
              checked={_bind(
                () => !hidden.includes(column.key),
                (on: boolean) => toggleColumn(column.key, on),
              )}
            >
              {column.header}
            </MenuCheckboxItem>
          ))}
      </Menu>
    ));

    const actions = useTaskActions({
      onChange(task, code) {
        if (!task) selected = selected.filter((item) => item !== code);
        void tasks.refresh();
      },
    });

    /** 每一行的“更多”：推进、调整计划、关闭归档、暂停、终止、删除；做不了的置灰 */
    const moreMenu = (task: CostTask) => {
      const step = nextStepOf(task);
      return (
        <Menu
          trigger={(trigger) => (
            <IconButton
              {...trigger}
              size="xs"
              icon={Ellipsis}
              aria-label={`更多：${task.code}`}
              sx={dataTableStyles.cellControl}
            />
          )}
        >
          <MenuItem
            icon={FastForward}
            disabled={!step || step.next === 'closed'}
            description={step && step.next !== 'closed' ? step.label : undefined}
            onAction={() => void actions.advance(task)}
          >
            推进到下一状态
          </MenuItem>
          <MenuLinkItem icon={FilePen} href={paths.editTask(task.code)}>
            调整计划
          </MenuLinkItem>
          <MenuItem
            icon={Send}
            disabled={!canClose(task)}
            onAction={() => void actions.advance(task)}
          >
            关闭归档
          </MenuItem>
          {canDo('task.pause') && (
            <MenuItem
              icon={Pause}
              disabled={isFinished(task) || task.status === 'paused'}
              onAction={() => void actions.pause(task)}
            >
              暂停
            </MenuItem>
          )}
          {canDo('task.terminate') && (
            <MenuItem
              icon={CircleX}
              tone="danger"
              disabled={isFinished(task)}
              onAction={() => void actions.terminate(task)}
            >
              终止
            </MenuItem>
          )}
          {canDo('task.delete') && (
            <MenuItem
              icon={Trash2}
              tone="danger"
              disabled={task.status !== 'pending'}
              onAction={() => void actions.remove(task)}
            >
              删除
            </MenuItem>
          )}
        </Menu>
      );
    };

    // 列定义只建一次：各台账自己的列是页面写死的配置，用 _untrack 取一次
    const columns: DataTableColumn<CostTask>[] = [
      {
        key: 'code',
        header: amount.codeHeader,
        width: 140,
        sticky: 'start',
        sortable: true,
        cell: (task) => (
          <Link href={paths.task(task.code)} sx={styles.code}>
            {task.code}
          </Link>
        ),
      },
      // 每列都写宽度：放不下时横向滚动；更宽时多出来的按各列宽度的比例分摊，不会只撑大名称一列
      { key: 'name', header: '项目名称', sortable: true, width: 220 },
      ..._untrack(middle),
      {
        key: 'target',
        header: '目标',
        width: 88,
        align: 'end',
        sortable: true,
        format: amount.format,
        value: (task) => task.expected,
        cell: (task) => money(task.expected, '—'),
      },
      {
        key: 'a',
        header: '测算 A',
        width: 88,
        align: 'end',
        sortable: true,
        format: amount.format,
        value: (task) => task.a,
        // 认定前没有 A（状态已经说明）；挂账待定写“待定价”
        cell: (task) => money(task.a, task.status === 'unpriced' ? '待定价' : '—'),
      },
      {
        key: 'b',
        header: '商务 B',
        width: 88,
        align: 'end',
        sortable: true,
        format: amount.format,
        value: (task) => task.b,
        cell: (task) => money(task.b, '—'),
      },
      { key: 'valueState', header: '挂账', width: 92, statuses: valueStates },
      ..._untrack(after),
      { key: 'status', header: '状态', width: 104, statuses: taskStatuses },
      {
        key: 'milestones',
        header: '里程碑',
        width: 68,
        cell: (task) => (
          <ProgressDots
            items={task.milestones.map((item) => ({ label: item.label, done: item.done != null }))}
          />
        ),
      },
      { key: 'due', header: '计划完成', width: 100, sortable: true },
      {
        key: 'overdue',
        header: '超时',
        width: 64,
        sortable: true,
        align: 'end',
        value: (task) => overdueDays(task),
        cell: (task) => {
          const days = overdueDays(task);
          return days > 0 ? (
            <span {...stylex.attrs(styles.overdue)}>
              {days}
              <span {...stylex.attrs(styles.unit)}>天</span>
            </span>
          ) : (
            <Small tone="muted">—</Small>
          );
        },
      },
      {
        key: 'actions',
        // 列设置放在操作列的表头：不为它单独占一行
        header: (
          <span {...stylex.attrs(styles.actionsHeader)}>
            操作
            <ColumnSettings />
          </span>
        ),
        width: 84,
        sticky: 'end',
        // 查看就是点编码，这里不重复。文字按钮用 link、图标按钮用 xs 加 cellControl：不把行撑高
        cell: (task) => (
          <Flex align="center" gap="sm">
            <LinkButton href={paths.editTask(task.code)} size="sm" variant="link">
              编辑
            </LinkButton>
            {moreMenu(task)}
          </Flex>
        ),
      },
    ];
    const groups: DataTableColumnGroup[] = [
      {
        key: 'benefit',
        header: `收益（${amount.unit}）`,
        columns: ['target', 'a', 'b', 'valueState'],
      },
    ];

    // 服务端分页：翻页立即请求，换页签、排序、条数回到第一页；只采用最后一次请求的结果
    const tasks = useTableQuery(
      ({ page, pageSize, sort, filters: applied, params: view }, signal) =>
        listTasks({ kind: ledgerKind, view, filters: applied, sort, page, pageSize }, signal),
      {
        filters: blankLedgerQuery(),
        pageSize: 20,
        sort: { key: 'overdue', direction: 'descending' },
        params: () => tab,
        syncToUrl: true,
      },
    );
    // 查询栏跟着已应用的条件走：从地址来、后退回来
    watch(
      () => tasks.filters,
      (applied) => (query = { ...applied }),
      { immediate: true },
    );

    const search = () => tasks.search({ ...query });
    function reset() {
      query = blankLedgerQuery();
      search();
    }

    /** 导出所选（跨页）：显示着的数据列；里程碑、超时、操作是界面上的列，不导出 */
    async function exportSelected() {
      try {
        const rows = await getTasks(selected);
        const exported = columns.filter(
          (column) =>
            !['milestones', 'overdue', 'actions'].includes(column.key) &&
            !hidden.includes(column.key),
        );
        downloadFile(
          `${amount.label}台账（已选 ${rows.length} 项）.csv`,
          tableToCsv(rows, exported, format, { groups }),
          'text/csv',
        );
      } catch (error) {
        notifyError('导出失败', error);
      }
    }

    return () => {
      const first = tasks.total ? (tasks.page - 1) * tasks.pageSize + 1 : 0;
      const bar = filters(query);
      return (
        <>
          <PageNav>
            <Tabs value={_bind(tab)}>
              <TabList aria-label="项目视图">
                {ledgerViews.map((item) => (
                  <Tab key={item.value} value={item.value}>
                    {item.label}
                    <Badge radius="full" tone={tab === item.value ? 'accent' : 'neutral'}>
                      {tasks.data?.counts[item.value] ?? '…'}
                    </Badge>
                  </Tab>
                ))}
                {/* 第二组：关注，跨状态；条数用色调提示轻重 */}
                <span aria-hidden="true" {...stylex.attrs(styles.tabDivider)} />
                {taskFocuses.map((item) => (
                  <Tab key={item.value} value={item.value}>
                    {item.label}
                    <Badge
                      radius="full"
                      tone={focusTones[item.value]}
                      variant={tab === item.value ? 'solid' : 'soft'}
                    >
                      {tasks.data?.counts[item.value] ?? '…'}
                    </Badge>
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          </PageNav>
          <div {...stylex.attrs(styles.page)}>
            <FilterBar
              onSearch={search}
              onReset={reset}
              loading={tasks.loading}
              moreActive={bar.moreActive}
              actions={
                canDo('task.create') && (
                  <LinkButton href={paths.newTask(ledgerKind)} icon={Plus} variant="soft">
                    新建项目
                  </LinkButton>
                )
              }
              more={bar.more}
            >
              <Field label="关键字">
                <TextField
                  value={_bind(query.keyword)}
                  icon={Search}
                  placeholder="编码 / 名称 / 件号"
                  clearable
                />
              </Field>
              {bar.main}
            </FilterBar>

            <div {...stylex.attrs(styles.list)}>
              <SelectionBar count={selected.length} onClear={() => (selected = [])}>
                <Button
                  size="sm"
                  variant="outline"
                  tone="neutral"
                  icon={Download}
                  onClick={() => void exportSelected()}
                >
                  导出所选
                </Button>
                <Button size="sm" icon={Send}>
                  批量催办
                </Button>
              </SelectionBar>
              <DataTable
                rows={tasks.rows}
                columns={columns}
                columnGroups={groups}
                getKey={(task) => task.code}
                sort={_bind(tasks.sort)}
                manualSort
                selectionMode="multiple"
                selected={_bind(selected)}
                hiddenColumns={hidden}
                renderDetail={(task) => (
                  <LedgerDetail task={task}>{detailExtra?.(task)}</LedgerDetail>
                )}
                expandedRows={_bind(expanded)}
                loading={tasks.loading}
                aria-label={`${amount.label}台账`}
                propsRoot={{ sx: styles.table }}
              />
              <Flex align="center" justify="between" gap="md" wrap>
                <Small tone="muted">
                  第 {first}–{Math.min(tasks.page * tasks.pageSize, tasks.total)} 条 · 勾选跨页保留
                </Small>
                <Flex align="center" gap="md" wrap>
                  <Pagination
                    aria-label="台账分页"
                    page={_bind(tasks.page)}
                    total={tasks.total}
                    pageSize={tasks.pageSize}
                  />
                  <PageSizeSelect value={_bind(tasks.pageSize)} />
                </Flex>
              </Flex>
            </div>
          </div>
        </>
      );
    };
  },
);

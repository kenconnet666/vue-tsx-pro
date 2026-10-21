// 降本项目台账（表格页）：单机降本与降 DMC 各一页，字段、明细与单位都不同，共用这一份页面骨架。
// 依据设计规格“单机降本台账”“降 DMC 台账”：
// - 顶栏页签两组：状态分组（全部、执行中、待认定、商务中、已兑现、已关闭、异常）与关注（超时、7 天内到期、可关闭、关闭材料不全），
//   条数只在页签上；查询栏不放状态；
// - 一页只有一种单位：金额列放在“收益（万元）”或“收益（美元 / FH）”分组下，不在页内合计；
// - 增删改查：新建、编辑去编辑页（主表与明细只在那里维护），编码去项目详情（操作列不再重复“查看”）；删除只限待启动，确认后可撤销；
// - 表格按服务端的方式排序、分页（内存里的数据模拟接口：延迟 300 ms，只采用最后一次请求的结果）；
//   统计看板点数字跳过来时，地址上带着页签与筛选（view、valueState、basis）
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Columns3,
  Download,
  Ellipsis,
  FastForward,
  FilePen,
  Paperclip,
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
  Combobox,
  createToaster,
  DataTable,
  dataTableStyles,
  DatePicker,
  Field,
  FilterBar,
  Flex,
  Icon,
  IconButton,
  Link,
  LinkButton,
  listStyles,
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuLinkItem,
  PageSizeSelect,
  Pagination,
  Select,
  SelectionBar,
  Small,
  sortRows,
  Tab,
  TabList,
  Tabs,
  TextField,
  Toaster,
  useConfirm,
  useFormat,
  type DataTableColumn,
  type DataTableColumnGroup,
  daysBetween,
  type SortState,
  useTableQuery,
} from '@vue-tsx-pro/ui';
import { space } from '@vue-tsx-pro/ui/tokens.stylex';
import { layoutVars } from '@vue-tsx-pro/ui/vars.stylex';
import Decimal from 'decimal.js';
import { watch, type VNodeChild } from 'vue';
import {
  canClose,
  categories,
  costKinds,
  completionForms,
  fundingSources,
  isFinished,
  labelOf,
  orgs,
  overdueDays,
  people,
  personName,
  removeTask,
  statusGroups,
  suppliers,
  taskStatuses,
  taskStore,
  teams,
  TODAY,
  valueStates,
  type CostTask,
} from './data';
import { CaseShell, casePath, useCaseQuery, type CasePage } from './shell';

/** 页签的第一组：全部与各状态分组 */
const tabs = [{ value: 'all', label: '全部', statuses: null }, ...statusGroups] as const;

const daysToDue = (task: CostTask) => daysBetween(TODAY, task.due);

/** 关注：跨状态的快捷筛选，PEMO 每天要看的几类（统计看板的“需要处理”也用） */
export const focuses = [
  {
    value: 'overdue',
    label: '超时',
    tone: 'danger',
    test: (task: CostTask) => overdueDays(task) > 0,
  },
  {
    value: 'soon',
    label: '7 天内到期',
    tone: 'warning',
    test: (task: CostTask) => !isFinished(task) && daysToDue(task) >= 0 && daysToDue(task) <= 7,
  },
  { value: 'closable', label: '可关闭', tone: 'success', test: canClose },
  {
    value: 'missing',
    label: '关闭材料不全',
    tone: 'warning',
    test: (task: CostTask) => task.status === 'realized' && !canClose(task),
  },
] as const;

/** 台账的查询条件：两种台账的并集，各页的查询栏只放自己的那几项；没选的是 null（选择、日期控件清空后的值） */
export interface LedgerQuery {
  keyword: string;
  category: string | null;
  team: string | null;
  year: string | null;
  contact: string | null;
  org: string | null;
  form: string | null;
  install: string | null;
  supplier: string | null;
  funding: string | null;
  valueState: string | null;
  needSb: string | null;
  basis: string | null;
}

const blank = (): LedgerQuery => ({
  keyword: '',
  category: null,
  team: null,
  year: null,
  contact: null,
  org: null,
  form: null,
  install: null,
  supplier: null,
  funding: null,
  valueState: null,
  needSb: null,
  basis: null,
});

/** 关键字查编码、名称与件号 */
const partNos = (task: CostTask) =>
  task.unitDetail?.parts.flatMap((change) => [change.before?.partNo, change.after?.partNo]) ?? [];

const matches = (task: CostTask, query: LedgerQuery) =>
  (!query.keyword ||
    task.name.includes(query.keyword) ||
    task.code.includes(query.keyword) ||
    partNos(task).some((no) => no?.includes(query.keyword))) &&
  (!query.category || task.category === query.category) &&
  (!query.team || task.team === query.team) &&
  (!query.year || task.year === query.year) &&
  (!query.contact || task.contact === query.contact) &&
  (!query.org || task.org === query.org) &&
  (!query.form || task.form === query.form) &&
  (!query.install || task.install === query.install) &&
  (!query.supplier || task.supplier === query.supplier) &&
  (!query.funding || task.funding.includes(query.funding)) &&
  (!query.valueState || task.valueState === query.valueState) &&
  (!query.needSb || task.needSb === (query.needSb === 'yes')) &&
  (!query.basis || task.basis === query.basis);

interface Page {
  rows: CostTask[];
  total: number;
  /** 各页签（状态分组与关注）的条数：查询条件下、不含页签本身 */
  counts: Record<string, number>;
}

/** 页签筛出的任务：状态分组按状态，关注按各自的条件（跨状态） */
function inView(rows: readonly CostTask[], view: string): readonly CostTask[] {
  const focus = focuses.find((item) => item.value === view);
  if (focus) return rows.filter(focus.test);
  const statuses = (tabs.find((item) => item.value === view)?.statuses ?? null) as
    readonly string[] | null;
  return statuses ? rows.filter((task) => statuses.includes(task.status)) : rows;
}

/** 模拟的查询接口：筛选、排序、分页都在“服务端”做 */
async function fetchTasks(
  source: readonly CostTask[],
  query: LedgerQuery,
  tab: string,
  sort: SortState | null,
  page: number,
  size: number,
  columns: readonly DataTableColumn<CostTask>[],
): Promise<Page> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const filtered = source.filter((task) => matches(task, query));
  const rows = inView(filtered, tab);
  return {
    rows: sortRows(rows, columns, sort, 'zh-CN').slice((page - 1) * size, page * size),
    total: rows.length,
    counts: Object.fromEntries(
      [...tabs, ...focuses].map((item) => [item.value, inView(filtered, item.value).length]),
    ),
  };
}

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
  dots: { display: 'inline-flex', alignItems: 'center', gap: '2px' },
  done: { color: '_successText' },
  todo: { color: '_textMuted' },
  // 详情各段从左往右排：其余各段按内容宽，描述占剩下的（24 到 40rem），放不下就换行；
  // 各段都是“标题一行 + 内容”，字号相同，标题与内容各在同一条线上
  detail: { display: 'flex', flexWrap: 'wrap', columnGap: '_xl', rowGap: '_md' },
  detailBlock: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  description: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '24rem',
    minWidth: '16rem',
    maxWidth: '40rem',
  },
  checklist: { display: 'flex', flexWrap: 'wrap', columnGap: '_lg', rowGap: '_xs' },
  checkItem: { display: 'inline-flex', alignItems: 'center', gap: '_xs', whiteSpace: 'nowrap' },
});

/** 一排完成与否的圆点（里程碑、实施节点）；完整说明给读屏与悬停提示 */
export function progressDots(items: readonly { label: string; done: boolean }[]) {
  const label = items.map((item) => `${item.label}${item.done ? '已完成' : '未完成'}`).join('，');
  return (
    <span {...stylex.attrs(styles.dots)} role="img" aria-label={label} title={label}>
      {items.map((item) => (
        <Icon
          key={item.label}
          icon={item.done ? CircleCheck : CircleDashed}
          sx={item.done ? styles.done : styles.todo}
        />
      ))}
    </span>
  );
}

/** 详情里的一项：完成与否的图标、名称、补充信息（日期、证据、超时） */
export interface CheckItem {
  label: string;
  done: boolean;
  extra?: VNodeChild;
}

/** 详情里的一排完成情况（里程碑、关闭材料、实施节点） */
export function checklist(items: readonly CheckItem[]) {
  return (
    <ul {...stylex.attrs(listStyles.reset, styles.checklist)}>
      {items.map((item) => (
        <li key={item.label} {...stylex.attrs(styles.checkItem)}>
          <Icon
            icon={item.done ? CircleCheck : CircleDashed}
            sx={item.done ? styles.done : styles.todo}
          />
          <Small tone={item.done ? undefined : 'muted'}>{item.label}</Small>
          {item.extra}
        </li>
      ))}
    </ul>
  );
}

/** 详情里的一段：标题一行（进度写在标题里）加内容 */
export function detailSection(title: VNodeChild, content: VNodeChild, titleTone?: 'success') {
  return (
    <section {...stylex.attrs(styles.detailBlock)}>
      <Small tone={titleTone ?? 'muted'}>{title}</Small>
      {content}
    </section>
  );
}

/** 详情行：表格里没有的信息——简要描述、各台账自己的明细摘要（extra）、里程碑与交付证据、关闭三材料 */
function detail(task: CostTask, extra?: VNodeChild) {
  const done = task.milestones.filter((item) => item.done).length;
  const missing = Object.values(task.closing).filter((ok) => !ok).length;
  return (
    <div {...stylex.attrs(styles.detail)}>
      <section {...stylex.attrs(styles.detailBlock, styles.description)}>
        <Small tone="muted">简要描述</Small>
        <Small>{task.description}</Small>
      </section>
      {extra}
      {detailSection(
        `里程碑与交付证据 · ${done} / 3`,
        checklist(
          task.milestones.map((item) => ({
            label: item.label,
            done: item.done != null,
            extra: item.done && (
              <>
                <Small tone="muted">{item.done}</Small>
                {item.evidence && (
                  <Link href="#" title={item.evidence} aria-label={`交付证据：${item.evidence}`}>
                    <Icon icon={Paperclip} />
                  </Link>
                )}
              </>
            ),
          })),
        ),
      )}
      {detailSection(
        `关闭三材料 · ${missing ? `缺 ${missing} 项，不能关闭` : '齐全，可以关闭'}`,
        checklist([
          { label: '验证窗结论', done: task.closing.verification },
          { label: '收益认定意见', done: task.closing.benefit },
          { label: '商务谈定记录', done: task.closing.business },
        ]),
        missing ? undefined : 'success',
      )}
    </div>
  );
}

/** 团队名去掉“集成团队”的后缀：列窄；全称在悬停提示里 */
export const shortTeam = (team: string) => team.replace('集成团队', '');

/** 台账页的参数 */
export interface LedgerPageProps {
  /** 降本类型：决定编码列的表头、金额的单位与格式（costKinds） */
  kind: CostTask['kind'];
  /** 新建、编辑去的编辑页 */
  editor: CasePage;
  /** 编码、名称之后、收益之前的列（各台账自己的字段） */
  middle: readonly DataTableColumn<CostTask>[];
  /** 收益之后、状态之前的列 */
  after?: readonly DataTableColumn<CostTask>[];
  /** 详情里描述之后的一段：各台账自己的明细摘要（用 detailSection） */
  detailExtra?: (task: CostTask) => VNodeChild;
  /** 查询栏：常用的条件与收起的条件（拿到可写的查询条件） */
  filters: (query: LedgerQuery) => { main: VNodeChild; more: VNodeChild; moreActive: number };
}

/** 降本项目台账 */
export const LedgerPage = _component(
  ({ kind, editor, middle, after = [], detailExtra, filters }: LedgerPageProps) => {
    const format = useFormat();
    // 台账的类型是页面写死的配置：取一次
    const amount = costKinds[_untrack(kind)];
    const route = useCaseQuery();
    const fromLink = (): LedgerQuery => ({
      ...blank(),
      valueState: route().valueState ?? null,
      basis: route().basis ?? null,
    });
    let query = _state(fromLink());
    let tab = _state(route().view ?? 'all');
    let selected = _state<string[]>([]);
    let hidden = _state<string[]>([]);
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

    const confirm = useConfirm();
    const toaster = createToaster();
    /** 删除：只限待启动；确认后删除，提示里可以撤销 */
    async function remove(task: CostTask) {
      const ok = await confirm({
        title: `删除 ${task.code}？`,
        description: '只有待启动的项目可以删除；已经开始的请用“终止”，终止要填原因并留痕。',
        tone: 'danger',
        confirmText: '删除',
      });
      if (!ok) return;
      const undo = removeTask(task.code);
      selected = selected.filter((code) => code !== task.code);
      const id = toaster.show({
        title: `已删除 ${task.code}`,
        tone: 'success',
        action: (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              undo();
              toaster.dismiss(id);
            }}
          >
            撤销
          </Button>
        ),
      });
    }

    // 列定义只建一次：各台账自己的列是页面写死的配置，用 _untrack 取一次
    const columns: DataTableColumn<CostTask>[] = [
      {
        key: 'code',
        header: amount.codeHeader,
        width: 140,
        sticky: 'start',
        sortable: true,
        cell: (task) => (
          <Link href={casePath('TaskDetail', { code: task.code })} sx={styles.code}>
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
        value: (task) => task.expected,
        cell: (task) => money(task.expected, '—'),
      },
      {
        key: 'a',
        header: '测算 A',
        width: 88,
        align: 'end',
        sortable: true,
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
        cell: (task) =>
          progressDots(
            task.milestones.map((item) => ({ label: item.label, done: item.done != null })),
          ),
      },
      { key: 'due', header: '计划完成', width: 100, sortable: true },
      {
        key: 'overdue',
        header: '超时',
        width: 64,
        sortable: true,
        align: 'end',
        // 按紧迫程度排：超时越久越前，没到期的离到期越近越前，已结束的在最后
        value: (task) =>
          isFinished(task) ? Number.NEGATIVE_INFINITY : daysBetween(task.due, TODAY),
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
            <LinkButton href={casePath(editor, { code: task.code })} size="sm" variant="link">
              编辑
            </LinkButton>
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
              <MenuItem icon={FastForward} disabled={isFinished(task)}>
                推进到下一状态
              </MenuItem>
              <MenuLinkItem icon={FilePen} href={casePath(editor, { code: task.code })}>
                调整计划
              </MenuLinkItem>
              <MenuItem icon={Send} disabled={!canClose(task)}>
                关闭归档
              </MenuItem>
              <MenuItem icon={Pause} disabled={isFinished(task)}>
                暂停
              </MenuItem>
              <MenuItem icon={CircleX} tone="danger" disabled={isFinished(task)}>
                终止
              </MenuItem>
              <MenuItem
                icon={Trash2}
                tone="danger"
                disabled={task.status !== 'pending'}
                onSelect={() => void remove(task)}
              >
                删除
              </MenuItem>
            </Menu>
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
      ({ page, pageSize, sort, filters, params: view }) =>
        fetchTasks(
          taskStore.value.filter((task) => task.kind === kind),
          filters,
          view,
          sort,
          page,
          pageSize,
          columns,
        ),
      {
        filters: fromLink(),
        pageSize: 20,
        sort: { key: 'overdue', direction: 'descending' },
        params: () => tab,
      },
    );
    // 数据变了（删除、撤销删除）：按当前条件重新请求，留在当前页
    watch(
      () => taskStore.value,
      () => void tasks.refresh(),
    );

    const search = () => tasks.search({ ...query });
    function reset() {
      query = blank();
      search();
    }

    return () => {
      const first = tasks.total ? (tasks.page - 1) * tasks.pageSize + 1 : 0;
      const bar = filters(query);
      return (
        <CaseShell
          current={kind}
          nav={
            <Tabs value={_bind(tab)}>
              <TabList aria-label="项目视图">
                {tabs.map((item) => (
                  <Tab key={item.value} value={item.value}>
                    {item.label}
                    <Badge radius="full" tone={tab === item.value ? 'accent' : 'neutral'}>
                      {tasks.data?.counts[item.value] ?? '…'}
                    </Badge>
                  </Tab>
                ))}
                {/* 第二组：关注，跨状态；条数用色调提示轻重 */}
                <span aria-hidden="true" {...stylex.attrs(styles.tabDivider)} />
                {focuses.map((item) => (
                  <Tab key={item.value} value={item.value}>
                    {item.label}
                    <Badge
                      radius="full"
                      tone={item.tone}
                      variant={tab === item.value ? 'solid' : 'soft'}
                    >
                      {tasks.data?.counts[item.value] ?? '…'}
                    </Badge>
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          }
        >
          <div {...stylex.attrs(styles.page)}>
            <FilterBar
              onSearch={search}
              onReset={reset}
              loading={tasks.loading}
              moreActive={bar.moreActive}
              actions={
                <LinkButton href={casePath(editor)} icon={Plus} variant="soft">
                  新建项目
                </LinkButton>
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
                <Button size="sm" variant="outline" tone="neutral" icon={Download}>
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
                renderDetail={(task) => detail(task, detailExtra?.(task))}
                expandedRows={_bind(expanded)}
                loading={tasks.loading}
                aria-label={kind === 'unit' ? '单机降本台账' : '降 DMC 台账'}
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
          <Toaster controller={toaster} />
        </CaseShell>
      );
    };
  },
);

/** 查询栏里共用的几项：责任一级团队、完成年度、联络人、提出单位、完成形式、涉及供应商、经费来源、收益状态 */
export const filterFields = {
  team: (query: LedgerQuery) => (
    <Field label="团队">
      <Select
        items={teams.map((team) => ({ value: team, label: shortTeam(team) }))}
        value={_bind(query.team)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  year: (query: LedgerQuery) => (
    <Field label="完成年度">
      <DatePicker granularity="year" value={_bind(query.year)} />
    </Field>
  ),
  contact: (query: LedgerQuery) => (
    <Field label="联络人">
      <Combobox items={people} value={_bind(query.contact)} placeholder="输入姓名" />
    </Field>
  ),
  category: (query: LedgerQuery) => (
    <Field label="类别">
      <Select items={categories} value={_bind(query.category)} placeholder="全部" clearable />
    </Field>
  ),
  org: (query: LedgerQuery) => (
    <Field label="提出单位">
      <Select items={orgs} value={_bind(query.org)} placeholder="全部" clearable />
    </Field>
  ),
  form: (query: LedgerQuery) => (
    <Field label="完成形式">
      <Select items={completionForms} value={_bind(query.form)} placeholder="全部" clearable />
    </Field>
  ),
  install: (query: LedgerQuery) => (
    <Field label="必装 / 选装">
      <Select
        items={[
          { value: 'required', label: '必装' },
          { value: 'optional', label: '选装' },
        ]}
        value={_bind(query.install)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  supplier: (query: LedgerQuery) => (
    <Field label="涉及供应商">
      <Select items={suppliers} value={_bind(query.supplier)} placeholder="全部" clearable />
    </Field>
  ),
  funding: (query: LedgerQuery) => (
    <Field label="经费来源">
      <Select items={fundingSources} value={_bind(query.funding)} placeholder="全部" clearable />
    </Field>
  ),
  valueState: (query: LedgerQuery) => (
    <Field label="收益状态">
      <Select
        items={valueStates.options()}
        value={_bind(query.valueState)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  needSb: (query: LedgerQuery) => (
    <Field label="需要 SB">
      <Select
        items={[
          { value: 'yes', label: '是' },
          { value: 'no', label: '否' },
        ]}
        value={_bind(query.needSb)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
};

/** 收起的条件里填了几项（空字符串与 null 都算没填） */
export const countActive = (query: LedgerQuery, keys: readonly (keyof LedgerQuery)[]) =>
  keys.filter((key) => query[key]).length;

/** 共用的列：责任一级团队（简称，悬停看全称）、联络人、完成形式、提出单位 */
export const ledgerColumns = {
  category: {
    key: 'category',
    header: '类别',
    width: 84,
    value: (task: CostTask) => labelOf(categories, task.category),
  },
  team: {
    key: 'team',
    header: '责任团队',
    // 放得下最长的简称（起落架液压系统）
    width: 128,
    value: (task: CostTask) => shortTeam(task.team),
    cell: (task: CostTask) => <span title={task.team}>{shortTeam(task.team)}</span>,
  },
  contact: {
    key: 'contact',
    header: '联络人',
    width: 72,
    value: (task: CostTask) => personName(task.contact),
  },
  org: { key: 'org', header: '提出单位', width: 106 },
  form: { key: 'form', header: '完成形式', width: 88 },
} satisfies Record<string, DataTableColumn<CostTask>>;

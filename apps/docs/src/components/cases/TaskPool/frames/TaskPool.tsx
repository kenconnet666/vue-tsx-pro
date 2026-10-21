// 案例：任务池（PEMO 管进度）。字段、状态与口径按《需求定义方案》的任务卡；数据是虚构的。
// 顶栏的页签分两组：按状态分组，与“关注”（跨状态的超时、即将到期、可关闭、关闭材料不全）；条数只在页签上出现；
// 表格按任务卡的字段：来源编号、里程碑、计划完成与超时天数、收益状态、A / B / D。
// 金额不做合计：不同收益状态不能相加（看钱去一本账）；单机降本（万元）与降 DMC（美元 / FH）单位不同，每格带单位。
// 状态只由页签决定（查询栏里不再有状态）；统计看板里点数字跳过来时，地址上带着页签与筛选（view、valueState、kind、basis）。
// 表格按服务端的方式排序、分页（内存里的数据模拟接口：延迟 300 ms，只采用最后一次请求的结果）。
// 增删改查：新建、编辑去“降本项目编辑”（主表字段只在那里维护），查看去任务卡详情；删除只限待启动的任务
// （已经开始的按需求走终止），删除前确认，删除后可以撤销
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
  Trash2,
  Search,
  Send,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Button,
  Combobox,
  DataTable,
  dataTableStyles,
  DateRangePicker,
  Field,
  FilterBar,
  Flex,
  Icon,
  IconButton,
  Link,
  LinkButton,
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuLinkItem,
  PageSizeSelect,
  Pagination,
  Select,
  SelectionBar,
  Small,
  Steps,
  sortRows,
  Tab,
  TabList,
  Tabs,
  Text,
  TextField,
  Toaster,
  createToaster,
  useConfirm,
  useFormat,
  type DataTableColumn,
  type DataTableColumnGroup,
  type SortState,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { watch } from 'vue';
import {
  amountBases,
  canClose,
  channels,
  daysBetween,
  isFinished,
  labelOf,
  models,
  overdueDays,
  people,
  personName,
  removeTask,
  statusGroups,
  suppliers,
  taskStatuses,
  taskStore,
  TODAY,
  valueStates,
  workPackages,
  type CostTask,
} from '../../data';
import { CaseShell, casePath, useCaseQuery } from '../../shell';

/** 页签的第一组：全部与各状态分组 */
const tabs = [{ value: 'all', label: '全部', statuses: null }, ...statusGroups] as const;

const daysToDue = (task: CostTask) => daysBetween(TODAY, task.due);

/** 关注：跨状态的快捷筛选，PEMO 每天要看的几类 */
const focuses = [
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

interface Query {
  keyword: string;
  valueState: string;
  model: string;
  owner: string;
  workPackage: string;
  channel: string;
  supplier: string;
  kind: string;
  basis: string;
  due: { start: string; end: string } | null;
}

const blank = (): Query => ({
  keyword: '',
  valueState: '',
  model: '',
  owner: '',
  workPackage: '',
  channel: '',
  supplier: '',
  kind: '',
  basis: '',
  due: null,
});

const matches = (task: CostTask, query: Query) =>
  (!query.keyword ||
    task.name.includes(query.keyword) ||
    task.code.includes(query.keyword) ||
    task.sourceCode.includes(query.keyword)) &&
  (!query.valueState || task.valueState === query.valueState) &&
  (!query.model || task.model === query.model) &&
  (!query.owner || task.owner === query.owner) &&
  (!query.workPackage || task.workPackage === query.workPackage) &&
  (!query.channel || task.channel === query.channel) &&
  (!query.supplier || task.supplier === query.supplier) &&
  (!query.kind || task.kind === query.kind) &&
  (!query.basis || task.basis === query.basis) &&
  (!query.due || (task.due >= query.due.start && task.due <= query.due.end));

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
  query: Query,
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
    height: 'calc(100dvh - 3rem - 2 * _space.md)',
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
  negative: { color: '_dangerText' },
  milestones: { display: 'inline-flex', alignItems: 'center', gap: '2px' },
  milestoneDone: { color: '_successText' },
  milestoneTodo: { color: '_textMuted' },
  // 详情三段：描述、里程碑、关闭材料；每段宽度按内容，不在中间留大片空白
  detail: {
    display: 'grid',
    gridTemplateColumns: 'minmax(16rem, 1.4fr) minmax(20rem, 1.6fr) minmax(14rem, 1fr)',
    gap: '_xl',
    alignItems: 'start',
  },
  detailBlock: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
});

const WAN = { scale: 10_000, minimumFractionDigits: 2, maximumFractionDigits: 2 };
const DMC = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

/** 里程碑：三个圆点，完成的打勾；完整说明给读屏与悬停提示 */
function milestoneDots(task: CostTask) {
  const label = task.milestones
    .map((item) => `${item.label}${item.done ? '已完成' : '未完成'}`)
    .join('，');
  return (
    <span {...stylex.attrs(styles.milestones)} role="img" aria-label={label} title={label}>
      {task.milestones.map((item) => (
        <Icon
          key={item.label}
          icon={item.done ? CircleCheck : CircleDashed}
          sx={item.done ? styles.milestoneDone : styles.milestoneTodo}
        />
      ))}
    </span>
  );
}

/** 详情：表格里没有的信息（行里已有的状态、里程碑圆点不再重复）——简要描述、三个里程碑的日期与交付证据、关闭三材料 */
function detail(task: CostTask) {
  const done = task.milestones.filter((item) => item.done).length;
  const missing = Object.values(task.closing).filter((ok) => !ok).length;
  const materials = [
    { label: '验证窗结论', ok: task.closing.verification },
    { label: '收益认定意见', ok: task.closing.benefit },
    { label: '商务谈定记录', ok: task.closing.business },
  ];
  return (
    <div {...stylex.attrs(styles.detail)}>
      <section {...stylex.attrs(styles.detailBlock)}>
        <Small tone="muted">简要描述</Small>
        <Text size="sm">{task.description}</Text>
        <Small tone="muted">
          供应商 {task.supplier} · {labelOf(amountBases, task.basis)} ·{' '}
          {task.kind === 'unit' ? '单机降本' : '降 DMC'}
        </Small>
      </section>
      <section {...stylex.attrs(styles.detailBlock)}>
        <Small tone="muted">里程碑与交付证据</Small>
        <Steps
          size="sm"
          current={done}
          aria-label="里程碑"
          items={task.milestones.map((item) => ({
            title: item.label,
            description: item.done ? (
              <Flex inline align="center" gap="xs">
                {item.done}
                {item.evidence && (
                  <Link href="#" title={item.evidence}>
                    <Icon icon={Paperclip} />
                  </Link>
                )}
              </Flex>
            ) : (
              '未完成'
            ),
          }))}
        />
      </section>
      <section {...stylex.attrs(styles.detailBlock)}>
        <Small tone="muted">关闭三材料</Small>
        <Flex gap="md" wrap>
          {materials.map((item) => (
            <Flex key={item.label} inline align="center" gap="xs">
              <Icon
                icon={item.ok ? CircleCheck : CircleDashed}
                sx={item.ok ? styles.milestoneDone : styles.milestoneTodo}
              />
              <Small tone={item.ok ? undefined : 'muted'}>{item.label}</Small>
            </Flex>
          ))}
        </Flex>
        <Small tone={missing ? 'muted' : 'success'}>
          {missing ? `缺 ${missing} 项，不能关闭` : '材料齐全，可以关闭'}
        </Small>
      </section>
    </div>
  );
}

export default _component(() => {
  const format = useFormat();
  const route = useCaseQuery();
  // 从统计看板跳过来时地址上带的页签与筛选
  const fromLink = (): Query => {
    const params = route();
    return {
      ...blank(),
      valueState: params.valueState ?? '',
      kind: params.kind ?? '',
      basis: params.basis ?? '',
    };
  };
  let query = _state(fromLink());
  let applied = _state(fromLink());
  let tab = _state(route().view ?? 'all');
  let sort = _state<SortState | null>({ key: 'overdue', direction: 'descending' });
  let page = _state(1);
  let size = _state(20);
  let selected = _state<string[]>([]);
  let hidden = _state<string[]>(['supplier']);
  let expanded = _state<string[]>([]);
  let loading = _state(true);
  let result = _state.raw<Page>({ rows: [], total: 0, counts: {} });

  /** 金额与单位：单机降本按万元，降 DMC 是美元 / FH；没有值时显示 empty */
  const money = (task: CostTask, value: Decimal | null, empty: string) =>
    value == null ? (
      <Small tone="muted">{empty}</Small>
    ) : (
      <span {...stylex.attrs(value.isNegative() && styles.negative)}>
        {format.number(value, task.kind === 'unit' ? WAN : DMC)}
        <span {...stylex.attrs(styles.unit)}>{task.kind === 'unit' ? '万元' : '美元/FH'}</span>
      </span>
    );
  const gap = (task: CostTask) => (task.a && task.b ? task.b.minus(task.a) : null);

  // 编号、名称、操作一直显示，其余的可以隐藏
  const fixed = ['code', 'name', 'actions'];
  const toggleColumn = (key: string, on: boolean) =>
    (hidden = on ? hidden.filter((item) => item !== key) : [...hidden, key]);
  /** 列设置：操作列表头里的按钮。单独成组件，勾选状态跟着 hidden 更新（列定义只建一次） */
  const ColumnSettings = _component(() => () => (
    <Menu
      trigger={(props) => (
        <IconButton
          {...props}
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

  const columns: DataTableColumn<CostTask>[] = [
    {
      key: 'code',
      header: '任务编号',
      width: 152,
      sticky: 'start',
      sortable: true,
      cell: (task) => (
        <Link href={casePath('TaskDetail', { code: task.code })} sx={styles.code}>
          {task.code}
        </Link>
      ),
    },
    // 不写宽度：占满其他列剩下的宽度
    { key: 'name', header: '任务名称', sortable: true },
    {
      key: 'source',
      header: '来源',
      width: 124,
      value: (task) => task.sourceCode,
      // JY 是渠道一的建议、FA 是渠道二的方案；悬停看渠道
      cell: (task) => (
        <Link href="#" sx={styles.code} title={labelOf(channels, task.channel)}>
          {task.sourceCode}
        </Link>
      ),
    },
    {
      key: 'scope',
      header: '型号 · 工作包',
      width: 116,
      value: (task) => `${task.model} · ${task.workPackage}`,
    },
    { key: 'supplier', header: '供应商', width: 88 },
    { key: 'owner', header: '主办', width: 72, value: (task) => personName(task.owner) },
    { key: 'status', header: '状态', width: 108, statuses: taskStatuses },
    { key: 'milestones', header: '里程碑', width: 76, cell: milestoneDots },
    { key: 'due', header: '计划完成', width: 104, sortable: true },
    {
      key: 'overdue',
      header: '超时',
      width: 76,
      sortable: true,
      align: 'end',
      value: overdueDays,
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
    // 收益分组下的“挂账”：预测、承诺、实现三种挂账口径（与任务的进度状态不是同一个维度）
    { key: 'valueState', header: '挂账', width: 96, statuses: valueStates },
    {
      key: 'a',
      header: '测算 A',
      width: 116,
      align: 'end',
      sortable: true,
      value: (task) => task.a,
      cell: (task) => money(task, task.a, task.status === 'unpriced' ? '待定价' : '—'),
    },
    {
      key: 'b',
      header: '商务 B',
      width: 116,
      align: 'end',
      sortable: true,
      value: (task) => task.b,
      cell: (task) => money(task, task.b, '—'),
    },
    {
      key: 'd',
      header: '差额 D',
      width: 104,
      align: 'end',
      value: gap,
      // 悬停看归因：供应商让利、商务条件置换……
      cell: (task) => (
        <span title={task.gapReason ?? undefined}>{money(task, gap(task), '—')}</span>
      ),
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
      width: 88,
      sticky: 'end',
      // 文字按钮用 link、图标按钮用 xs 加 cellControl：不把行撑高
      cell: (task) => (
        <Flex align="center" gap="sm">
          <LinkButton href={casePath('TaskDetail', { code: task.code })} size="sm" variant="link">
            查看
          </LinkButton>
          <Menu
            trigger={(props) => (
              <IconButton
                {...props}
                size="xs"
                icon={Ellipsis}
                aria-label={`更多：${task.code}`}
                sx={dataTableStyles.cellControl}
              />
            )}
          >
            <MenuLinkItem icon={FilePen} href={casePath('ProjectEditor', { code: task.code })}>
              编辑
            </MenuLinkItem>
            <MenuItem icon={FastForward} disabled={isFinished(task)}>
              推进到下一状态
            </MenuItem>
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
    { key: 'benefit', header: '收益', columns: ['valueState', 'a', 'b', 'd'] },
  ];

  const confirm = useConfirm();
  const toaster = createToaster();
  /** 删除：只限待启动的任务；确认后删除，提示里可以撤销 */
  async function remove(task: CostTask) {
    const ok = await confirm({
      title: `删除任务卡 ${task.code}？`,
      description: '只有待启动的任务可以删除；已经开始的任务请用“终止”，终止要填原因并留痕。',
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

  // 只采用最后一次请求的结果：翻页、换条件很快时，先发的请求晚到也不会覆盖
  let latest = 0;
  async function load() {
    const ticket = ++latest;
    loading = true;
    const next = await fetchTasks(taskStore.value, applied, tab, sort, page, size, columns);
    if (ticket !== latest) return;
    result = next;
    loading = false;
  }
  watch(
    () => [taskStore.value, applied, tab, sort, page, size],
    () => void load(),
    { immediate: true },
  );

  function search() {
    applied = { ...query };
    page = 1;
  }
  function reset() {
    query = blank();
    search();
  }
  const moreActive = () =>
    [query.workPackage, query.channel, query.supplier, query.kind, query.basis].filter(Boolean)
      .length + (query.due ? 1 : 0);

  return () => {
    const first = result.total ? (page - 1) * size + 1 : 0;
    return (
      <CaseShell
        current="tasks"
        nav={
          <Tabs
            value={_bind(
              () => tab,
              (next: string) => {
                tab = next;
                page = 1;
              },
            )}
          >
            <TabList aria-label="任务视图">
              {tabs.map((item) => (
                <Tab key={item.value} value={item.value}>
                  {item.label}
                  <Badge radius="full" tone={tab === item.value ? 'accent' : 'neutral'}>
                    {result.counts[item.value] ?? '…'}
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
                    {result.counts[item.value] ?? '…'}
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
            actions={
              <LinkButton href={casePath('ProjectEditor')} icon={Plus} variant="soft">
                新建任务卡
              </LinkButton>
            }
            loading={loading}
            moreActive={moreActive()}
            more={
              <>
                <Field label="工作包">
                  <Select
                    items={workPackages}
                    value={_bind(query.workPackage)}
                    placeholder="全部"
                    clearable
                  />
                </Field>
                <Field label="来源">
                  <Select
                    items={channels}
                    value={_bind(query.channel)}
                    placeholder="全部"
                    clearable
                  />
                </Field>
                <Field label="供应商">
                  <Select
                    items={suppliers}
                    value={_bind(query.supplier)}
                    placeholder="全部"
                    clearable
                  />
                </Field>
                <Field label="降本类型">
                  <Select
                    items={[
                      { value: 'unit', label: '单机降本' },
                      { value: 'dmc', label: '降 DMC' },
                    ]}
                    value={_bind(query.kind)}
                    placeholder="全部"
                    clearable
                  />
                </Field>
                <Field label="金额口径">
                  <Select
                    items={amountBases}
                    value={_bind(query.basis)}
                    placeholder="全部"
                    clearable
                  />
                </Field>
                <Field label="计划完成">
                  <DateRangePicker value={_bind(query.due)} />
                </Field>
              </>
            }
          >
            <Field label="关键字">
              <TextField
                value={_bind(query.keyword)}
                icon={Search}
                placeholder="编号 / 名称 / 来源"
                clearable
              />
            </Field>
            <Field label="收益状态">
              <Select
                items={valueStates.options()}
                value={_bind(query.valueState)}
                placeholder="全部"
                clearable
              />
            </Field>
            <Field label="型号">
              <Select items={models} value={_bind(query.model)} placeholder="全部" clearable />
            </Field>
            <Field label="主办">
              <Combobox items={people} value={_bind(query.owner)} placeholder="输入姓名" />
            </Field>
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
              rows={result.rows}
              columns={columns}
              columnGroups={groups}
              rowKey={(task) => task.code}
              sort={_bind(sort)}
              manualSort
              selectionMode="multiple"
              selected={_bind(selected)}
              hiddenColumns={hidden}
              renderDetail={detail}
              expandedRows={_bind(expanded)}
              loading={loading}
              aria-label="任务池"
              propsRoot={{ sx: styles.table }}
            />
            <Flex align="center" justify="between" gap="md" wrap>
              <Small tone="muted">
                第 {first}–{Math.min(page * size, result.total)} 条 · 勾选跨页保留
              </Small>
              <Flex align="center" gap="md" wrap>
                <Pagination
                  aria-label="任务池分页"
                  page={_bind(page)}
                  total={result.total}
                  pageSize={size}
                />
                <PageSizeSelect value={_bind(size)} onUpdate={() => (page = 1)} />
              </Flex>
            </Flex>
          </div>
        </div>
        <Toaster controller={toaster} />
      </CaseShell>
    );
  };
});

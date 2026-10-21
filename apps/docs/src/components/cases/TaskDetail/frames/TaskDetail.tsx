// 案例：项目详情（任务卡）。按设计规格的“项目详情”：页头（编码、名称、状态、收益状态、按当前状态给出的下一步与更多操作、关键信息）、
// 八个状态的步骤条（异常状态按已完成的里程碑推断停在哪一步并标红）、左栏（概览：主表字段与编辑页同组；降本明细或实施节点；变更记录）、
// 右栏（收益：预期、测算 A、商务 B、差额 D 与归因、金额口径；里程碑与交付证据；关闭三材料），右栏滚动时粘住。
// “下一步”真的推进状态并写回任务卡（台账、看板都能看到）；地址上带 code，不带时显示第一项。数据是虚构的
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Ellipsis,
  FilePen,
  Lock,
  Paperclip,
  Pause,
  Trash2,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  createToaster,
  Descriptions,
  Flex,
  H1,
  H2,
  Icon,
  IconButton,
  Link,
  LinkButton,
  Menu,
  MenuItem,
  MenuLinkItem,
  Small,
  StatusBadge,
  Steps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Timeline,
  Toaster,
  useConfirm,
  useFormat,
  type TimelineItem,
  daysBetween,
  shiftIsoDate,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import type { VNodeChild } from 'vue';
import {
  advanceTask,
  amountBases,
  canClose,
  categories,
  channels,
  costKinds,
  fundingSources,
  isFinished,
  labelOf,
  overdueDays,
  partSaving,
  personName,
  removeTask,
  saveTask,
  taskFlow,
  taskStatuses,
  taskStore,
  TODAY,
  valueStates,
  type CostTask,
} from '../../data';
import { CaseShell, casePath, useCaseNavigate, useCaseQuery, type CasePage } from '../../shell';

/** 按当前状态的下一步：主按钮的文字与推进到的状态；没有下一步时为 null */
function nextStep(task: CostTask): { label: string; next: string } | null {
  switch (task.status) {
    case 'pending':
      return { label: '启动方案设计', next: 'designing' };
    case 'designing':
      return { label: '方案确定，进入验证', next: 'verifying' };
    case 'verifying':
      return { label: '验证达标，提交认定', next: 'awaiting' };
    case 'awaiting':
      return { label: '认定收益，锁定 A', next: 'confirmed' };
    case 'confirmed':
      return { label: '开始商务洽谈', next: 'negotiating' };
    case 'negotiating':
      return { label: '商务谈定，回填 B', next: 'realized' };
    case 'realized':
      return canClose(task) ? { label: '关闭归档', next: 'closed' } : null;
    case 'paused':
      return { label: '恢复执行', next: 'designing' };
    case 'unpriced':
      return { label: '完成定价，提交认定', next: 'awaiting' };
    default:
      return null;
  }
}

/** 步骤条停在哪一步：正常状态就是它自己；异常状态按完成了几个里程碑推断 */
function stepOf(task: CostTask): number {
  const index = taskFlow.indexOf(task.status);
  if (index >= 0) return task.status === 'closed' ? taskFlow.length : index;
  return 1 + task.milestones.filter((item) => item.done).length;
}

/** 变更记录：从任务卡的里程碑、金额与状态推出（演示数据没有单独的日志） */
function history(task: CostTask, money: (value: Decimal) => string): TimelineItem[] {
  const firstDone = task.milestones.find((item) => item.done)?.done;
  const items: (TimelineItem & { at: string })[] = [
    {
      at: shiftIsoDate(firstDone ?? TODAY, { days: -21 }),
      title: '进入任务池',
      description: `${labelOf(channels, task.channel)}（${task.sourceCode}）派单，主办 ${personName(task.owner)}`,
    },
  ];
  for (const item of task.milestones) {
    if (item.done)
      items.push({
        at: item.done,
        title: `里程碑：${item.label}`,
        description: item.evidence ? `交付证据 ${item.evidence}` : undefined,
        tone: 'success',
      });
  }
  const confirmed = task.milestones.find((item) => item.label === '收益确认')?.done;
  if (task.a && confirmed)
    items.push({
      at: confirmed,
      title: '测算金额 A 锁定',
      description: money(task.a),
      tone: 'accent',
    });
  if (task.b)
    items.push({
      at: shiftIsoDate(confirmed ?? TODAY, { days: 14 }),
      title: '商务金额 B 回填',
      description: `B ${money(task.b)}，差额 D ${money(task.b.minus(task.a ?? task.b))}（${task.gapReason ?? '—'}）`,
      tone: 'success',
    });
  if (['paused', 'terminated', 'unpriced'].includes(task.status))
    items.push({
      at: TODAY,
      title: `状态改为“${taskStatuses.label(task.status)}”`,
      tone: task.status === 'terminated' ? 'danger' : 'warning',
    });
  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ at, ...item }) => ({ ...item, time: at, dateTime: at }));
}

const styles = stylex.create({
  page: { display: 'flex', flexDirection: 'column', gap: '_md', paddingBlockEnd: '_xl' },
  head: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '_md', flexWrap: 'wrap' },
  code: { fontFamily: '_mono', fontSize: '_md', color: '_textMuted' },
  actions: { display: 'flex', alignItems: 'center', gap: '_sm', marginInlineStart: 'auto' },
  // 关键信息：一行排开，标签淡、值正常
  facts: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '_xl',
    rowGap: '_xs',
    margin: 0,
  },
  fact: { display: 'flex', gap: '_xs', alignItems: 'baseline' },
  factLabel: { color: '_textMuted', fontSize: '_sm' },
  factValue: { margin: 0, fontSize: '_sm' },
  late: { color: '_dangerText', fontWeight: '_semibold' },
  steps: { paddingBlock: '_sm' },
  // 两栏：左栏放长内容，右栏是收益、里程碑与关闭材料，滚动时粘在顶栏下面
  body: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 72rem)': 'minmax(0, 1fr) 26rem',
    },
    gap: '_md',
    alignItems: 'start',
  },
  main: { display: 'flex', flexDirection: 'column', gap: '_md', minWidth: 0 },
  side: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_md',
    position: { default: null, '@media (min-width: 72rem)': 'sticky' },
    top: 'calc(3rem + _space.md)',
  },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_sm' },
  number: { fontVariantNumeric: 'tabular-nums' },
  mono: { fontFamily: '_mono', fontSize: '_sm' },
  // 收益：三个数一排，D 与归因在下面
  amounts: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '_sm' },
  amount: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  amountValue: { fontSize: '_xl', fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  check: { display: 'flex', alignItems: 'center', gap: '_sm' },
  done: { color: '_successText', flexShrink: 0 },
  todo: { color: '_textMuted', flexShrink: 0 },
  grow: { flexGrow: 1, minWidth: 0 },
});

export default _component(() => {
  const format = useFormat();
  const route = useCaseQuery();
  const navigate = useCaseNavigate();
  const confirm = useConfirm();
  const toaster = createToaster();
  const task = () =>
    taskStore.value.find((item) => item.code === route().code) ?? taskStore.value[0]!;

  function update(next: CostTask, message: string) {
    saveTask(next);
    toaster.show({ title: message, tone: 'success' });
  }
  async function pause(current: CostTask) {
    update({ ...current, status: 'paused' }, `${current.code} 已暂停`);
  }
  async function terminate(current: CostTask) {
    const ok = await confirm({
      title: `终止 ${current.code}？`,
      description: '终止后不再推进，事项按否决原因进入储备库；这一步会记进变更记录。',
      tone: 'danger',
      confirmText: '终止',
    });
    if (ok) update({ ...current, status: 'terminated' }, `${current.code} 已终止`);
  }
  async function remove(current: CostTask) {
    const ok = await confirm({
      title: `删除 ${current.code}？`,
      description: '只有待启动的项目可以删除。',
      tone: 'danger',
      confirmText: '删除',
    });
    if (!ok) return;
    removeTask(current.code);
    navigate(current.kind === 'unit' ? 'UnitLedger' : 'DmcLedger');
  }

  return () => {
    const current = task();
    const unit = current.kind === 'unit';
    const ledger: CasePage = unit ? 'UnitLedger' : 'DmcLedger';
    const editor: CasePage = unit ? 'UnitEditor' : 'DmcEditor';
    const amount = costKinds[current.kind];
    const money = (value: Decimal) => `${format.number(value, amount.format)} ${amount.unit}`;
    const yuan = (value: Decimal) =>
      format.number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const step = nextStep(current);
    const late = overdueDays(current);
    const abnormal = taskFlow.indexOf(current.status) < 0;
    const stepIndex = stepOf(current);
    const detail = current.unitDetail;
    const missing = Object.values(current.closing).filter((ok) => !ok).length;
    const gap = current.a && current.b ? current.b.minus(current.a) : null;

    const facts: [string, VNodeChild][] = [
      ['降本类型', amount.label],
      ['责任一级团队', current.team],
      ['主办', personName(current.owner)],
      ['联络人', `${personName(current.contact)}（${current.contact}）`],
      ['来源', `${labelOf(channels, current.channel)} · ${current.sourceCode}`],
      [
        '计划完成',
        late > 0 ? (
          <span>
            {current.due} <span {...stylex.attrs(styles.late)}>超时 {late} 天</span>
          </span>
        ) : isFinished(current) ? (
          current.due
        ) : (
          `${current.due}（还剩 ${daysBetween(TODAY, current.due)} 天）`
        ),
      ],
    ];

    return (
      <CaseShell current={unit ? 'unit' : 'dmc'}>
        <div {...stylex.attrs(styles.page)}>
          <header {...stylex.attrs(styles.head)}>
            <Breadcrumbs
              items={[
                { label: `${amount.label}台账`, href: casePath(ledger) },
                { label: current.code },
              ]}
            />
            <div {...stylex.attrs(styles.titleRow)}>
              <span {...stylex.attrs(styles.code)}>{current.code}</span>
              <H1 size="xl">{current.name}</H1>
              <StatusBadge statuses={taskStatuses} value={current.status} />
              <StatusBadge statuses={valueStates} value={current.valueState} />
              <div {...stylex.attrs(styles.actions)}>
                {step && (
                  <Button
                    onClick={() =>
                      update(
                        advanceTask(current, step.next),
                        `已推进到“${taskStatuses.label(step.next)}”`,
                      )
                    }
                  >
                    {step.label}
                  </Button>
                )}
                {current.status === 'realized' && !canClose(current) && (
                  <Small tone="muted">关闭三材料缺 {missing} 项，补齐后可以关闭</Small>
                )}
                <LinkButton
                  href={casePath(editor, { code: current.code })}
                  variant="outline"
                  tone="neutral"
                  icon={FilePen}
                >
                  编辑
                </LinkButton>
                <Menu
                  trigger={(trigger) => (
                    <IconButton
                      {...trigger}
                      icon={Ellipsis}
                      variant="outline"
                      aria-label="更多操作"
                    />
                  )}
                >
                  <MenuLinkItem icon={FilePen} href={casePath(editor, { code: current.code })}>
                    调整计划
                  </MenuLinkItem>
                  <MenuItem
                    icon={Pause}
                    disabled={isFinished(current) || current.status === 'paused'}
                    onSelect={() => void pause(current)}
                  >
                    暂停
                  </MenuItem>
                  <MenuItem
                    icon={CircleX}
                    tone="danger"
                    disabled={isFinished(current)}
                    onSelect={() => void terminate(current)}
                  >
                    终止
                  </MenuItem>
                  <MenuItem
                    icon={Trash2}
                    tone="danger"
                    disabled={current.status !== 'pending'}
                    onSelect={() => void remove(current)}
                  >
                    删除
                  </MenuItem>
                </Menu>
              </div>
            </div>
            <dl {...stylex.attrs(styles.facts)}>
              {facts.map(([label, value]) => (
                <div key={label} {...stylex.attrs(styles.fact)}>
                  <dt {...stylex.attrs(styles.factLabel)}>{label}</dt>
                  <dd {...stylex.attrs(styles.factValue)}>{value}</dd>
                </div>
              ))}
            </dl>
          </header>

          <Steps
            size="sm"
            current={stepIndex}
            aria-label="任务状态"
            sx={styles.steps}
            items={taskFlow.map((status, index) => ({
              title: taskStatuses.label(status),
              status: abnormal && index === stepIndex ? 'error' : undefined,
              description:
                abnormal && index === stepIndex ? taskStatuses.label(current.status) : undefined,
            }))}
          />

          <div {...stylex.attrs(styles.body)}>
            <div {...stylex.attrs(styles.main)}>
              <Card variant="outline" header={<H2 size="sm">概览</H2>}>
                <Descriptions
                  columns={3}
                  size="sm"
                  items={[
                    ...(unit
                      ? [
                          { label: '任务类别', value: labelOf(categories, current.category) },
                          { label: '提出单位 / 部门', value: `${current.org} / ${current.dept}` },
                        ]
                      : [{ label: '提出单位', value: current.org }]),
                    {
                      label: '必装 / 选装',
                      value: current.install === 'required' ? '必装' : '选装',
                    },
                    { label: '数模编号 + 版本', value: current.modelNo || '—' },
                    ...(unit
                      ? []
                      : [
                          { label: '供应商件号', value: current.supplierPartNos.join('、') || '—' },
                        ]),
                    { label: '完成年度', value: unit ? current.year : current.due },
                    { label: '贯彻架次', value: current.flights ?? '—' },
                    { label: '完成形式', value: current.form },
                    { label: '涉及供应商', value: current.supplier },
                    ...(unit
                      ? [
                          {
                            label: '经费来源',
                            value:
                              current.funding
                                .map((item) => labelOf(fundingSources, item))
                                .join('、') || '—',
                          },
                          { label: '项目建议书编号', value: current.proposalNo || '—' },
                        ]
                      : [{ label: '需要 SB 贯彻', value: current.needSb ? '是' : '否' }]),
                    { label: '型号 / 工作包', value: `${current.model} / ${current.workPackage}` },
                    { label: '简要描述', value: current.description, span: 3 },
                  ]}
                />
              </Card>

              {detail && (
                <Card
                  variant="outline"
                  header={
                    <div {...stylex.attrs(styles.cardHead)}>
                      <H2 size="sm">降本明细</H2>
                      <Small tone="muted">
                        {detail.parts.length} 条零件更改 · 单机零件收益合计{' '}
                        {yuan(
                          detail.parts.reduce(
                            (sum, change) => sum.plus(partSaving(change).aircraft),
                            new Decimal(0),
                          ),
                        )}{' '}
                        元
                      </Small>
                    </div>
                  }
                >
                  <Flex direction="column" gap="md">
                    <Descriptions
                      columns={3}
                      size="sm"
                      items={[
                        { label: '构型通知单', value: detail.notices.join('、') },
                        { label: '工程责任人', value: personName(detail.engineer) },
                        { label: '是否双定点', value: detail.dualSource ? '是' : '否' },
                        {
                          label: '工程初步评估',
                          value: `${detail.evaluation.opinion}${detail.evaluation.type ? `（${detail.evaluation.type}）` : ''}`,
                        },
                        // 暂不具备实施条件、待评估时才有原因
                        ...(detail.evaluation.reason
                          ? [{ label: '具体原因', value: detail.evaluation.reason, span: 2 }]
                          : []),
                        { label: '项目描述', value: detail.projectDescription, span: 3 },
                        { label: '项目优化内容', value: detail.optimization, span: 3 },
                      ]}
                    />
                    <Table aria-label="零件更改与收益" density="compact">
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>序号</TableHeaderCell>
                          <TableHeaderCell>更改类型</TableHeaderCell>
                          <TableHeaderCell>更改前件号</TableHeaderCell>
                          <TableHeaderCell>更改后件号</TableHeaderCell>
                          <TableHeaderCell>材料变化</TableHeaderCell>
                          <TableHeaderCell align="end">单机数量</TableHeaderCell>
                          <TableHeaderCell align="end">单件零件收益（元）</TableHeaderCell>
                          <TableHeaderCell align="end">单机零件收益（元）</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.parts.map((change, index) => {
                          const saving = partSaving(change);
                          const side = change.after ?? change.before;
                          return (
                            <TableRow key={change.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{change.changeType}</TableCell>
                              <TableCell>
                                <span {...stylex.attrs(styles.mono)}>
                                  {change.before?.partNo ?? '—'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span {...stylex.attrs(styles.mono)}>
                                  {change.after?.partNo ?? '—'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {side?.materialChanged
                                  ? `${change.before?.materialGrade} → ${change.after?.materialGrade}`
                                  : '否'}
                              </TableCell>
                              <TableCell align="end">{side?.quantity}</TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>{yuan(saving.part)}</span>
                              </TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>
                                  {yuan(saving.aircraft)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Flex>
                </Card>
              )}

              {!unit && (
                <Card
                  variant="outline"
                  header={
                    <div {...stylex.attrs(styles.cardHead)}>
                      <H2 size="sm">实施节点</H2>
                      <Small tone="muted">
                        已完成 {current.dmcNodes.filter((node) => node.done).length} /{' '}
                        {current.dmcNodes.length}
                      </Small>
                    </div>
                  }
                >
                  <Table aria-label="实施节点" density="compact">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>序号</TableHeaderCell>
                        <TableHeaderCell>完成形式</TableHeaderCell>
                        <TableHeaderCell>计划完成</TableHeaderCell>
                        <TableHeaderCell>实际完成</TableHeaderCell>
                        <TableHeaderCell>情况</TableHeaderCell>
                        <TableHeaderCell align="end">贯彻架次</TableHeaderCell>
                        <TableHeaderCell>责任一级团队</TableHeaderCell>
                        <TableHeaderCell>需要 SB</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {current.dmcNodes.map((node, index) => {
                        const days = daysBetween(TODAY, node.due);
                        return (
                          <TableRow key={node.form}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{node.form}</TableCell>
                            <TableCell>{node.due}</TableCell>
                            <TableCell>{node.done ?? '—'}</TableCell>
                            <TableCell>
                              {node.done ? (
                                <Small tone="success">已完成</Small>
                              ) : days < 0 ? (
                                <Small tone="danger">超 {-days} 天</Small>
                              ) : (
                                <Small tone={days <= 7 ? 'warning' : 'muted'}>还剩 {days} 天</Small>
                              )}
                            </TableCell>
                            <TableCell align="end">{node.flights ?? '—'}</TableCell>
                            <TableCell>{node.team}</TableCell>
                            <TableCell>{node.needSb ? '是' : '否'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}

              <Card variant="outline" header={<H2 size="sm">变更记录</H2>}>
                <Timeline size="sm" items={history(current, money)} />
              </Card>
            </div>

            <aside {...stylex.attrs(styles.side)} aria-label="收益与关闭">
              <Card
                variant="outline"
                header={
                  <div {...stylex.attrs(styles.cardHead)}>
                    <H2 size="sm">收益（{amount.unit}）</H2>
                    <Small tone="muted">口径：{labelOf(amountBases, current.basis)}</Small>
                  </div>
                }
              >
                <Flex direction="column" gap="md">
                  <div {...stylex.attrs(styles.amounts)}>
                    {(
                      [
                        ['预期', current.expected, false],
                        ['测算 A', current.a, current.a != null],
                        ['商务 B', current.b, false],
                      ] as const
                    ).map(([label, value, locked]) => (
                      <div key={label} {...stylex.attrs(styles.amount)}>
                        <Flex align="center" gap="xs">
                          <Small tone="muted">{label}</Small>
                          {locked && <Icon icon={Lock} size="sm" aria-label="已锁定" />}
                        </Flex>
                        <span {...stylex.attrs(styles.amountValue)}>
                          {value == null
                            ? current.status === 'unpriced' && label === '测算 A'
                              ? '待定价'
                              : '—'
                            : format.number(value, amount.format)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Descriptions
                    size="sm"
                    columns={1}
                    items={[
                      {
                        label: '差额 D（B − A）',
                        value: gap ? `${money(gap)} · ${current.gapReason ?? '未归因'}` : '—',
                      },
                      {
                        label: '测算版本',
                        value: current.a
                          ? 'V2（认定时锁定），V1 为建议卡上的预期'
                          : 'V1（建议卡上的预期）',
                      },
                    ]}
                  />
                </Flex>
              </Card>

              <Card variant="outline" header={<H2 size="sm">里程碑与交付证据</H2>}>
                <ul {...stylex.attrs(styles.checklist)}>
                  {current.milestones.map((item) => (
                    <li key={item.label} {...stylex.attrs(styles.check)}>
                      <Icon
                        icon={item.done ? CircleCheck : CircleDashed}
                        sx={item.done ? styles.done : styles.todo}
                      />
                      <Text size="sm" sx={styles.grow}>
                        {item.label}
                      </Text>
                      {item.done ? (
                        <>
                          <Small tone="muted">{item.done}</Small>
                          {item.evidence && (
                            <Link
                              href="#"
                              title={item.evidence}
                              aria-label={`交付证据：${item.evidence}`}
                            >
                              <Icon icon={Paperclip} />
                            </Link>
                          )}
                        </>
                      ) : (
                        <Small tone="muted">未完成</Small>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card
                variant="outline"
                header={
                  <div {...stylex.attrs(styles.cardHead)}>
                    <H2 size="sm">关闭三材料</H2>
                    {missing ? (
                      <Badge tone="warning">缺 {missing} 项</Badge>
                    ) : (
                      <Badge tone="success">齐全</Badge>
                    )}
                  </div>
                }
              >
                <ul {...stylex.attrs(styles.checklist)}>
                  {(
                    [
                      ['验证窗结论', current.closing.verification],
                      ['收益认定意见', current.closing.benefit],
                      ['商务谈定记录', current.closing.business],
                    ] as const
                  ).map(([label, ok]) => (
                    <li key={label} {...stylex.attrs(styles.check)}>
                      <Icon
                        icon={ok ? CircleCheck : CircleDashed}
                        sx={ok ? styles.done : styles.todo}
                      />
                      <Text size="sm" tone={ok ? undefined : 'muted'}>
                        {label}
                      </Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </aside>
          </div>
        </div>
        <Toaster controller={toaster} />
      </CaseShell>
    );
  };
});

/**
 * 任务看板（DESIGN.md §6.5）：一种降本类型的任务卡按状态分列（八个正常状态，异常的放最后一列），卡片上写正在处理的环节、
 * 处理人或岗位、计划完成。拖到下一列 = 处理当前环节：右侧抽屉里打开任务池的流程面板（认领、处理、退回都在那里），
 * 状态由流程决定，处理完看板重新取数。不能拖的写明原因（只能到下一列、环节在别人手上、异常的去详情处理）。
 * 类型、关键字、团队、主办、只看与我有关都在地址里
 */
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  DeadlineTag,
  Drawer,
  Flex,
  KanbanBoard,
  queryCodecs,
  Select,
  Small,
  StatusBadge,
  StatusDot,
  Switch,
  Text,
  TextField,
  ToggleGroup,
  ToggleItem,
  usePersistentState,
  useQueryState,
  useRequest,
  type KanbanColumn,
  type StatusTone,
} from '@vue-tsx-pro/ui';
import { getTaskBoard, type TaskBoardCard } from '../../../api/tasks';
import { toaster } from '../../../app/feedback';
import { master, ownerOptions, personName, shortTeam, teamNames } from '../../../app/master';
import { currentUser } from '../../../app/session';
import { workflowVersion } from '../../../app/sync';
import { TODAY } from '../../../domain/clock';
import { nextStepOf } from '../../../domain/task/lifecycle';
import { isFinished, taskFlow } from '../../../domain/task/status';
import type { CostKind } from '../../../domain/task/types';
import { groupsOf } from '../../../domain/workflow/groups';
import { CodeLink } from '../../../shared/CodeLink';
import { costKindKeys, costKinds } from '../../../shared/kinds';
import { taskStatuses } from '../../../shared/statuses';
import { handlerText } from '../../../shared/work-item-labels';
import { TaskWorkflowPanel } from '../detail/TaskWorkflowPanel';

const styles = stylex.create({
  search: { width: '14rem' },
  select: { width: '12rem' },
});

/** 异常状态（暂停、终止、挂账待定）合成的一列 */
const ABNORMAL = 'abnormal';

const columns: KanbanColumn[] = [
  ...taskFlow.map((status) => ({
    key: status,
    label: taskStatuses.label(status),
    tone: status === 'awaiting' ? ('warning' as const) : undefined,
  })),
  { key: ABNORMAL, label: '异常', tone: 'danger' },
];

const columnOf = (card: TaskBoardCard) =>
  taskFlow.includes(card.task.status) ? card.task.status : ABNORMAL;

/** 任务看板 */
export default _component(() => {
  const me = currentUser();
  const myGroups = groupsOf(me, master().teams);
  let kind = _fromRef(useQueryState<CostKind>('kind', 'unit', queryCodecs.oneOf(costKindKeys)));
  let team = _fromRef(useQueryState('team', ''));
  let owner = _fromRef(useQueryState('owner', ''));
  let keyword = _fromRef(useQueryState('q', ''));
  let mineOnly = _fromRef(useQueryState('mine', false, queryCodecs.boolean));
  // 正在处理的卡：抽屉里打开它的流程面板
  let processing = _state<{ code: string; to: string } | null>(null);
  const drawerWidth = usePersistentState('cost-reduction:board-drawer-width', 560);

  const board = useRequest(
    ([current]: [CostKind, number], signal) => getTaskBoard(current, signal),
    { params: () => [kind, workflowVersion()] as [CostKind, number] },
  );

  /** 当前环节轮到我：我手上的，或在我所在的收件箱里等认领（我退回过的不算） */
  const myTurn = ({ item }: TaskBoardCard) =>
    item != null &&
    (item.assignee === me.id ||
      (item.assignee == null &&
        item.pool != null &&
        myGroups.includes(item.pool) &&
        !item.releasedBy.includes(me.id)));

  const cards = () => {
    const text = keyword.trim();
    return (board.data ?? []).filter(
      (card) =>
        (!team || card.task.team === team) &&
        (!owner || card.task.owner === owner) &&
        (!text || card.task.code.includes(text) || card.task.name.includes(text)) &&
        (!mineOnly || card.task.owner === me.id || myTurn(card)),
    );
  };

  /** 不能拖到 to 列的原因 */
  function moveProblem(card: TaskBoardCard, to: string): string | null {
    if (columnOf(card) === ABNORMAL) return '暂停、挂账、终止的项目去详情页处理';
    if (to === ABNORMAL) return '暂停、终止去详情页操作，要写原因';
    const next = nextStepOf(card.task)?.next;
    if (!next) return card.task.status === 'realized' ? '关闭三材料不全' : '已经走完';
    if (to !== next) return `只能拖到下一列“${taskStatuses.label(next)}”`;
    if (!card.item) return '没有待处理的环节';
    if (!myTurn(card)) return `当前环节“${card.item.name}”在 ${handlerText(card.item)} 手上`;
    return null;
  }

  /** 处理了一个环节：重新取；卡片到了要去的那一列就收起抽屉（一列里有几个环节时留着接着处理） */
  async function refreshAfterChange() {
    await board.refresh();
    const card = board.data?.find((entry) => entry.task.code === processing?.code);
    if (card && columnOf(card) === processing?.to) processing = null;
  }

  /** 卡片上环节的标记：轮到我的强调，在岗位里等认领的提醒，别人手上的普通 */
  const turnTone = (card: TaskBoardCard): StatusTone =>
    myTurn(card) ? 'accent' : card.item?.assignee == null ? 'warning' : 'neutral';

  const Card = (card: TaskBoardCard) => {
    const { task, item } = card;
    return (
      <Flex direction="column" gap="xs">
        <Flex align="center" justify="between" gap="xs">
          <CodeLink code={task.code} />
          {columnOf(card) === ABNORMAL && (
            <StatusBadge statuses={taskStatuses} value={task.status} />
          )}
        </Flex>
        <Text size="sm" weight="medium" lineClamp={2} title={task.name}>
          {task.name}
        </Text>
        {item && (
          <Flex align="center" gap="xs">
            <StatusDot tone={turnTone(card)} />
            <Small tone="muted">
              {item.name} · {handlerText(item)}
            </Small>
          </Flex>
        )}
        <Flex align="center" justify="between" gap="xs" wrap>
          <Small tone="muted">
            {personName(task.owner)} · {shortTeam(task.team)}
          </Small>
          {!isFinished(task) && <DeadlineTag due={task.due} today={TODAY} />}
        </Flex>
      </Flex>
    );
  };

  return () => {
    const current = processing && board.data?.find((card) => card.task.code === processing!.code);
    return (
      <Flex direction="column" gap="md">
        <Flex align="center" gap="md" wrap>
          <ToggleGroup value={_bind(kind)} aria-label="降本类型" required>
            {costKindKeys.map((value) => (
              <ToggleItem key={value} value={value}>
                {costKinds[value].label}
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
          <Select
            items={teamNames().map((name) => ({ value: name, label: shortTeam(name) }))}
            value={_bind(
              () => team || null,
              (next: string | null) => (team = next ?? ''),
            )}
            placeholder="全部团队"
            clearable
            aria-label="责任团队"
            sx={styles.select}
          />
          <Select
            items={ownerOptions()}
            value={_bind(
              () => owner || null,
              (next: string | null) => (owner = next ?? ''),
            )}
            placeholder="全部主办"
            clearable
            aria-label="主办"
            sx={styles.select}
          />
          <Switch checked={_bind(mineOnly)}>只看与我有关</Switch>
          <Small tone="muted">拖到下一列即处理当前环节；不能拖的会写明原因</Small>
        </Flex>
        <KanbanBoard
          aria-label={`${costKinds[kind].label}任务看板`}
          columns={columns}
          items={cards()}
          getKey={(card) => card.task.code}
          getColumn={columnOf}
          getLabel={(card) => `${card.task.code} ${card.task.name}`}
          canMove={moveProblem}
          onMove={(card, to) => (processing = { code: card.task.code, to })}
          onReject={(_, __, reason) =>
            toaster.show({ title: '不能移到这一列', description: reason })
          }
          columnHeight="calc(100dvh - 15rem)"
        >
          {Card}
        </KanbanBoard>
        <Drawer
          open={_bind(
            () => processing != null,
            (open: boolean) => {
              if (!open) processing = null;
            },
          )}
          title={current ? `${current.task.code} ${current.task.name}` : ''}
          description={
            processing
              ? `推进到“${taskStatuses.label(processing.to)}”：处理当前环节，状态随流程变化`
              : ''
          }
          width={_bind(drawerWidth.value)}
        >
          {current && (
            <TaskWorkflowPanel
              key={current.task.code}
              task={current.task}
              hideDiagram
              onChange={() => void refreshAfterChange()}
            />
          )}
        </Drawer>
      </Flex>
    );
  };
});

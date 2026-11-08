/**
 * 待办上的动作（docs/decisions/0003-operations.md）：每个动作是一个插件——叫什么、谁现在能做（available）、要填什么（fields）、
 * 做了什么（run）。待办详情给出这个人此刻能做的动作与字段，前端照着渲染按钮与对话框；加新动作不用改引擎与页面。
 * 引擎选项 `operations` 加自定义的，同名的覆盖内置的。命令是 `{ type: 'operate', workItem, operation, input }`。
 *
 * 处理（选一个结果）不是动作：结果来自节点的 outcomes，走 complete。
 */
import type { TaskNode } from '@zerodep-dev/flow-ts-model';
import { FlowEvent, FlowWorkItem, type FlowDb } from './entities.ts';
import { FlowError, type FlowErrorCode } from './errors.ts';
import type { Execution, InstanceRow, WorkItemRow } from './execution.ts';
import type { Actor } from './types.ts';

/** 动作要填的一项（前端按 type 渲染：选人、选多人、文字、多行文字、单选） */
export interface OperationField {
  readonly name: string;
  readonly label: string;
  readonly type: 'user' | 'users' | 'text' | 'textarea' | 'select';
  readonly required?: boolean;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
}

/** 判断能不能做时看的 */
export interface OperationScope {
  readonly item: WorkItemRow;
  readonly node: TaskNode;
  readonly instance: InstanceRow;
  readonly actor: Actor;
  /** 他是这份待办的处理人，或收件箱里的候选人 */
  readonly candidate: boolean;
  /** 实例上的全部待办（按编号），撤回这一步之类要看前后的动作用 */
  readonly items: readonly WorkItemRow[];
}

/** 做的时候拿到的：实例已锁住、待办重读过 */
export interface OperationContext extends OperationScope {
  readonly exec: Execution;
  readonly tx: FlowDb;
  /** 取消这份待办（带状态条件，别人先处理了报 already-handled） */
  cancel(comment: string | null): Promise<void>;
  /** 这份待办按这个结果处理完（同 complete：会签判断、往下走） */
  finish(outcome: string, comment: string | null): Promise<void>;
}

/** 一个动作 */
export interface WorkItemOperation<I extends Record<string, unknown> = Record<string, unknown>> {
  readonly name: string;
  readonly label: string;
  readonly tone?: 'accent' | 'neutral' | 'danger';
  /** 要填的；按待办算（比如加签的方式只在会签节点上有“并加签”） */
  readonly fields?: (scope: OperationScope) => readonly OperationField[];
  readonly available: (scope: OperationScope) => boolean;
  /** 不能做时报什么；不给（或给 undefined）时：实例不在进行中、待办办完了、其余没有权限 */
  readonly refusal?: (scope: OperationScope) => FlowErrorCode | undefined;
  readonly run: (context: OperationContext, input: I) => Promise<void>;
}

/** 待办详情里的一个动作 */
export interface OperationView {
  readonly name: string;
  readonly label: string;
  readonly tone: 'accent' | 'neutral' | 'danger';
  readonly fields: readonly OperationField[];
}

/** 节点的 allow 没关掉这个动作 */
const allowed = (node: TaskNode, name: keyof NonNullable<TaskNode['allow']>) =>
  node.allow?.[name] !== false;

const isOpen = ({ item, instance }: OperationScope) =>
  item.state === 'open' && instance.status === 'active';

/** 落到他（认领了或直接指定） */
const holds = ({ item, actor }: OperationScope) => item.assignee === actor.id;

const COMMENT: OperationField = { name: 'comment', label: '说明', type: 'textarea' };

/** 取输入里的文字：必填的空着报 invalid-input */
function text(input: Record<string, unknown>, name: string, required = true): string | null {
  const value = input[name];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (required)
    throw new FlowError('invalid-input', `要填 ${name}`, { field: name, code: 'required' });
  return null;
}

/** 取输入里的人：一个或多个编号 */
function users(input: Record<string, unknown>, name: string): string[] {
  const value = input[name];
  const list = (Array.isArray(value) ? value : value === undefined ? [] : [value]).map(String);
  const unique = [...new Set(list.filter(Boolean))];
  if (unique.length === 0)
    throw new FlowError('invalid-input', `要选人`, { field: name, code: 'required' });
  return unique;
}

/** 把这份待办交给别人：取消这份，给他建一份（同组、同序号），记一条事件 */
async function handOver(
  context: OperationContext,
  input: Record<string, unknown>,
  to: string,
  arrival: string,
  event: string,
) {
  const { exec, item, node, actor } = context;
  const comment = text(input, 'comment', false);
  await context.cancel(comment);
  // 先记交接、再记新待办（同 Java 版的顺序）
  exec.addEvent(event, {
    workItemId: item.id,
    node: node.id,
    actor: actor.id,
    comment,
    data: { to },
  });
  await exec.insertItem(node, item.round, arrival, {
    assignee: to,
    assignment: 'direct',
    state: 'open',
    signGroup: item.signGroup,
    signSeq: item.signSeq,
    parentItemId: item.parentItemId,
    fromUser: actor.id,
  });
}

/** 内置的动作 */
export const BUILTIN_OPERATIONS: readonly WorkItemOperation[] = [
  {
    name: 'claim',
    label: '认领',
    available: (scope) => isOpen(scope) && scope.candidate && scope.item.assignee === null,
    // 收件箱里的被认领了（别人或自己先认领的）：已有人处理
    refusal: (scope) =>
      isOpen(scope) && scope.item.assignee !== null ? 'already-handled' : undefined,
    run: async ({ exec, tx, item, actor }) => {
      await tx
        .update(FlowWorkItem)
        .set({ assignee: actor.id, assignment: 'claimed' })
        .where((w) => [w.id.eq(item.id), w.state.eq('open'), w.assignee.isNull()])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 被别人认领了`))
        .execute();
      exec.addEvent('workItem.claimed', { workItemId: item.id, node: item.node });
    },
  },
  {
    name: 'release',
    label: '放回收件箱',
    tone: 'neutral',
    fields: () => [{ ...COMMENT, label: '原因' }],
    available: (scope) =>
      isOpen(scope) &&
      holds(scope) &&
      scope.item.assignment === 'claimed' &&
      scope.item.candidates.length > 0,
    // 放回表示“不是我的”：他从这份待办的候选里排除（排除标记 -user:编号，查待办与判断候选时看它）
    run: async ({ exec, tx, item, actor }, input) => {
      await tx
        .update(FlowWorkItem)
        .set({
          assignee: null,
          assignment: 'pool',
          candidates: [...item.candidates, excludeToken(actor.id)],
        })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .execute();
      exec.addEvent('workItem.released', {
        workItemId: item.id,
        node: item.node,
        comment: text(input, 'comment', false),
      });
    },
  },
  {
    name: 'transfer',
    label: '转办',
    tone: 'neutral',
    fields: () => [{ name: 'to', label: '转给', type: 'user', required: true }, COMMENT],
    // 处理人、收件箱里的候选人（不用先认领）、管理员
    available: (scope) =>
      isOpen(scope) && (scope.candidate || !!scope.actor.admin) && allowed(scope.node, 'transfer'),
    run: (context, input) =>
      handOver(context, input, users(input, 'to')[0]!, 'transfer', 'workItem.transferred'),
  },
  {
    name: 'reassign',
    label: '改派',
    tone: 'neutral',
    fields: () => [{ name: 'to', label: '改派给', type: 'user', required: true }, COMMENT],
    available: (scope) => isOpen(scope) && !!scope.actor.admin,
    // 原地换人（同 Java 版）：不新建待办，收件箱里的也直接落到他
    run: async ({ exec, tx, item, actor }, input) => {
      const to = users(input, 'to')[0]!;
      await tx
        .update(FlowWorkItem)
        .set({ assignee: to, assignment: 'direct', fromUser: item.assignee ?? actor.id })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
        .execute();
      exec.addEvent('workItem.reassigned', {
        workItemId: item.id,
        node: item.node,
        actor: actor.id,
        comment: text(input, 'comment', false),
        data: { to },
      });
    },
  },
  {
    name: 'delegate',
    label: '委托',
    tone: 'neutral',
    fields: () => [{ name: 'to', label: '委托给', type: 'user', required: true }, COMMENT],
    available: (scope) =>
      isOpen(scope) &&
      holds(scope) &&
      scope.item.parentItemId === null &&
      allowed(scope.node, 'delegate'),
    // 只加一个人的前加签：自己这份先等，受托人办完（他选的结果记作意见）回到自己
    run: async (context, input) => {
      const to = users(input, 'to')[0]!;
      await holdFor(context, [to], 'delegate');
      context.exec.addEvent('workItem.delegated', {
        workItemId: context.item.id,
        node: context.node.id,
        actor: context.actor.id,
        comment: text(input, 'comment', false),
        data: { to },
      });
    },
  },
  {
    name: 'addSign',
    label: '加签',
    tone: 'neutral',
    fields: ({ node }) => [
      { name: 'users', label: '加签给', type: 'users', required: true },
      {
        name: 'mode',
        label: '方式',
        type: 'select',
        required: true,
        options: [
          { value: 'before', label: '前加签：他们先办，办完回到我' },
          { value: 'after', label: '后加签：我办完后他们再办' },
          ...(node.multi ? [{ value: 'parallel', label: '并加签：和会签的人一起办' }] : []),
        ],
      },
      COMMENT,
    ],
    available: (scope) =>
      isOpen(scope) &&
      holds(scope) &&
      scope.item.parentItemId === null &&
      allowed(scope.node, 'addSign'),
    run: async (context, input) => {
      const { exec, item, node, actor } = context;
      const mode = text(input, 'mode');
      const signers = users(input, 'users').filter((user) => user !== actor.id);
      const comment = text(input, 'comment', false);
      if (mode === 'parallel') {
        if (!node.multi || !item.signGroup)
          throw new FlowError('invalid-input', '并加签只在会签节点上', { field: 'mode' });
        for (const user of signers) {
          await exec.insertItem(node, item.round, 'addSign.parallel', {
            assignee: user,
            assignment: 'direct',
            state: 'open',
            signGroup: item.signGroup,
          });
        }
      } else if (mode === 'before') {
        await holdFor(context, signers, 'addSign.before');
      } else if (mode === 'after') {
        // 后加签：先给他们建好排队的待办，我选了结果时才打开（引擎的 finishItem）
        for (const user of signers)
          await signerItem(exec, node, item, user, 'addSign.after', 'waiting');
      } else {
        throw new FlowError('invalid-input', `没有这种加签方式 ${mode}`, { field: 'mode' });
      }
      exec.addEvent('workItem.signAdded', {
        workItemId: item.id,
        node: node.id,
        actor: actor.id,
        comment,
        data: { users: signers, mode },
      });
    },
  },
  {
    name: 'withdrawStep',
    label: '撤回',
    tone: 'danger',
    fields: () => [{ ...COMMENT, label: '撤回原因' }],
    available: (scope) => withdrawable(scope),
    refusal: () => 'forbidden',
    // 之后开出的待办取消，这一份重新打开（同一个编号），这一步改过的单据值恢复
    run: async ({ exec, tx, item, node, actor }, input) => {
      const later = await tx
        .queryable(FlowWorkItem)
        .where((w) => [w.instanceId.eq(item.instanceId), w.id.gt(item.id), w.state.eq('open')])
        .toList();
      await exec.cancelWhere((w) => [w.id.gt(item.id)]);
      for (const next of later) exec.current.delete(next.node);
      await tx
        .update(FlowWorkItem)
        .set({ state: 'open', outcome: null, comment: null, completedAt: null, completedBy: null })
        .where((w) => [w.id.eq(item.id), w.state.eq('done')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 不能再撤回`))
        .execute();
      const completed = await tx
        .queryable(FlowEvent)
        .where((e) => [e.workItemId.eq(item.id), e.type.eq('workItem.completed')])
        .orderBy((e) => e.id.desc())
        .first();
      const before = (completed?.data?.['before'] ?? {}) as Record<string, unknown>;
      if (Object.keys(before).length > 0) exec.setVariables(before);
      exec.current.add(node.id);
      exec.addEvent('workItem.withdrawn', {
        workItemId: item.id,
        node: node.id,
        actor: actor.id,
        outcome: item.outcome,
        comment: text(input, 'comment', false),
      });
    },
  },
];

/**
 * 撤回这一步：他办完的这一份（不是会签、加签里的），之后开出的待办都还开着、没人认领、没人动过，节点没关掉撤回
 */
function withdrawable({ item, node, instance, actor, items }: OperationScope): boolean {
  if (instance.status !== 'active' || item.state !== 'done' || item.completedBy !== actor.id)
    return false;
  if (item.parentItemId !== null || item.signGroup !== null || !allowed(node, 'withdraw'))
    return false;
  const later = items.filter((w) => w.id > item.id);
  return (
    later.length > 0 &&
    later.every((w) => w.state === 'open' && w.assignment !== 'claimed' && w.arrival === 'forward')
  );
}

/** 给加签（委托）的人建一份待办，挂在原来那份下面 */
function signerItem(
  exec: Execution,
  node: TaskNode,
  parent: WorkItemRow,
  user: string,
  arrival: 'delegate' | 'addSign.before' | 'addSign.after',
  state: 'open' | 'waiting',
) {
  return exec.insertItem(node, parent.round, arrival, {
    assignee: user,
    assignment: 'direct',
    state,
    parentItemId: parent.id,
  });
}

/** 前加签、委托：自己这份先等，给他们各开一份；都办完时引擎让这份恢复（workItem.resumed） */
async function holdFor(
  { exec, tx, item, node }: OperationContext,
  people: readonly string[],
  arrival: 'delegate' | 'addSign.before',
) {
  await tx
    .update(FlowWorkItem)
    .set({ state: 'waiting' })
    .where((w) => [w.id.eq(item.id), w.state.eq('open')])
    .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
    .execute();
  for (const user of people) await signerItem(exec, node, item, user, arrival, 'open');
}

/** 放回收件箱的人的排除标记 */
export const excludeToken = (user: string) => `-user:${user}`;

/** 内置的加上选项里的（同名的以选项里的为准） */
export function operationsOf(custom: readonly WorkItemOperation[] = []): WorkItemOperation[] {
  const byName = new Map(BUILTIN_OPERATIONS.map((operation) => [operation.name, operation]));
  for (const operation of custom) byName.set(operation.name, operation);
  return [...byName.values()];
}

/** 这个人此刻能做的动作 */
export function availableOperations(
  operations: readonly WorkItemOperation[],
  scope: OperationScope,
): OperationView[] {
  return operations
    .filter((operation) => operation.available(scope))
    .map((operation) => ({
      name: operation.name,
      label: operation.label,
      tone: operation.tone ?? 'accent',
      fields: operation.fields?.(scope) ?? [],
    }));
}

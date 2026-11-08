/**
 * 通知（docs/decisions/0010）：推进写完流转记录时，按这一步的事件生成通知，与推进同一个事务写入。
 *
 * | 事件 | 来自 | 发给 |
 * | arrived / returned | 新建的待办（退回来的是 returned） | 处理人；收件箱里的发给能认领的人 |
 * | reminded | 手动催办、收件箱很久没人认领 | 同上 |
 * | dueSoon | 到期前的提醒 | 同上 |
 * | overdue | 待办超时 | 同上 |
 * | cc | 抄送 | 抄送的人 |
 * | finished | 实例结束（完成、终止、撤回） | 发起人 |
 *
 * 流程级、节点级的 notify 设置：`false` 不发；`to` 加收件人；`template` 换文字（花括号里是字段名，同标题模板）。
 * 不发给引起这件事的人自己（自己催自己、自己撤回）。
 */
import type { NotifyEvent, NotifySettings } from '@zerodep-dev/flow-ts-model';
import { FlowWorkItem } from '../core/entities.ts';
import type { FlowEventView } from '../types.ts';
import { expandToUsers, parseCandidate } from '../runtime/assignees.ts';
import { renderTitle, type Execution, type WorkItemRow } from '../runtime/execution.ts';

/** 要写进 flow_notification 的一行 */
export interface NotificationInsert {
  readonly recipient: string;
  readonly event: NotifyEvent;
  readonly instanceId: number;
  readonly workItemId: number | null;
  readonly node: string | null;
  readonly nodeName: string | null;
  readonly processKey: string;
  readonly title: string | null;
  readonly message: string | null;
  readonly sender: string | null;
  readonly createdAt: Date;
  readonly readAt: null;
  readonly sentAt: null;
  readonly attempts: 0;
  readonly lastError: null;
}

const FINISHED = new Set(['completed', 'terminated', 'withdrawn']);

/** 待办的收件人：处理人；收件箱里的是能认领的人（候选展开成人，去掉排除的） */
async function itemRecipients(exec: Execution, item: WorkItemRow): Promise<string[]> {
  if (item.assignee) return [item.assignee];
  const excluded = new Set(
    item.candidates.filter((t) => t.startsWith('-')).map((t) => parseCandidate(t.slice(1)).value),
  );
  const candidates = item.candidates.filter((t) => !t.startsWith('-')).map(parseCandidate);
  // 没配 org 时角色、部门展不开：只发给直接点名的人
  const users = exec.options.org
    ? await expandToUsers(candidates, exec.options)
    : candidates.filter((c) => c.kind === 'user').map((c) => c.value);
  return users.filter((user) => !excluded.has(user));
}

/** 这一步的事件 → 通知 */
export async function collectNotifications(
  exec: Execution,
  events: readonly FlowEventView[],
  title: string | null,
): Promise<NotificationInsert[]> {
  const rows: NotificationInsert[] = [];
  const seen = new Set<string>();
  const processSettings: NotifySettings = exec.definition.settings?.notify ?? {};

  const add = async (
    event: NotifyEvent,
    recipients: readonly string[],
    fields: { node: string | null; workItemId: number | null; sender: string | null },
  ) => {
    const node = fields.node ? exec.graph.node(fields.node) : undefined;
    const setting = node?.notify?.[event] ?? processSettings[event];
    if (setting === false) return;
    const extra = setting?.to ? await exec.resolveUsers(setting.to) : [];
    const message = setting?.template ? renderTitle(setting.template, exec.read) : null;
    for (const recipient of [...recipients, ...extra]) {
      const key = `${recipient}|${event}|${fields.workItemId ?? ''}`;
      if (recipient === fields.sender || seen.has(key)) continue;
      seen.add(key);
      rows.push({
        recipient,
        event,
        instanceId: exec.instance.id,
        workItemId: fields.workItemId,
        node: fields.node,
        nodeName: node?.name ?? null,
        processKey: exec.instance.processKey,
        title,
        message,
        sender: fields.sender,
        createdAt: exec.now,
        readAt: null,
        sentAt: null,
        attempts: 0,
        lastError: null,
      });
    }
  };

  // 催办、提醒、超时的待办不在这一步新建的里：一次查出来
  const mentioned = events
    .filter(
      (e) => (e.type === 'workItem.reminded' || e.type === 'workItem.overdue') && e.workItemId,
    )
    .map((e) => e.workItemId!);
  const existing = mentioned.length
    ? await exec.tx
        .queryable(FlowWorkItem)
        .where((w) => w.id.in(mentioned))
        .toList()
    : [];
  const itemOf = (id: number | null) =>
    exec.created.find((w) => w.id === id) ?? existing.find((w) => w.id === id);

  for (const event of events) {
    const fields = { node: event.node, workItemId: event.workItemId, sender: event.actor };
    const item = itemOf(event.workItemId);
    switch (event.type) {
      case 'workItem.created':
        if (item)
          await add(
            item.arrival === 'return' ? 'returned' : 'arrived',
            await itemRecipients(exec, item),
            fields,
          );
        break;
      case 'workItem.reminded': {
        if (!item || item.state !== 'open') break;
        const data = event.data ?? {};
        // 到期前的提醒是 dueSoon；手动催办、没人认领的提醒是 reminded
        const kind: NotifyEvent =
          data['auto'] && data['reason'] !== 'unclaimed' ? 'dueSoon' : 'reminded';
        await add(kind, await itemRecipients(exec, item), fields);
        break;
      }
      case 'workItem.overdue':
        if (item && item.state === 'open')
          await add('overdue', await itemRecipients(exec, item), fields);
        break;
      case 'instance.cc': {
        const to = (event.data?.['to'] ?? []) as readonly string[];
        await add('cc', to, fields);
        break;
      }
    }
  }

  if (FINISHED.has(exec.status) && !FINISHED.has(exec.instance.status))
    await add('finished', [exec.instance.startedBy], {
      node: null,
      workItemId: null,
      sender: exec.actor?.id ?? null,
    });
  return rows;
}

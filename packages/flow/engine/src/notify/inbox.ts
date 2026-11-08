/**
 * 通知的信箱与发件箱（docs/decisions/0010）：我的通知、未读数、标为已读；外部投递——
 * 引擎选项给了 notifications.deliver 时，提交后把还没送到的逐条交给它，抛错的记下原因、留着，到点作业再试（最多 MAX_ATTEMPTS 次）。
 */
import type { Row } from '@zerodep-dev/easy-query-ts';
import { FlowNotification } from '../core/entities.ts';
import type { EngineCore } from '../core/context.ts';
import type { Actor } from '../types.ts';
import type { NotificationView } from '../views.ts';

/** 外部投递最多试几次（之后留在表里，管理员看 lastError） */
export const MAX_ATTEMPTS = 5;

/** 表里的一行 → 给页面与投递的样子 */
export const notificationView = (row: Row<typeof FlowNotification>): NotificationView => ({
  id: row.id,
  recipient: row.recipient,
  event: row.event as NotificationView['event'],
  instanceId: row.instanceId,
  workItemId: row.workItemId,
  node: row.node,
  nodeName: row.nodeName,
  processKey: row.processKey,
  title: row.title,
  message: row.message,
  sender: row.sender,
  createdAt: row.createdAt,
  readAt: row.readAt,
});

/** 通知：装进引擎核心（core.notifications） */
export function createNotifications(core: EngineCore) {
  const { db, options, now } = core;

  /** 我的通知，新的在前；unreadOnly 只要没读的 */
  const list = async (actor: Actor, filter: { unreadOnly?: boolean; limit?: number } = {}) =>
    (
      await db
        .queryable(FlowNotification)
        .where((n) => [n.recipient.eq(actor.id), ...(filter.unreadOnly ? [n.readAt.isNull()] : [])])
        .orderBy((n) => n.id.desc())
        .limit(Math.min(200, Math.max(1, filter.limit ?? 50)))
        .toList()
    ).map(notificationView);

  /** 我没读的有几条 */
  const unread = (actor: Actor) =>
    db
      .queryable(FlowNotification)
      .where((n) => [n.recipient.eq(actor.id), n.readAt.isNull()])
      .count();

  /** 标为已读：给了编号只标这些（只能标自己的），不给时全部；返回标了几条 */
  const read = (actor: Actor, ids?: readonly number[]) =>
    db
      .update(FlowNotification)
      .set({ readAt: now() })
      .where((n) => [
        n.recipient.eq(actor.id),
        n.readAt.isNull(),
        ...(ids ? [n.id.in([...ids])] : []),
      ])
      .execute();

  /** 外部投递还没送到的（提交后、到点作业里都调它）；没配 deliver 时什么也不做。返回送到了几条 */
  async function deliverPending(): Promise<number> {
    const deliver = options.notifications?.deliver;
    if (!deliver) return 0;
    const pending = await db
      .queryable(FlowNotification)
      .where((n) => [n.sentAt.isNull(), n.attempts.lt(MAX_ATTEMPTS)])
      .orderBy((n) => n.id)
      .limit(100)
      .toList();
    let sent = 0;
    for (const row of pending) {
      // 先占用：带条件地把次数加一，别的进程（多实例部署）已经占了就跳过，不重复投递
      const claimed = await db
        .update(FlowNotification)
        .set({ attempts: row.attempts + 1 })
        .where((n) => [n.id.eq(row.id), n.sentAt.isNull(), n.attempts.eq(row.attempts)])
        .execute();
      if (claimed === 0) continue;
      try {
        await deliver(notificationView(row));
        await db
          .update(FlowNotification)
          .set({ sentAt: now(), lastError: null })
          .where((n) => n.id.eq(row.id))
          .execute();
        sent++;
      } catch (error) {
        await db
          .update(FlowNotification)
          .set({ lastError: error instanceof Error ? error.message : String(error) })
          .where((n) => n.id.eq(row.id))
          .execute();
      }
    }
    return sent;
  }

  return { list, unread, read, deliverPending };
}

/** createNotifications 给出的函数 */
export type Notifications = ReturnType<typeof createNotifications>;

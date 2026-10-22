/** 假接口：主数据、当前用户、我的任务与通知、演示数据重置 */
import { http, HttpResponse } from 'msw';
import { TODAY } from '../../domain/clock';
import { tasksOwnedBy } from '../../domain/task/query';
import { groupName } from '../../domain/workflow/groups';
import { notificationsFor } from '../../domain/workflow/notifications';
import type { MockDatabase } from '../db';
import { actorOf, bodyOf, fail, latency, route } from '../respond';

/** 主数据与会话的路由 */
export const sessionHandlers = (db: MockDatabase) => [
  http.get(route('master'), async () => {
    await latency();
    return HttpResponse.json(db.master);
  }),
  http.get(route('me'), ({ request }) => {
    const user = db.master.people.find((person) => person.id === actorOf(request));
    return user ? HttpResponse.json(user) : fail(401, '身份无效，请重新选择');
  }),
  http.get(route('myTasks'), async ({ request }) => {
    await latency();
    return HttpResponse.json(tasksOwnedBy(db.tables.tasks, actorOf(request)));
  }),
  http.get(route('myNotifications'), async ({ request }) => {
    await latency();
    // 先处理到期：超时、没人认领转指定也是通知
    db.run((engine) => engine.tick());
    const user = actorOf(request);
    return HttpResponse.json(
      notificationsFor(db.tables.workflow, db.viewer(user), {
        today: TODAY,
        read: new Set(db.tables.notificationReads[user] ?? []),
        poolName: (pool) => groupName(pool, db.master.teams),
      }),
    );
  }),
  http.post(route('myNotificationsRead'), async ({ request }) => {
    const { ids } = await bodyOf<{ ids: string[] }>(request);
    db.markRead(actorOf(request), ids ?? []);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(route('demoReset'), () => {
    db.reset();
    return new HttpResponse(null, { status: 204 });
  }),
];

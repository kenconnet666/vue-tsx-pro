/** 假接口：主数据、当前用户、我的任务与收件箱、演示数据重置 */
import { http, HttpResponse } from 'msw';
import type { InboxMessage } from '../../api/session';
import { tasksOwnedBy } from '../../domain/task/query';
import type { MockDatabase } from '../db';
import { actorOf, fail, latency, route } from '../respond';

/** 收件箱：流转到当前用户岗位、等着认领或处理的事（流程上线前是固定的几条） */
const inbox: InboxMessage[] = [
  {
    id: 'm1',
    tone: 'accent',
    title: '建议 JY-2026-0187“整流罩支架材料替代”派到产品团队',
    meta: '技术评估 · 剩 15 个工作日 · 待认领',
    time: '10 分钟前',
  },
  {
    id: 'm2',
    tone: 'warning',
    title: '方案 FA-2026-0142“舱门密封件第二货源”待编制',
    meta: 'PEMO 派单 · 剩 3 个工作日',
    time: '2 小时前',
  },
  {
    id: 'm3',
    tone: 'danger',
    title: '王晴退回了任务 DJ-2026-FC-14 的验证材料',
    meta: '验证窗结论缺少试验报告，请补充后重新提交',
    time: '昨天',
  },
];

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
  http.get(route('myInbox'), () => HttpResponse.json(inbox)),
  http.post(route('demoReset'), () => {
    db.reset();
    return new HttpResponse(null, { status: 204 });
  }),
];

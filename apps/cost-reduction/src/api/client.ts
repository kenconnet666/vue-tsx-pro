/**
 * 接口的地址与请求客户端。路径（相对 /api）前端调用与假后端的路由共用一份，后端照这里实现。
 *
 * 当前用户：演示期间请求头 X-User-Id 写当前身份的工号（顶栏可以切换身份）；接统一身份认证后换成令牌，
 * 由后端从令牌取用户，这个请求头去掉
 */
import { createHttpClient } from '@vue-tsx-pro/ui';

/** 接口的前缀 */
export const API_BASE = '/api';

/** 接口的路径：`:name` 是路径参数 */
export const apiPaths = {
  /** 主数据与字典 */
  master: '/master',
  /** 当前用户 */
  me: '/me',
  /** 当前用户主办的任务 */
  myTasks: '/me/tasks',
  /** 当前用户的通知（近 14 天，新的在前） */
  myNotifications: '/me/notifications',
  /** 标为已读（POST { ids }） */
  myNotificationsRead: '/me/notifications/read',
  /** 台账：分页查询（GET）、新建（POST） */
  tasks: '/tasks',
  /** 按编号取一批任务（跨页勾选后导出） */
  taskSelection: '/tasks/selection',
  /** 一张任务卡：读（GET）、保存（PUT，不存在时新建）、删除（DELETE） */
  task: '/tasks/:code',
  /** 推进到下一状态 */
  taskAdvance: '/tasks/:code/advance',
  /** 暂停 */
  taskPause: '/tasks/:code/pause',
  /** 终止 */
  taskTerminate: '/tasks/:code/terminate',
  /** 收益认定的三个页签 */
  confirmList: '/benefit/confirm',
  /** 认定并锁定 A */
  confirmApprove: '/benefit/confirm/:code/approve',
  /** 退回验证 */
  confirmReturn: '/benefit/confirm/:code/return',
  /** 一本账 */
  valueLedger: '/value-ledger',
  /** 统计看板 */
  dashboard: '/dashboard',
  /** 流程定义（各流程的最新版本） */
  workflowDefinitions: '/workflow/definitions',
  /** 一张卡的流程轨迹：流程实例、流转记录、待办（?businessKey=&key=） */
  workflowTrace: '/workflow/trace',
  /** 待办：我的待办、岗位待认领、待指定、我已处理、我发起的（?view=） */
  workItems: '/workflow/items',
  /** 待办的操作：claim、release、designate、reassign、complete、remind */
  workItemAction: '/workflow/items/:id/:action',
  /** 流程实例的操作：comment、suspend、resume、terminate */
  instanceAction: '/workflow/instances/:id/:action',
  /** 演示：把数据恢复成初始状态 */
  demoReset: '/demo/reset',
} as const;

/** 路径填上参数：fillPath(apiPaths.task, { code }) → '/tasks/DJ-2026-FC-1' */
export const fillPath = (pattern: string, params: Readonly<Record<string, string>>) =>
  pattern.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(params[name] ?? ''));

/** 当前用户的工号从哪里读：会话模块在启动时设置 */
let readUser: () => string | null = () => null;

/** 设置当前用户的来源（请求头 X-User-Id 写它） */
export function setRequestUser(read: () => string | null): void {
  readUser = read;
}

/** 请求客户端：页面经 api/ 下的函数调用，不直接拼地址 */
export const http = createHttpClient({
  baseURL: API_BASE,
  onRequest(request) {
    const user = readUser();
    if (user) request.headers.set('x-user-id', user);
  },
});

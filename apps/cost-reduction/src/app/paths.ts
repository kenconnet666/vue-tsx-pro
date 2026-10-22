/**
 * 各页的地址：链接、跳转都用这里的函数，不在页面里拼字符串。query 是带过去的筛选条件
 * （统计看板点数字，跳到筛好条件的台账）。地址不含部署的 base，路由适配会补上
 */
import type { CostKind } from '../domain/task/types';

const withQuery = (path: string, query: Readonly<Record<string, string>> = {}) => {
  const search = new URLSearchParams(query).toString();
  return search ? `${path}?${search}` : path;
};

/** 查询参数 */
type Query = Readonly<Record<string, string>>;

/** 各页的地址 */
export const paths = {
  /** 工作台（首页） */
  workbench: () => '/',
  /** 收件箱：view 页签、item 选中的待办，以及筛选条件 */
  inbox: (query?: Query) => withQuery('/inbox', query),
  /** 统计看板（首页） */
  dashboard: (query?: Query) => withQuery('/dashboard', query),
  /** 单机降本台账、降 DMC 台账 */
  ledger: (kind: CostKind, query?: Query) => withQuery(`/tasks/${kind}`, query),
  /** 新建项目：台账上打开新建的抽屉 */
  newTask: (kind: CostKind) => withQuery(`/tasks/${kind}`, { editor: `new:${kind}` }),
  /** 项目详情（任务卡） */
  task: (code: string) => `/tasks/${encodeURIComponent(code)}`,
  /** 编辑项目：详情页上打开编辑的抽屉 */
  editTask: (code: string) => withQuery(`/tasks/${encodeURIComponent(code)}`, { editor: code }),
  /** 收益认定 */
  confirm: (query?: Query) => withQuery('/benefit/confirm', query),
  /** 一本账 */
  valueLedger: (query?: Query) => withQuery('/benefit/ledger', query),
  /** 设计规格 */
  spec: () => '/spec',
};

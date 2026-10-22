/**
 * 台账的查询：查询条件、页签（状态分组与关注）、排序与分页。后端（现在是假接口）按它筛选，
 * 两种台账共用一份条件（各页的查询栏只放自己的那几项）
 */
import { sortByValue, type SortValue } from '@vue-tsx-pro/ui';
import { daysToDue, isFinished, nextDmcNode, statusGroups, taskFocuses } from './status';
import type { CostKind, CostTask } from './types';

/** 台账的查询条件；没选的是 null（选择、日期控件清空后的值） */
export interface LedgerQuery {
  /** 关键字：编码、名称、件号 */
  keyword: string;
  /** 任务类别 */
  category: string | null;
  /** 责任一级团队 */
  team: string | null;
  /** 完成年度 */
  year: string | null;
  /** 联络人工号 */
  contact: string | null;
  /** 提出单位 */
  org: string | null;
  /** 完成形式 */
  form: string | null;
  /** 必装 / 选装 */
  install: string | null;
  /** 涉及供应商 */
  supplier: string | null;
  /** 经费来源 */
  funding: string | null;
  /** 收益状态 */
  valueState: string | null;
  /** 需要 SB：'yes' / 'no' */
  needSb: string | null;
  /** 金额口径 */
  basis: string | null;
}

/** 空的查询条件 */
export const blankLedgerQuery = (): LedgerQuery => ({
  keyword: '',
  category: null,
  team: null,
  year: null,
  contact: null,
  org: null,
  form: null,
  install: null,
  supplier: null,
  funding: null,
  valueState: null,
  needSb: null,
  basis: null,
});

/** 台账的页签：全部与各状态分组（第一组），关注（第二组，跨状态） */
export const ledgerViews = [
  { value: 'all', label: '全部' },
  ...statusGroups.map(({ value, label }) => ({ value, label })),
] as const;

/** 项目里出现的件号（更改前、更改后）：关键字也查件号 */
const partNos = (task: CostTask) =>
  task.unitDetail?.parts.flatMap((change) => [change.before?.partNo, change.after?.partNo]) ?? [];

/** 任务是否符合查询条件 */
export const matchesLedgerQuery = (task: CostTask, query: LedgerQuery) =>
  (!query.keyword ||
    task.name.includes(query.keyword) ||
    task.code.includes(query.keyword) ||
    partNos(task).some((no) => no?.includes(query.keyword))) &&
  (!query.category || task.category === query.category) &&
  (!query.team || task.team === query.team) &&
  (!query.year || task.year === query.year) &&
  (!query.contact || task.contact === query.contact) &&
  (!query.org || task.org === query.org) &&
  (!query.form || task.form === query.form) &&
  (!query.install || task.install === query.install) &&
  (!query.supplier || task.supplier === query.supplier) &&
  (!query.funding || task.funding.includes(query.funding)) &&
  (!query.valueState || task.valueState === query.valueState) &&
  (!query.needSb || task.needSb === (query.needSb === 'yes')) &&
  (!query.basis || task.basis === query.basis);

/** 页签筛出的任务：'all'、状态分组按状态，关注按各自的条件；不认识的页签当作全部 */
export function tasksInView(tasks: readonly CostTask[], view: string): readonly CostTask[] {
  const focus = taskFocuses.find((item) => item.value === view);
  if (focus) return tasks.filter(focus.test);
  const group = statusGroups.find((item) => item.value === view);
  return group
    ? tasks.filter((task) => (group.statuses as readonly string[]).includes(task.status))
    : tasks;
}

/** 可以排序的字段 → 取值；超时按紧迫程度（超时越久越前，没到期的离到期越近越前，已结束的在最后） */
const sortValues: Readonly<Record<string, (task: CostTask) => SortValue>> = {
  code: (task) => task.code,
  name: (task) => task.name,
  target: (task) => task.expected,
  a: (task) => task.a,
  b: (task) => task.b,
  due: (task) => task.due,
  overdue: (task) => (isFinished(task) ? Number.NEGATIVE_INFINITY : -daysToDue(task)),
  // 按下一节点的计划日期：越早越前，全部完成的在最后
  nodes: (task) => nextDmcNode(task)?.due ?? '9999',
};

/** 台账的一次查询：降本类型、页签、条件、排序、分页 */
export interface LedgerRequest {
  /** 降本类型 */
  kind: CostKind;
  /** 页签 */
  view: string;
  /** 查询条件 */
  filters: LedgerQuery;
  /** 排序；不排时为 null */
  sort: { key: string; direction: 'ascending' | 'descending' } | null;
  /** 页码，从 1 起 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/** 台账的一页 */
export interface LedgerPage {
  /** 这一页的任务 */
  rows: CostTask[];
  /** 当前页签、条件下的总数 */
  total: number;
  /** 各页签（状态分组与关注）在当前条件下的条数 */
  counts: Record<string, number>;
}

/** 按台账的请求筛选、排序、分页（后端的实现；排序按中文的规则） */
export function queryLedger(tasks: readonly CostTask[], request: LedgerRequest): LedgerPage {
  const filtered = tasks.filter(
    (task) => task.kind === request.kind && matchesLedgerQuery(task, request.filters),
  );
  const rows = tasksInView(filtered, request.view);
  const value = request.sort && sortValues[request.sort.key];
  const sorted = value ? sortByValue(rows, value, request.sort!.direction, 'zh-CN') : rows;
  const start = (request.page - 1) * request.pageSize;
  return {
    rows: sorted.slice(start, start + request.pageSize),
    total: rows.length,
    counts: Object.fromEntries(
      [...ledgerViews, ...taskFocuses].map((item) => [
        item.value,
        tasksInView(filtered, item.value).length,
      ]),
    ),
  };
}

/** 主办责任人还没结束的任务，按计划完成时间排（顶栏“我负责的任务”） */
export const tasksOwnedBy = (tasks: readonly CostTask[], owner: string) =>
  tasks
    .filter((task) => task.owner === owner && !isFinished(task))
    .toSorted((a, b) => a.due.localeCompare(b.due));

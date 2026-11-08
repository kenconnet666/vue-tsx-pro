/**
 * 实例的运行状态（存在 flow_instance.state 的 JSON 列，随实例行一起锁、一起写回）：推进时要记住、表里又不好放的东西
 */
export interface RunState {
  /** 汇合网关还要等几条分支：分叉时记下选出的边数，到一条减一 */
  waiting: Record<string, number>;
  /** 每个节点到了第几轮 */
  rounds: Record<string, number>;
  /** 每个人工节点最后的处理人（`sameAs`、自动跳过用） */
  handledBy: Record<string, string>;
  /** 被退回的节点 → 退回它的节点（`returnTo: 'resubmit'` 时直接回去） */
  returnedFrom: Record<string, string>;
  /** 依次会签还没轮到的人：会签组 → 处理人 */
  queues: Record<string, string[]>;
  /** 同步的调用节点还在等几个子实例 */
  calls: Record<string, number>;
  /** 自定义节点在等的事件：节点 → 事件名 */
  events: Record<string, string>;
  /** 上一步选的下一步处理人（`assignees` 写 `{ pick }` 的节点）：节点 → 用户编号 */
  picks: Record<string, string[]>;
}

/** 迁移版本时按节点改名：按节点记的键、值里的节点、会签组（节点#轮次）都换成新版本的节点 */
export function renameNodes(state: RunState, mapping: Readonly<Record<string, string>>): RunState {
  const node = (id: string) => mapping[id] ?? id;
  const keys = <T>(record: Record<string, T>, value: (v: T) => T = (v) => v) =>
    Object.fromEntries(Object.entries(record).map(([k, v]) => [node(k), value(v)]));
  const group = (key: string) => {
    const at = key.lastIndexOf('#');
    return at < 0 ? node(key) : `${node(key.slice(0, at))}${key.slice(at)}`;
  };
  return {
    ...state,
    waiting: keys(state.waiting),
    rounds: keys(state.rounds),
    handledBy: keys(state.handledBy),
    returnedFrom: keys(state.returnedFrom, node),
    queues: Object.fromEntries(Object.entries(state.queues).map(([k, v]) => [group(k), v])),
    calls: keys(state.calls),
    events: keys(state.events),
    picks: keys(state.picks ?? {}),
  };
}

/** 新实例的运行状态 */
export const emptyRunState = (): RunState => ({
  waiting: {},
  rounds: {},
  handledBy: {},
  returnedFrom: {},
  queues: {},
  calls: {},
  events: {},
  picks: {},
});

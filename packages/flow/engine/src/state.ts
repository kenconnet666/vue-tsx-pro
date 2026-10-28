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
}

/** 新实例的运行状态 */
export const emptyRunState = (): RunState => ({
  waiting: {},
  rounds: {},
  handledBy: {},
  returnedFrom: {},
  queues: {},
});

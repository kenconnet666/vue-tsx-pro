/**
 * 引擎的选项与命令（docs/decisions/0001 第 5 节）：一个入口 `engine.run(command, actor)`，命令是可辨识联合；
 * 扩展点是选项里的函数，按变化点分类：谁来处理（org、resolvers）、能不能过（guards）、自动做什么（actions）、算一个值（functions）、
 * 发生了什么（on）
 */
import type { Adapter } from '@zerodep-dev/easy-query-ts';

/** 做事的人：编号与他的角色、部门（判断能不能认领收件箱里的待办）；admin 能做管理员的事 */
export interface Actor {
  readonly id: string;
  readonly name?: string;
  readonly roles?: readonly string[];
  readonly departments?: readonly string[];
  /** 接入方扩展的种类（岗位、项目组……），写成“种类:编号” */
  readonly groups?: readonly string[];
  readonly admin?: boolean;
}

/** 组织：角色、部门、扩展种类里有哪些人（会签展开参与人、抄送时用） */
export interface FlowOrg {
  members(
    source:
      { readonly role: string } | { readonly department: string } | { readonly group: string },
  ): readonly string[] | Promise<readonly string[]>;
}

/** 扩展函数拿到的：实例、流程变量、按字段名取值 */
export interface ExtensionContext {
  readonly instance: {
    readonly id: number;
    readonly processKey: string;
    readonly businessKey: string | null;
    readonly startedBy: string;
  };
  readonly variables: Readonly<Record<string, unknown>>;
  /** 按字段名取值：流程变量、`sys.名字`、`fn.名字` */
  read(field: string): unknown;
  /** 定义里写的参数 */
  readonly args: Readonly<Record<string, unknown>>;
}

/** 处理人解析器：返回处理人的编号 */
export type Resolver = (
  context: ExtensionContext,
) => readonly string[] | Promise<readonly string[]>;

/** 守卫：提交前检查，返回 true 放行，返回文字是拒绝的原因 */
export type Guard = (
  context: ExtensionContext & {
    readonly node: string;
    readonly outcome: string;
    readonly actor: Actor;
  },
) => true | string | Promise<true | string>;

/** 自动节点的动作：可以给出结果（按它选出边）、改流程变量 */
export type Action = (context: ExtensionContext & { readonly node: string }) =>
  | void
  | { readonly outcome?: string; readonly variables?: Readonly<Record<string, unknown>> }
  | Promise<void | {
      readonly outcome?: string;
      readonly variables?: Readonly<Record<string, unknown>>;
    }>;

/** 计算值（条件里的 `fn.名字`）：同步，按当时的变量算 */
export type ComputedValue = (context: Omit<ExtensionContext, 'args'>) => unknown;

/** 接入方注册的扩展：定义里按名字引用 */
export interface FlowExtensions {
  readonly resolvers?: Readonly<Record<string, Resolver>>;
  readonly guards?: Readonly<Record<string, Guard>>;
  readonly actions?: Readonly<Record<string, Action>>;
  readonly functions?: Readonly<Record<string, ComputedValue>>;
}

/** 流转记录（监听拿到的、实例详情里列的） */
export interface FlowEventView {
  readonly type: string;
  readonly instanceId: number;
  readonly workItemId: number | null;
  readonly at: Date;
  readonly actor: string | null;
  readonly node: string | null;
  readonly edge: string | null;
  readonly outcome: string | null;
  readonly comment: string | null;
  readonly data: Readonly<Record<string, unknown>> | null;
}

/** 监听：事件类型 → 处理函数，在事务提交后执行（通知、发消息）；`'*'` 收所有事件 */
export type FlowListeners = Readonly<
  Record<string, (event: FlowEventView) => void | Promise<void>>
>;

/** createFlowEngine 的选项 */
export interface FlowEngineOptions {
  /** easy-query 的适配器（sqlite、mysql、pg、hana）：引擎在这个库里建自己的表 */
  readonly adapter: Adapter;
  readonly org?: FlowOrg;
  readonly extensions?: FlowExtensions;
  readonly on?: FlowListeners;
  /** 处理人解析为空、节点要求交给管理员时，交给这些人 */
  readonly admins?: readonly string[];
  /** 时钟；测试用假时钟 */
  readonly clock?: () => Date;
  /** 工作日：默认周一到周五 */
  readonly isWorkday?: (day: Date) => boolean;
  /**
   * 命令拦截：before 在执行前，可以返回改过的命令，抛错就不执行（权限、审计、改参数）；
   * after 在命令做完、提交之前，抛错时整个命令回滚
   */
  readonly intercept?: {
    readonly before?: (
      command: FlowCommand,
      actor: Actor,
    ) => FlowCommand | void | Promise<FlowCommand | void>;
    readonly after?: (
      command: FlowCommand,
      result: RunResult,
      actor: Actor,
    ) => void | Promise<void>;
  };
}

/** 命令：一个入口 engine.run(command, actor) */
export type FlowCommand =
  /** 发起：按流程的最新启用版本 */
  | {
      readonly type: 'start';
      readonly process: string;
      readonly variables?: Readonly<Record<string, unknown>>;
      readonly businessKey?: string;
      readonly title?: string;
    }
  /** 认领收件箱里的待办 */
  | { readonly type: 'claim'; readonly workItem: number }
  /** 处理：选一个结果；退回到“运行时选”的节点时写 returnTo */
  | {
      readonly type: 'complete';
      readonly workItem: number;
      readonly outcome: string;
      readonly comment?: string;
      readonly variables?: Readonly<Record<string, unknown>>;
      readonly returnTo?: string;
    }
  /** 转办：交给另一个人处理 */
  | {
      readonly type: 'transfer';
      readonly workItem: number;
      readonly to: string;
      readonly comment?: string;
    }
  /** 发起人撤回整个实例（按流程的 withdraw 设置） */
  | { readonly type: 'withdraw'; readonly instance: number; readonly comment?: string }
  /** 管理员终止 */
  | {
      readonly type: 'terminate';
      readonly instance: number;
      readonly comment?: string;
      readonly result?: string;
    }
  /** 管理员暂停、恢复：暂停期间不能认领、处理，作业往后推 */
  | { readonly type: 'suspend'; readonly instance: number; readonly comment?: string }
  | { readonly type: 'resume'; readonly instance: number }
  /** 催办：发起人或管理员催还开着的待办（不写 workItem 时催实例上全部） */
  | {
      readonly type: 'remind';
      readonly instance: number;
      readonly workItem?: number;
      readonly message?: string;
    }
  /** 管理员改派、跳转、跳过失败的异步动作 */
  | {
      readonly type: 'reassign';
      readonly workItem: number;
      readonly to: string;
      readonly comment?: string;
    }
  | {
      readonly type: 'jump';
      readonly instance: number;
      readonly node: string;
      readonly comment?: string;
    }
  | {
      readonly type: 'skipJob';
      readonly job: number;
      readonly outcome?: string;
      readonly reason?: string;
    }
  /** 留言：记进流转记录 */
  | { readonly type: 'comment'; readonly instance: number; readonly text: string }
  /** 手动抄送 */
  | {
      readonly type: 'cc';
      readonly instance: number;
      readonly users: readonly string[];
      readonly message?: string;
    };

/** 外部事件（engine.signal）：送到等这个事件的实例，按实例或业务编号找 */
export interface SignalInput {
  readonly event: string;
  readonly instance?: number;
  readonly businessKey?: string;
  readonly outcome?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

/** 实例的概要 */
export interface InstanceSummary {
  readonly id: number;
  readonly processKey: string;
  readonly version: number;
  readonly status: 'active' | 'suspended' | 'completed' | 'terminated' | 'withdrawn';
  readonly result: string | null;
  readonly title: string | null;
  /** 正在处理的节点与名称 */
  readonly current: readonly { readonly node: string; readonly name: string }[];
  readonly variables: Readonly<Record<string, unknown>>;
}

/** 待办的概要 */
export interface WorkItemSummary {
  readonly id: number;
  readonly instanceId: number;
  readonly node: string;
  readonly nodeName: string;
  readonly round: number;
  readonly state: 'open' | 'waiting' | 'done' | 'canceled';
  readonly assignment: 'pool' | 'claimed' | 'direct';
  readonly assignee: string | null;
  readonly arrival: string;
  readonly createdAt: Date;
  readonly dueAt: Date | null;
}

/** 命令的结果：实例现在的样子、这次新建的待办、这次记下的流转记录 */
export interface RunResult {
  readonly instance: InstanceSummary;
  readonly workItems: readonly WorkItemSummary[];
  readonly events: readonly FlowEventView[];
}

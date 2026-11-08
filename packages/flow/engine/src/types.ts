/**
 * 引擎的选项与命令（docs/decisions/0001 第 5 节）：一个入口 `engine.run(command, actor)`，命令是可辨识联合；
 * 扩展点是选项里的函数，按变化点分类：谁来处理（org、resolvers）、能不能过（guards）、自动做什么（actions）、算一个值（functions）、
 * 发生了什么（on）
 */
import type { Adapter } from '@zerodep-dev/easy-query-ts';
import type { FlowProject } from '@zerodep-dev/flow-ts-model';
import type { ASSIGNMENTS, INSTANCE_STATUSES } from './core/entities.ts';

/** 实例的状态：草稿、进行中、已完成、已终止、已撤回、已暂停 */
export type InstanceStatus = (typeof INSTANCE_STATUSES)[number];
import type { WorkItemOperation } from './commands/operations.ts';
import type { HostModules, TransformCode } from './publish/project.ts';
import type { Actor, FlowExtensions, FlowOrg } from './extensions.ts';
import type { NotificationView } from './views.ts';
export type * from './extensions.ts';

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

/** 类型检查的一处问题 */
export interface TypeProblem {
  readonly file: string;
  /** 从 1 数 */
  readonly line: number;
  readonly column: number;
  readonly code: number;
  readonly message: string;
}

/** 类型检查：工程的文件与宿主模块的声明 → 问题 */
export type CheckTypes = (
  project: FlowProject,
  modules: HostModules,
) => readonly TypeProblem[] | Promise<readonly TypeProblem[]>;

/** createFlowEngine 的选项 */
export interface FlowEngineOptions {
  /** easy-query 的 PostgreSQL 适配器（pg 连接池或 PGlite）：引擎在这个库里建自己的表 */
  readonly adapter: Adapter;
  /** 待办上的动作：加自定义的，同名的覆盖内置的（commands/operations.ts） */
  readonly operations?: readonly WorkItemOperation[];
  /** 流程工程能 import 的宿主模块（组件库、zod、业务服务……）：模块名 → 导出或加载函数，带上声明给类型检查 */
  readonly modules?: HostModules;
  /** 流程工程的 TS / TSX 怎么编译：Node 里用 flow-ts-studio 的 compileInPlace，浏览器页面里传 Worker 编译 */
  readonly transform?: TransformCode;
  /** 发布流程工程前做类型检查（`@zerodep-dev/flow-ts-studio/typecheck` 的 createTypeChecker）；有错不让发布 */
  readonly checkTypes?: CheckTypes;
  readonly org?: FlowOrg;
  readonly extensions?: FlowExtensions;
  readonly on?: FlowListeners;
  /**
   * 通知的外部投递（邮件、短信、IM）：每条通知提交后交给 deliver，抛错的留在发件箱、到点作业再试（最多 5 次）；
   * 不给时只有站内信箱（engine.notifications）
   */
  readonly notifications?: {
    readonly deliver?: (notification: NotificationView) => void | Promise<void>;
  };
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
  /** 发起：按流程的最新启用版本；给了 draft 时从那份草稿发起（同一个实例，草稿的值加上这次给的） */
  | {
      readonly type: 'start';
      readonly process: string;
      readonly draft?: number;
      readonly variables?: Readonly<Record<string, unknown>>;
      readonly businessKey?: string;
      readonly title?: string;
      /** 给接下来要选处理人的节点选的人（startView 的 picks）：节点 → 用户编号 */
      readonly picks?: Readonly<Record<string, readonly (string | number)[]>>;
    }
  /** 待办上的动作（commands/operations.ts）：认领、转办、委托、加签……；input 是动作要填的 */
  | {
      readonly type: 'operate';
      readonly workItem: number;
      readonly operation: string;
      readonly input?: Readonly<Record<string, unknown>>;
    }
  /** 认领收件箱里的待办（operate 的简写） */
  | { readonly type: 'claim'; readonly workItem: number }
  /** 处理：选一个结果；退回到“运行时选”的节点时写 returnTo */
  | {
      readonly type: 'complete';
      readonly workItem: number;
      readonly outcome: string;
      readonly comment?: string;
      readonly variables?: Readonly<Record<string, unknown>>;
      readonly returnTo?: string;
      /** 给这个结果之后要选处理人的节点选的人（待办详情 outcomes 的 picks）：节点 → 用户编号 */
      readonly picks?: Readonly<Record<string, readonly (string | number)[]>>;
    }
  /** 转办：交给另一个人处理（operate 的简写） */
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
  /** 管理员改派（operate 的简写）、跳转、跳过失败的异步动作 */
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
  /**
   * 管理员把实例迁到流程的另一个版本：正在用的节点按对应关系换到新版本的节点（同名的可以不写），
   * 新版本里没有或类型不同时报 invalid-input，不迁；待办、运行状态、作业跟着改，记 instance.migrated
   */
  | {
      readonly type: 'migrate';
      readonly instance: number;
      readonly version: number;
      /** 旧节点 → 新节点 */
      readonly nodes?: Readonly<Record<string, string>>;
      readonly comment: string;
    }
  /** 管理员改单据数据：记下每个字段改前、改后的值（instance.dataChanged） */
  | {
      readonly type: 'changeData';
      readonly instance: number;
      readonly variables: Readonly<Record<string, unknown>>;
      readonly comment?: string;
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

/** 列表的筛选：流程、时间段（已办按处理的时刻，我发起的、查单据按发起的时刻） */
export interface ListFilter {
  readonly processKey?: string;
  readonly from?: Date | string;
  readonly to?: Date | string;
}

/** 查单据（engine.query.search）的条件 */
export interface InstanceSearch extends ListFilter {
  /**
   * 范围：我发起的；我经手的（发起、处理过、在我的待办或我能认领的收件箱里、抄送给我）；全部（只有管理员能查）
   * @default 'involved'
   */
  readonly scope?: 'started' | 'involved' | 'all';
  /** 只要这些状态的；不给时除草稿以外都要（草稿只在草稿箱里） */
  readonly status?: readonly InstanceStatus[];
  /** 标题或业务编号里有这段文字（不分大小写） */
  readonly text?: string;
  /** 第几页，从 1 开始 */
  readonly page?: number;
  /** 每页几行，默认 20 */
  readonly size?: number;
}

/** 一页结果：这一页的行与总行数 */
export interface ResultPage<T> {
  readonly rows: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly size: number;
}

/** 批量执行（engine.runMany）里一条命令的结果：各自成败，失败的带错误代号 */
export type BatchResult =
  | { readonly ok: true; readonly result: RunResult }
  | { readonly ok: false; readonly code: string; readonly message: string };

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
  readonly status: InstanceStatus;
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
  readonly assignment: (typeof ASSIGNMENTS)[number];
  readonly assignee: string | null;
  /** 代理：本该是谁的（他设了代理，交给了 assignee） */
  readonly proxyFor: string | null;
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

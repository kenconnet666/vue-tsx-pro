/**
 * 引擎的选项与命令（docs/decisions/0001 第 5 节）：一个入口 `engine.run(command, actor)`，命令是可辨识联合；
 * 扩展点是选项里的函数，按变化点分类：谁来处理（org、resolvers）、能不能过（guards）、自动做什么（actions）、算一个值（functions）、
 * 发生了什么（on）
 */
import type { Adapter } from '@zerodep-dev/easy-query-ts';
import type { FieldTypeChecks, FlowProject } from '@zerodep-dev/flow-ts-model';
import type { ASSIGNMENTS, INSTANCE_STATUSES } from './entities.ts';
import type { WorkItemOperation } from './operations.ts';
import type { HostModules, TransformCode } from './project.ts';

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
  /**
   * 收件箱的负责人（节点写了 `unclaimed: { action: 'assignByManager' }`，很久没人认领时由他指定承办人）：
   * 参数是收件箱的候选（角色、部门、扩展种类），不知道时返回 undefined
   */
  inboxManager?(inbox: {
    readonly kind: 'role' | 'department' | 'group';
    readonly value: string;
  }): string | undefined | Promise<string | undefined>;
}

/** 流程变量的默认形状（没有单据类型时） */
export type Variables = Readonly<Record<string, unknown>>;

/** 扩展函数拿到的：实例、流程变量、按字段名取值；V 是单据的值（流程工程里由 form.ts 推出） */
export interface ExtensionContext<V extends object = Variables> {
  readonly instance: {
    readonly id: number;
    readonly processKey: string;
    readonly businessKey: string | null;
    readonly startedBy: string;
  };
  readonly variables: Readonly<V>;
  /** 按字段名取值：流程变量、`sys.名字`、`fn.名字` */
  read<K extends keyof V & string>(field: K): V[K] | undefined;
  read(field: string): unknown;
  /** 定义里写的参数 */
  readonly args: Readonly<Record<string, unknown>>;
}

/** 处理人解析器：返回处理人的编号 */
export type Resolver<V extends object = Variables> = (
  context: ExtensionContext<V>,
) => readonly string[] | Promise<readonly string[]>;

/** 守卫：提交前检查，返回 true 放行，返回文字是拒绝的原因 */
export type Guard<V extends object = Variables> = (
  context: ExtensionContext<V> & {
    readonly node: string;
    readonly outcome: string;
    readonly actor: Actor;
  },
) => true | string | Promise<true | string>;

/** 自动节点的动作：可以给出结果（按它选出边）、改流程变量 */
export type Action<V extends object = Variables> = (
  context: ExtensionContext<V> & { readonly node: string },
) =>
  | void
  | { readonly outcome?: string; readonly variables?: Readonly<Partial<V>> }
  | Promise<void | { readonly outcome?: string; readonly variables?: Readonly<Partial<V>> }>;

/** 计算值（条件里的 `fn.名字`）：同步，按当时的变量算 */
export type ComputedValue<V extends object = Variables> = (
  context: Omit<ExtensionContext<V>, 'args'>,
) => unknown;

/** 自定义节点做完之后怎样往下：按结果走（没写结果走没写结果的出边），顺带改流程变量；或停下来等一个外部事件 */
export interface CustomNodeResult<V extends object = Variables> {
  readonly outcome?: string | null;
  readonly variables?: Readonly<Partial<V>>;
  /** 停下来等的事件名（由 engine.signal 送来）；不等时不写 */
  readonly waitFor?: string;
}

/** 自定义节点拿到的：扩展的现场，加上节点上除共同字段以外的属性（定义里写的原样） */
export type CustomNodeContext<V extends object = Variables> = Omit<ExtensionContext<V>, 'args'> & {
  readonly node: string;
  readonly attributes: Readonly<Record<string, unknown>>;
};

/** 自定义节点类型（定义里 `type: 'x-名字'`）：到达时做什么、等的事件到了怎样往下 */
export interface CustomNode<V extends object = Variables> {
  arrive(context: CustomNodeContext<V>): CustomNodeResult<V> | Promise<CustomNodeResult<V>>;
  /** 等的事件到了；不写时按事件带的结果往下走 */
  received?(
    context: CustomNodeContext<V>,
    event: { readonly outcome: string | null; readonly data: Readonly<Record<string, unknown>> },
  ): CustomNodeResult<V> | Promise<CustomNodeResult<V>>;
}

/**
 * 自定义会签规则（定义里 `multi.complete: '名字'`）：每有一个人处理完就问一次，返回结果就按它结束（其余开着的取消），
 * 返回 undefined 再等；都处理完还没有结果时按 fallback，没写时按最后这个人选的。参与人一起处理（不是依次）
 */
export type CountersignRule = (context: {
  readonly node: string;
  /** 刚处理完的人选的结果 */
  readonly chosen: string;
  /** 这个节点这一轮的全部待办（含刚处理完的） */
  readonly items: readonly {
    readonly assignee: string | null;
    readonly state: string;
    readonly outcome: string | null;
    readonly weight: number | null;
  }[];
  /** 还有人没处理完 */
  readonly someoneOpen: boolean;
}) => string | undefined;

/** 接入方注册的扩展：定义里按名字引用 */
export interface FlowExtensions<V extends object = Variables> {
  readonly resolvers?: Readonly<Record<string, Resolver<V>>>;
  readonly guards?: Readonly<Record<string, Guard<V>>>;
  readonly actions?: Readonly<Record<string, Action<V>>>;
  readonly functions?: Readonly<Record<string, ComputedValue<V>>>;
  /** 自定义节点类型：键是 `x-` 开头的类型名 */
  readonly nodes?: Readonly<Record<string, CustomNode<V>>>;
  /** 自定义会签规则：键是定义里 `multi.complete` 写的名字 */
  readonly countersign?: Readonly<Record<string, CountersignRule>>;
  /**
   * 接入方注册的字段类型：键是清单里的 `type`，值查一个值合不合（返回问题的代号）。
   * 发布时清单校验认得这些类型；发起、处理、暂存时按它查值
   */
  readonly fieldTypes?: FieldTypeChecks;
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
  /** 待办上的动作：加自定义的，同名的覆盖内置的（operations.ts） */
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
    }
  /** 待办上的动作（operations.ts）：认领、转办、委托、加签……；input 是动作要填的 */
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

/** 列表的筛选：流程、时间段（已办按处理的时刻，我发起的按发起的时刻） */
export interface ListFilter {
  readonly processKey?: string;
  readonly from?: Date | string;
  readonly to?: Date | string;
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
  readonly status: (typeof INSTANCE_STATUSES)[number];
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

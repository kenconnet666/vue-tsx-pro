/**
 * 引擎给出的结果的形状：待办与已办的行、待办详情、发起视图、实例详情、抄送、异常、版本。
 * 查询（queries/queries.ts）与命令的结果按它们给出，前端（flow-ts-ui、流程中心）按它们渲染。
 */
import {
  type NodeFormAccess,
  type FormManifest,
  type Outcome,
  type ProcessDefinition,
  type VariableDeclaration,
} from '@zerodep-dev/flow-ts-model';
import { type NextStep, type PickPrompt } from './runtime/next-steps.ts';
import { type InstanceRow, type WorkItemRow } from './runtime/execution.ts';
import { type OperationView } from './commands/operations.ts';
import type { Actor, FlowEventView, RunResult, WorkItemSummary } from './types.ts';

/** 待办列表里的一行：待办加所属实例的标题、流程与摘要列（定义里 summary 列出的字段） */
export interface TodoItem extends WorkItemSummary {
  readonly processKey: string;
  readonly title: string | null;
  readonly summary: Readonly<Record<string, unknown>>;
  /** 实例现在的状态：已办里看得出单子结束了没有 */
  readonly instanceStatus: InstanceRow['status'];
  /** 处理的时间与选的结果（已办；待办时为空） */
  readonly completedAt: Date | null;
  readonly outcome: string | null;
  /**
   * 批量处理（勾几条一起同意）时选的结果：节点上第一个同意类、不要求写意见的结果；没有时这份不能批量处理，已办里为空。
   * 单据没填全、要给下一步选人的，批量时由引擎逐条拒绝（runMany 的结果里写着原因）
   */
  readonly quickOutcome: string | null;
}

/** 退回到运行时选的节点时能选的一个：上游走到过的人工节点与它上次的处理人 */
export interface ReturnTarget {
  readonly node: string;
  readonly nodeName: string;
  /** 上次处理它的人（退回后落回这个人） */
  readonly handler: string | null;
}

/**
 * 待办详情里的一个结果（能处理这份待办的人才有后面几项）：选它之后会到哪些节点、要给哪些节点选处理人；
 * 退回到运行时选的节点（target: 'choose'）时能选的节点
 */
export type OutcomeView = Outcome & {
  readonly next: readonly NextStep[];
  readonly picks: readonly PickPrompt[];
  readonly targets: readonly ReturnTarget[];
};

/** 发起视图：流程、单据的清单与发起时的权限、默认值，接下来要选处理人的节点 */
export interface StartView {
  readonly process: { readonly key: string; readonly name: string; readonly version: number };
  readonly manifest: FormManifest;
  readonly access: NodeFormAccess | null;
  readonly values: Readonly<Record<string, unknown>>;
  /** 发起后会到哪些节点 */
  readonly next: readonly NextStep[];
  readonly picks: readonly PickPrompt[];
}

/** 待办详情：待办、实例、能选的结果，这个人能不能认领、能不能处理、能不能转办，退回时能选的节点 */
export interface WorkItemDetail {
  readonly workItem: WorkItemRow;
  readonly instance: InstanceRow;
  readonly outcomes: readonly OutcomeView[];
  readonly claimable: boolean;
  /** 能选结果处理：是候选人，待办开着，不在委托中（委托出去的由受托人办完交回） */
  readonly completable: boolean;
  /** 处理前暂存的值与意见：只有处理人看得到，别人是 null */
  readonly draft: WorkItemRow['draft'];
  /** 这个人此刻能做的动作（认领、转办、委托、加签……）与要填的 */
  readonly operations: readonly OperationView[];
  /**
   * 单据的字段在这一步的样子：流程声明的变量按环节的表单权限（node.form）算，隐藏的不列；
   * 不是候选人（只是来看的）时一律只读
   */
  readonly fields: readonly WorkItemField[];
}

/** 待办详情里的一个字段 */
export interface WorkItemField {
  readonly name: string;
  readonly label: string;
  readonly type: VariableDeclaration['type'];
  readonly value: unknown;
  readonly editable: boolean;
  readonly required: boolean;
}

/** 抄送列表里的一行 */
export interface CcItem {
  readonly id: number;
  readonly instanceId: number;
  /** 抄送节点；手动抄送时为空 */
  readonly node: string | null;
  readonly recipient: string;
  /** 谁抄送的；抄送节点时为空 */
  readonly sender: string | null;
  readonly message: string | null;
  readonly at: Date;
  readonly readAt: Date | null;
  readonly processKey: string;
  readonly title: string | null;
  readonly status: InstanceRow['status'];
}

/** 失败的作业（异常） */
export interface Incident {
  readonly jobId: number;
  readonly instanceId: number;
  readonly instanceTitle: string | null;
  readonly kind: string;
  readonly node: string | null;
  readonly nodeName: string | null;
  readonly attempts: number;
  readonly error: string | null;
  /** 异步动作能跳过（按选的结果往下走） */
  readonly skippable: boolean;
  /** 跳过时能选的结果 */
  readonly outcomes: readonly string[];
}

/** 实例详情 */
export interface InstanceDetail {
  readonly instance: InstanceRow;
  /** 实例按的那个版本的定义（画流程图） */
  readonly definition: ProcessDefinition;
  /** 正在处理的节点与名称 */
  readonly current: readonly { readonly node: string; readonly name: string }[];
  readonly workItems: readonly WorkItemSummary[];
  readonly events: readonly FlowEventView[];
  /** 看的人此刻能对实例做的（query.instance 给了 actor 时算，否则都是 false） */
  readonly actions: InstanceActions;
}

/** 实例上能做的：页面按它显示按钮，规则只在引擎里 */
export interface InstanceActions {
  /** 发起人撤回（按流程的 withdraw 设置） */
  readonly withdraw: boolean;
  /** 发起人或管理员催还开着的待办 */
  readonly remind: boolean;
  /** 管理员的干预：暂停或恢复、终止、跳转、改派、改单据、迁移版本 */
  readonly manage: boolean;
}

/** 发布的选项 */
export interface PublishOptions {
  readonly actor?: Actor;
  /** 发布说明 */
  readonly note?: string;
}

/** 一个已发布的版本 */
export interface VersionInfo {
  readonly id: number;
  readonly version: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly publishedBy: string | null;
  readonly publishedAt: Date;
  readonly note: string | null;
}

/** 带单据类型的流程 */
export interface TypedProcess<V extends object> {
  start(
    input: { readonly variables: V; readonly title?: string; readonly businessKey?: string },
    actor: Actor,
  ): Promise<RunResult>;
  complete(
    input: {
      readonly workItem: number;
      readonly outcome: string;
      readonly variables?: Partial<V>;
      readonly comment?: string;
    },
    actor: Actor,
  ): Promise<RunResult>;
}

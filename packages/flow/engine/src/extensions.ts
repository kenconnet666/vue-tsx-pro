/**
 * 扩展点：做事的人、组织、处理人解析器、守卫、动作、计算值、自定义节点与会签规则，以及流程工程的 logic.ts 用的 defineLogic、
 * test.ts 用的 defineScenarios（场景测试）。
 * 只依赖模型包、不碰库与实体：流程代码（logic.ts）只用到这些，工作室在浏览器里的语言服务也只带上这个文件与模型包。
 * 引擎的入口照常导出它们（types.ts、publish/project.ts 从这里导入）。
 */
import type {
  Duration,
  FieldTypeChecks,
  FormManifest,
  FormValues,
} from '@zerodep-dev/flow-ts-model';

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

/** 流程代码里的逻辑：按种类分组，定义里写 `logic.名字` 引用 */
export type FlowLogic<V extends object = Variables> = FlowExtensions<V>;

/**
 * 写 logic.ts：给了单据时 ctx.variables、ctx.read 按单据的类型来
 * ```ts
 * import form from './form';
 * export default defineLogic(form, {
 *   guards: { budget: ({ variables }) => Number(variables.amount) > 1e5 ? '超出预算' : true },
 * });
 * ```
 */
export function defineLogic<const L extends FlowLogic>(logic: L): L;
export function defineLogic<Form extends FormManifest, const L extends FlowLogic<FormValues<Form>>>(
  form: Form,
  logic: L,
): L;
export function defineLogic(first: unknown, second?: unknown): unknown {
  return second ?? first;
}

// ---------- 场景测试（流程工程的 test.ts）----------

/** 试运行的一步 */
export type SimulationStep =
  /** 处理某个节点上开着的待办（以它的处理人或管理员的身份） */
  | {
      readonly node: string;
      readonly outcome: string;
      readonly variables?: Readonly<Record<string, unknown>>;
      readonly comment?: string;
      readonly returnTo?: string;
    }
  /** 时间往后拨，执行到点的作业（定时、时限、提醒、异步动作） */
  | { readonly wait: Duration }
  /** 外部事件 */
  | {
      readonly signal: string;
      readonly outcome?: string;
      readonly data?: Readonly<Record<string, unknown>>;
    };

/** 一个场景期望的结果：写了的才核对 */
export interface ScenarioExpect {
  /** 最后实例的状态 */
  readonly status?: 'active' | 'completed' | 'terminated' | 'withdrawn' | 'suspended';
  /** 结束时的结果（结束节点的 result、terminate 的 result） */
  readonly result?: string;
  /** 停在这些节点（开着的待办所在的，不论先后） */
  readonly at?: readonly string[];
  /** 等这些人处理（开着的待办的处理人，不论先后） */
  readonly waitingFor?: readonly string[];
  /** 在这一步出错（发起是第 0 步），错误里有这段文字；不写 error 时出错就算不通过 */
  readonly error?: { readonly step?: number; readonly message?: string };
}

/** 一个场景：谁发起、单据填什么、一步步怎么处理、期望什么 */
export interface Scenario<V extends object = Variables> {
  /** 发起人的编号；不写时由运行的地方定 */
  readonly initiator?: string;
  readonly variables?: Partial<V>;
  readonly steps?: readonly SimulationStep[];
  readonly expect: ScenarioExpect;
}

/** 场景名 → 场景 */
export type Scenarios<V extends object = Variables> = Readonly<Record<string, Scenario<V>>>;

/**
 * 写 test.ts：给了单据时 variables 按单据的类型来
 * ```ts
 * import form from './form';
 * export default defineScenarios(form, {
 *   '小额直接通过': { variables: { amount: '800' }, steps: [{ node: 'review', outcome: 'pass' }], expect: { status: 'completed' } },
 * });
 * ```
 */
export function defineScenarios<const S extends Scenarios>(scenarios: S): S;
export function defineScenarios<
  Form extends FormManifest,
  const S extends Scenarios<FormValues<Form>>,
>(form: Form, scenarios: S): S;
export function defineScenarios(first: unknown, second?: unknown): unknown {
  return second ?? first;
}

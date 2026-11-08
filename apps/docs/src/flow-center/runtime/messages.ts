/**
 * 页面与 Worker 之间演示用的消息（引擎的调用另走客户端的端口协议，带 flow 标记）：
 * 页面让 Worker 启动、换演示身份、拨时钟、重置，调 Worker 的方法（维护组织、试运行）；Worker 报启动的进度、准备好了、
 * 现在几点、库里的组织、方法的结果。
 */
import type { Actor } from '@zerodep-dev/flow-ts-engine';
import type { FlowProject } from '@zerodep-dev/flow-ts-model';
import type {
  ScenarioResult,
  SimulationInput,
  SimulationResult,
} from '@zerodep-dev/flow-ts-engine/testing';
import type { OrgDirectory, OrgSnapshot } from '@zerodep-dev/flow-ts-engine/org';

/** 页面能调的 Worker 方法（不属于引擎的客户端的那些）：参数 → 结果 */
export interface WorkerMethods {
  saveDepartment: (department: Parameters<OrgDirectory['saveDepartment']>[0]) => void;
  removeDepartment: (id: string) => void;
  saveEmployee: (employee: Parameters<OrgDirectory['saveEmployee']>[0]) => void;
  saveRole: (role: Parameters<OrgDirectory['saveRole']>[0]) => void;
  /** 引擎眼里的这个人（试运行的发起人） */
  actorOf: (id: string) => Actor | undefined;
  /** 工作室的试运行：在 Worker 里另一个内存库上跑，组织、解析器、动作同流程中心，已发布的流程都在 */
  simulate: (trial: {
    project: FlowProject;
    input: Pick<SimulationInput, 'variables' | 'initiator' | 'steps'>;
  }) => SimulationResult;
  /** 工作室的场景测试：跑工程 test.ts 里的全部场景（同试运行的库与扩展） */
  runTests: (trial: { project: FlowProject }) => ScenarioResult[];
}
export type WorkerMethod = keyof WorkerMethods;

/** 页面 → Worker */
export type ToWorker =
  /** 启动：用这个身份、时钟偏移（毫秒，快进过的） */
  | { readonly demo: 'init'; readonly actor: string; readonly offset: number }
  /** 换演示身份 */
  | { readonly demo: 'actor'; readonly actor: string }
  /** 时钟往后拨（毫秒），拨完跑到点的作业 */
  | { readonly demo: 'advance'; readonly by: number }
  /** 删掉演示数据重来 */
  | { readonly demo: 'reset' }
  /** 调 Worker 的方法：call 是这次调用的编号，结果按它回 */
  | {
      readonly demo: 'call';
      readonly call: number;
      readonly method: WorkerMethod;
      readonly argument: unknown;
    };

/** Worker → 页面 */
export type FromWorker =
  /** 启动的进度：第一次打开要建表、发布流程、写种子 */
  | {
      readonly demo: 'progress';
      readonly step: string;
      readonly done: number;
      readonly total: number;
    }
  /** 准备好了 */
  | { readonly demo: 'ready'; readonly now: string; readonly offset: number }
  /** 库里的组织（启动、重置、改过之后）：页面按它选人、显示名字 */
  | { readonly demo: 'org'; readonly org: OrgSnapshot }
  /** 时钟变了（拨过、作业跑过） */
  | { readonly demo: 'clock'; readonly now: string; readonly offset: number }
  /** 启动失败 */
  | { readonly demo: 'error'; readonly message: string }
  /** 方法的结果：失败时带引擎的错误代号与说明 */
  | {
      readonly demo: 'reply';
      readonly call: number;
      readonly value?: unknown;
      readonly error?: { readonly code: string; readonly message: string };
    };

/** 是演示的消息（不是引擎的） */
export const isDemoMessage = (data: unknown): data is ToWorker | FromWorker =>
  typeof data === 'object' && data !== null && 'demo' in data;

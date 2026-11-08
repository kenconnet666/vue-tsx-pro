/**
 * 已登录的人看到的引擎（docs/decisions/0009 第 2 节）：命令与查询都不带 actor——“我”的待办、“我”发起、以“我”的身份处理；
 * 是谁由连接的那一头（端点）定。页面只经它用引擎，引擎在浏览器的 Worker 里还是在服务端，页面代码一样。
 *
 *   const flow = createFlowClient(portTransport(worker));
 *   const todo = await flow.todo();
 *   await flow.run({ type: 'complete', workItem: todo[0].id, outcome: 'approve' });
 *   const stop = flow.onChange(() => refresh());
 */
import type { FlowProject, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { parseWire, parseWireJson, stringifyWire, type WireReader } from '@zerodep-dev/json-wire';
import { FlowError, type FlowErrorCode } from '../core/errors.ts';
import type { InstanceRow } from '../runtime/execution.ts';
import type {
  BatchResult,
  FlowCommand,
  InstanceSearch,
  ListFilter,
  ResultPage,
  RunResult,
  SignalInput,
} from '../types.ts';
import type {
  CatalogEntry,
  CcItem,
  CheckResult,
  Incident,
  InstanceDetail,
  StartView,
  TodoItem,
  VersionInfo,
  WorkItemDetail,
} from '../views.ts';
import type { FlowTransport } from './protocol.ts';

/** 发起前的草稿：存、列、取、删 */
export interface DraftInput {
  /** 改哪一份；不给时按 process 新建 */
  readonly draft?: number;
  readonly process?: string;
  readonly variables?: Readonly<Record<string, unknown>>;
  readonly businessKey?: string;
}

/** 引擎给出的时刻（待办的创建时间、期限……）是 Date：线上的 timestamptz 读回 Date，别的照 json-wire 默认 */
const reader: WireReader = (kind, text) =>
  kind === 'timestamptz'
    ? (parseWire(kind, text) as { toDate(): Date }).toDate()
    : parseWire(kind, text);

/** 已登录的人看到的引擎 */
export interface FlowClient {
  /** 执行一个命令（发起、处理、动作……） */
  run(command: FlowCommand): Promise<RunResult>;
  /** 批量执行：每条一个事务，各自成败 */
  runMany(commands: readonly FlowCommand[]): Promise<BatchResult[]>;
  /** 外部事件 */
  signal(input: SignalInput): Promise<RunResult[]>;
  /** 我的待办 */
  todo(): Promise<TodoItem[]>;
  /** 我处理过的 */
  done(filter?: ListFilter): Promise<TodoItem[]>;
  /** 等我指定承办人的 */
  designations(): Promise<TodoItem[]>;
  /** 我发起的 */
  started(filter?: ListFilter): Promise<InstanceRow[]>;
  /** 查单据（我发起的、我经手的；管理员能查全部） */
  search(filter?: InstanceSearch): Promise<ResultPage<InstanceRow>>;
  /** 抄送给我的 */
  cc(): Promise<CcItem[]>;
  /** 实例详情（我经手的；管理员都能看） */
  instance(id: number): Promise<InstanceDetail>;
  /** 待办详情（我能做什么、提交后到哪） */
  workItem(id: number): Promise<WorkItemDetail>;
  /** 发起视图 */
  startView(key: string): Promise<StartView>;
  /** 能发起的流程 */
  processes(): Promise<ProcessDefinition[]>;
  /** 失败的作业（异常） */
  incidents(instance?: number): Promise<Incident[]>;
  /** 抄送标成已读 */
  readCc(instance: number): Promise<number>;
  /** 重试失败的作业 */
  retryJob(job: number): Promise<boolean>;
  /** 发起前的草稿 */
  readonly drafts: {
    save(input: DraftInput): Promise<InstanceRow>;
    list(): Promise<InstanceRow[]>;
    get(id: number): Promise<InstanceRow>;
    discard(id: number): Promise<boolean>;
  };
  /** 工作室（只给管理员）：发布定义或流程工程，校验、类型检查不过是 invalid-definition */
  publish(
    input: ProcessDefinition | FlowProject,
    note?: string,
  ): Promise<{ key: string; version: number }>;
  /** 检查（不发布）：编译、校验、类型检查的结果（只给管理员） */
  check(input: ProcessDefinition | FlowProject): Promise<CheckResult>;
  /** 工作室的版本：全部流程、某个流程的版本、某版的源码、回滚、启停（只给管理员） */
  readonly versions: {
    catalog(): Promise<CatalogEntry[]>;
    list(key: string): Promise<VersionInfo[]>;
    project(key: string, version?: number): Promise<FlowProject>;
    rollback(key: string, version: number): Promise<{ key: string; version: number }>;
    setEnabled(key: string, enabled: boolean): Promise<void>;
  };
  /** 数据变了（任何人执行了命令）：列表、计数跟着刷新；返回取消订阅的函数 */
  onChange(listener: () => void): () => void;
}

/** 经一个传输连到端点 */
export function createFlowClient(transport: FlowTransport): FlowClient {
  async function call<T>(method: string, ...args: unknown[]): Promise<T> {
    // 末尾没给的可选参数不发：JSON 里没有 undefined
    const sent = [...args];
    while (sent.length > 0 && sent.at(-1) === undefined) sent.pop();
    const response = await transport.call({ method, args: stringifyWire(sent) });
    if (response.ok) return parseWireJson<T>(response.value, { reader }) as T;
    const { code, message, details } = response.error;
    throw new FlowError(
      code as FlowErrorCode,
      message,
      parseWireJson<Record<string, unknown>>(details, { reader }) ?? {},
    );
  }
  return {
    run: (command) => call('run', command),
    runMany: (commands) => call('runMany', commands),
    signal: (input) => call('signal', input),
    todo: () => call('todo'),
    done: (filter) => call('done', filter),
    designations: () => call('designations'),
    started: (filter) => call('started', filter),
    search: (filter) => call('search', filter),
    cc: () => call('cc'),
    instance: (id) => call('instance', id),
    workItem: (id) => call('workItem', id),
    startView: (key) => call('startView', key),
    processes: () => call('processes'),
    incidents: (instance) => call('incidents', instance),
    readCc: (instance) => call('readCc', instance),
    retryJob: (job) => call('retryJob', job),
    drafts: {
      save: (input) => call('drafts.save', input),
      list: () => call('drafts.list'),
      get: (id) => call('drafts.get', id),
      discard: (id) => call('drafts.discard', id),
    },
    publish: (input, note) => call('publish', input, note),
    check: (input) => call('check', input),
    versions: {
      catalog: () => call('versions.catalog'),
      list: (key) => call('versions.list', key),
      project: (key, version) => call('versions.project', key, version),
      rollback: (key, version) => call('versions.rollback', key, version),
      setEnabled: (key, enabled) => call('versions.setEnabled', key, enabled),
    },
    onChange: (listener) => transport.subscribe?.(listener) ?? (() => {}),
  };
}

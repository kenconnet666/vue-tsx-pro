/**
 * 页面这一头：建 Worker、经它的客户端用引擎（docs/decisions/0009 第 1、2 节）。启动进度、演示身份、时钟、库里的组织、
 * “数据变了”的版本号是响应式的，整个流程中心共用一份（useFlowCenter）。演示身份与快进过的时钟记在浏览器里，刷新后照旧。
 */
import {
  createFlowClient,
  FlowError,
  portTransport,
  type FlowClient,
  type FlowErrorCode,
} from '@zerodep-dev/flow-ts-engine/client';
import type { EmployeeRow, OrgSnapshot } from '@zerodep-dev/flow-ts-engine/org';
import { markRaw, reactive, readonly } from 'vue';
import { DEFAULT_ACTOR, isAdmin } from '../domain/org';
import {
  isDemoMessage,
  type FromWorker,
  type OrgArgument,
  type OrgMethod,
  type ToWorker,
} from './messages';

/** 流程中心此刻的样子 */
export interface FlowCenterState {
  /** 启动中（第一次打开要建表、写种子）、好了、出错 */
  status: 'loading' | 'ready' | 'error';
  /** 启动的进度 */
  step: string;
  done: number;
  total: number;
  error: string;
  /** 演示身份（员工编号） */
  actor: string;
  /** Worker 报来的组织（整份替换，不深层响应） */
  org: OrgSnapshot | null;
  /** 演示的“现在”与快进了多少毫秒 */
  now: Date;
  offset: number;
  /** 数据变了就加一：页面按它重新取数据 */
  revision: number;
}

/** 流程中心的连接 */
export interface FlowCenter {
  readonly state: Readonly<FlowCenterState>;
  /** 经 Worker 用引擎（以当前演示身份） */
  readonly client: FlowClient;
  /** 当前演示身份是管理员（显示管理入口；真正的权限在引擎里查） */
  admin(): boolean;
  /** 按编号找人；找不到（组织还没到、编号不对）时 undefined */
  person(id: string | null | undefined): EmployeeRow | undefined;
  /** 选人的选项：在职的人，按部门分组，名字后面是职务 */
  people(): readonly PersonOption[];
  /** 换演示身份 */
  setActor(id: string): void;
  /** 维护组织（管理页）：改完 state.org 跟着换；不合规时是 invalid-input 的 FlowError */
  editOrg<M extends OrgMethod>(method: M, argument: OrgArgument<M>): Promise<void>;
  /** 时钟往后拨几小时（演示超时、提醒、定时作业） */
  advance(hours: number): void;
  /** 删掉演示数据重来 */
  reset(): void;
}

/** 选人的一项 */
export interface PersonOption {
  readonly value: string;
  readonly label: string;
  readonly group: string;
}

const STORAGE_KEY = 'flow-center';

function remembered(): { actor?: string; offset?: number } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      actor?: string;
      offset?: number;
    };
  } catch {
    return {};
  }
}

function remember(state: FlowCenterState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ actor: state.actor, offset: state.offset }));
  } catch {
    // 无痕窗口、禁了存储：只是刷新后回到默认身份
  }
}

let center: FlowCenter | undefined;

/** 流程中心的连接（第一次用时建 Worker） */
export function useFlowCenter(): FlowCenter {
  return (center ??= connect());
}

function connect(): FlowCenter {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const client = createFlowClient(portTransport(worker));
  const saved = remembered();
  const state = reactive<FlowCenterState>({
    status: 'loading',
    step: '启动',
    done: 0,
    total: 1,
    error: '',
    actor: saved.actor ?? DEFAULT_ACTOR,
    org: null,
    now: new Date(),
    offset: saved.offset ?? 0,
    revision: 0,
  });
  const send = (message: ToWorker) => worker.postMessage(message);
  let index = new Map<string, EmployeeRow>();
  /** 维护组织的调用：编号 → 等结果的 Promise */
  const calls = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();
  let nextCall = 0;
  let options: PersonOption[] | undefined;

  function setActor(id: string) {
    state.actor = id;
    remember(state);
    send({ demo: 'actor', actor: id });
    state.revision++;
  }

  function people(): readonly PersonOption[] {
    const org = state.org;
    if (!org) return [];
    const departments = new Map(org.departments.map((d) => [d.id, d.name]));
    return (options ??= org.employees
      .filter((e) => e.active)
      .map((e) => ({
        value: e.id,
        label: e.title ? `${e.name}（${e.title}）` : e.name,
        group: departments.get(e.departmentId) ?? '',
      })));
  }

  worker.addEventListener('message', (event: MessageEvent) => {
    if (!isDemoMessage(event.data)) return;
    const message = event.data as FromWorker;
    switch (message.demo) {
      case 'progress':
        Object.assign(state, {
          status: 'loading',
          step: message.step,
          done: message.done,
          total: message.total,
        });
        break;
      case 'org':
        state.org = markRaw(message.org);
        index = new Map(message.org.employees.map((e) => [e.id, e]));
        options = undefined;
        // 记下的身份已不在库里（重置、离职）：回到默认身份
        if (!index.get(state.actor)?.active) setActor(DEFAULT_ACTOR);
        break;
      case 'ready':
      case 'clock':
        Object.assign(state, {
          status: 'ready',
          now: new Date(message.now),
          offset: message.offset,
        });
        remember(state);
        break;
      case 'error':
        Object.assign(state, { status: 'error', error: message.message });
        break;
      case 'orgReply': {
        const pending = calls.get(message.call);
        calls.delete(message.call);
        if (message.error)
          pending?.reject(
            new FlowError(message.error.code as FlowErrorCode, message.error.message),
          );
        else pending?.resolve();
        break;
      }
    }
  });
  client.onChange(() => state.revision++);
  // 演示的时钟跟着真实时间走：每分钟更新一次显示
  setInterval(() => (state.now = new Date(Date.now() + state.offset)), 60_000);
  send({ demo: 'init', actor: state.actor, offset: state.offset });

  return {
    state: readonly(state) as Readonly<FlowCenterState>,
    client,
    // 读一下 state.org：组织换了，用到名字的地方跟着重画
    person: (id) => (state.org && id ? index.get(id) : undefined),
    admin: () => {
      const me = state.org && index.get(state.actor);
      return me ? isAdmin(me) : false;
    },
    people,
    setActor,
    editOrg: (method, argument) =>
      new Promise((resolve, reject) => {
        const call = nextCall++;
        calls.set(call, { resolve, reject });
        send({ demo: 'orgCall', call, method, argument });
      }),
    advance(hours) {
      send({ demo: 'advance', by: hours * 3_600_000 });
    },
    reset() {
      Object.assign(state, {
        status: 'loading',
        step: '删除演示数据',
        done: 0,
        total: 1,
        offset: 0,
      });
      send({ demo: 'reset' });
    },
  };
}

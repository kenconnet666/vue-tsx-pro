/**
 * 页面这一头：建 Worker、经它的客户端用引擎（docs/decisions/0009 第 1、2 节）。启动进度、演示身份、时钟、
 * “数据变了”的版本号是响应式的，整个流程中心共用一份（useFlowCenter）。演示身份与快进过的时钟记在浏览器里，刷新后照旧。
 */
import {
  createFlowClient,
  portTransport,
  type FlowClient,
} from '@zerodep-dev/flow-ts-engine/client';
import { reactive, readonly } from 'vue';
import { PEOPLE, personOf, type Person } from '../domain/org';
import { isDemoMessage, type FromWorker, type ToWorker } from './messages';

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
  /** 当前演示身份 */
  me(): Person;
  /** 换演示身份 */
  setActor(id: string): void;
  /** 时钟往后拨几小时（演示超时、提醒、定时作业） */
  advance(hours: number): void;
  /** 删掉演示数据重来 */
  reset(): void;
}

const STORAGE_KEY = 'flow-center';
/** 第一次打开时的演示身份：林小满（前端组长，有下属的请假要批） */
const DEFAULT_ACTOR = '1003';

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
    actor: personOf(saved.actor) ? saved.actor! : DEFAULT_ACTOR,
    now: new Date(),
    offset: saved.offset ?? 0,
    revision: 0,
  });
  const send = (message: ToWorker) => worker.postMessage(message);

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
    }
  });
  client.onChange(() => state.revision++);
  // 演示的时钟跟着真实时间走：每分钟更新一次显示
  setInterval(() => (state.now = new Date(Date.now() + state.offset)), 60_000);
  send({ demo: 'init', actor: state.actor, offset: state.offset });

  return {
    state: readonly(state) as Readonly<FlowCenterState>,
    client,
    me: () => personOf(state.actor) ?? PEOPLE[0]!,
    setActor(id) {
      state.actor = id;
      remember(state);
      send({ demo: 'actor', actor: id });
      state.revision++;
    },
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

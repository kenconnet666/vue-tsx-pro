/**
 * 端点：客户端的调用在这里落到引擎（docs/decisions/0009 第 2 节）。按方法名分到引擎的命令与查询（只认下面列出的），
 * 由 actor 回调定“我”是谁（浏览器演示里是切换的身份，服务端是会话），客户端传不进身份。
 * 改数据的方法成功后通知订阅的人（传输把它推给页面）。
 *
 *   const endpoint = flowEndpoint(engine, { actor: () => currentUser });
 *   servePort(self, endpoint);                         // Worker 里
 *   app.post('/api/flow', (req) => endpoint.handle(req.body, req));   // 服务端
 */
import { parseWireJson, stringifyWire } from '@zerodep-dev/json-wire';
import { FlowError } from '../core/errors.ts';
import type { FlowEngine } from '../engine.ts';
import type { Actor } from '../types.ts';
import type { FlowRequest, FlowResponse } from './protocol.ts';

/** 端点的选项；C 是传输给的上下文（服务端的请求，Worker 里没有） */
export interface FlowEndpointOptions<C> {
  /** 这次调用是谁 */
  actor: (context: C) => Actor | Promise<Actor>;
}

function requireAdmin(actor: Actor, message: string): void {
  if (!actor.admin) throw new FlowError('forbidden', message);
}

/** 方法名 → 怎么调引擎 */
const METHODS: Readonly<
  Record<string, (engine: FlowEngine, actor: Actor, args: any[]) => Promise<unknown>>
> = {
  run: (e, a, [command]) => e.run(command, a),
  runMany: (e, a, [commands]) => e.runMany(commands, a),
  signal: (e, a, [input]) => e.signal(input, a),
  todo: (e, a) => e.query.todo(a),
  done: (e, a, [filter]) => e.query.done(a, filter),
  designations: (e, a) => e.query.designations(a),
  started: (e, a, [filter]) => e.query.started(a, filter),
  search: (e, a, [filter]) => e.query.search(a, filter),
  cc: (e, a) => e.query.cc(a),
  instance: (e, a, [id]) => e.query.instance(id, a),
  workItem: (e, a, [id]) => e.query.workItem(id, a),
  startView: (e, a, [key]) => e.query.startView(key, a),
  processes: (e) => e.query.processes(),
  // 引擎把“谁能看异常、重试”留给接口层：全部异常与重试只给管理员，一张单的异常要先能看这张单
  incidents: async (e, a, [instance]) => {
    if (instance === undefined) requireAdmin(a, '只有管理员能看全部异常');
    else await e.query.instance(instance, a);
    return e.query.incidents(instance);
  },
  readCc: (e, a, [instance]) => e.readCc(instance, a),
  retryJob: (e, a, [job]) => {
    requireAdmin(a, '只有管理员能重试作业');
    return e.retryJob(job, a);
  },
  'drafts.save': (e, a, [input]) => e.drafts.save(input, a),
  'drafts.list': (e, a) => e.drafts.list(a),
  'drafts.get': (e, a, [id]) => e.drafts.get(id, a),
  'drafts.discard': (e, a, [id]) => e.drafts.discard(id, a),
  'notifications.list': (e, a, [filter]) => e.notifications.list(a, filter),
  'notifications.unread': (e, a) => e.notifications.unread(a),
  'notifications.read': (e, a, [ids]) => e.notifications.read(a, ids),
  // 工作室（只给管理员）：发布、版本、启停；源码只给管理员看
  publish: (e, a, [input, note]) => {
    requireAdmin(a, '只有管理员能发布流程');
    return e.publish(input, { actor: a, ...(note ? { note } : {}) });
  },
  check: (e, a, [input]) => {
    requireAdmin(a, '只有管理员能检查流程');
    return e.check(input);
  },
  'versions.catalog': (e, a) => {
    requireAdmin(a, '只有管理员能看全部流程');
    return e.versions.catalog();
  },
  'versions.list': (e, a, [key]) => {
    requireAdmin(a, '只有管理员能看版本');
    return e.versions.list(key);
  },
  'versions.project': (e, a, [key, version]) => {
    requireAdmin(a, '只有管理员能看流程的源码');
    return e.versions.project(key, version);
  },
  'versions.rollback': (e, a, [key, version]) => {
    requireAdmin(a, '只有管理员能回滚');
    return e.versions.rollback(key, version, { actor: a });
  },
  'versions.migrationPreview': (e, a, [key, version]) => {
    requireAdmin(a, '只有管理员能迁移版本');
    return e.versions.migrationPreview(key, version);
  },
  'versions.setEnabled': (e, a, [key, enabled]) => {
    requireAdmin(a, '只有管理员能启停流程');
    return e.versions.setEnabled(key, enabled);
  },
};

/** 改数据的方法：成功后通知 */
const MUTATIONS: ReadonlySet<string> = new Set([
  'run',
  'runMany',
  'signal',
  'readCc',
  'retryJob',
  'drafts.save',
  'drafts.discard',
  'notifications.read',
  'publish',
  'versions.rollback',
  'versions.setEnabled',
]);

/** 端点 */
export interface FlowEndpoint<C = void> {
  /** 处理一次调用 */
  handle(request: FlowRequest, context: C): Promise<FlowResponse>;
  /** 订阅数据变了；返回取消订阅的函数 */
  onChange(listener: () => void): () => void;
  /** 数据在别处变了（作业、时钟快进）：通知订阅的人 */
  changed(): void;
}

/** 建端点 */
export function flowEndpoint<C = void>(
  engine: FlowEngine,
  options: FlowEndpointOptions<C>,
): FlowEndpoint<C> {
  const listeners = new Set<() => void>();
  const changed = () => {
    for (const listener of listeners) listener();
  };
  return {
    async handle(request, context) {
      const method = METHODS[request.method];
      if (!method) {
        return failure(new FlowError('invalid-input', `没有方法 ${request.method}`));
      }
      try {
        const actor = await options.actor(context);
        const args = parseWireJson<unknown[]>(request.args) ?? [];
        const value = await method(engine, actor, args);
        if (MUTATIONS.has(request.method)) changed();
        return { ok: true, value: stringifyWire(value ?? null) };
      } catch (error) {
        return failure(error);
      }
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    changed,
  };
}

/** 错误编成响应：引擎的错误带 code 与 details，别的错误一律 internal（不把内部信息之外的东西带出去） */
function failure(error: unknown): FlowResponse {
  if (error instanceof FlowError) {
    return {
      ok: false,
      error: { code: error.code, message: error.message, details: stringifyWire(error.details) },
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: { code: 'internal', message, details: '{}' } };
}

/**
 * 编译线程池：冷启动、构建时几百个模块同时等编译，Babel 在主线程上只能一个个来。
 * 每个线程加载一份编译器（compile-worker.ts），请求按空闲分派；线程用到时才启动，最多 size 个。
 */
import { Worker } from 'node:worker_threads';
import type { CompilerSetup, ModuleRequest, ModuleResult } from './module.ts';

interface Job {
  request: ModuleRequest;
  resolve: (result: ModuleResult | null) => void;
  reject: (error: Error) => void;
}

/** 编译线程的入口：仓库内按源码运行时是 .ts（Node 去掉类型），发布包里是构建出的 .js */
const WORKER = new URL(
  import.meta.url.endsWith('.ts') ? './compile-worker.ts' : './compile-worker.js',
  import.meta.url,
);

/** 编译线程池；设置要能在线程之间复制（见 module.ts） */
export class CompilePool {
  private readonly setup: CompilerSetup;
  private readonly size: number;
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Job[] = [];
  private running = new Map<number, Job & { worker: Worker }>();
  private nextId = 0;

  constructor(setup: CompilerSetup, size: number) {
    this.setup = setup;
    this.size = size;
  }

  /** 在某个线程里编译一个模块 */
  run(request: ModuleRequest): Promise<ModuleResult | null> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.dispatch();
    });
  }

  /**
   * 先起 count 个线程（不超过上限）：线程启动时载入编译器（Babel 与各插件，约 1–2 秒），
   * 开发服务器就绪后就在后台载入，浏览器第一次请求时不用再等
   */
  warm(count: number) {
    while (this.workers.length < Math.min(count, this.size)) this.idle.push(this.spawn());
  }

  /**
   * 停掉线程（构建结束、服务器关闭）：空闲的马上停，正在编译的做完手上这个再停。
   * 多环境构建（客户端、服务端）每个环境结束都会调用；直接停掉正在编译的线程，它手上的请求永远等不到结果。
   * 之后再有请求时照常起新线程
   */
  close() {
    for (const worker of this.idle) void worker.terminate();
    const busy = new Set([...this.running.values()].map((job) => job.worker));
    for (const worker of busy) this.retiring.add(worker);
    this.workers = this.workers.filter((worker) => busy.has(worker));
    this.idle = [];
  }

  /** 关闭时还在编译、做完就停的线程 */
  private retiring = new Set<Worker>();

  private dispatch() {
    while (this.queue.length) {
      const worker =
        this.idle.pop() ?? (this.workers.length < this.size ? this.spawn() : undefined);
      if (!worker) return;
      const job = this.queue.shift()!;
      const id = this.nextId++;
      this.running.set(id, { ...job, worker });
      worker.postMessage({ id, request: job.request });
    }
  }

  private spawn() {
    const worker = new Worker(WORKER, { workerData: this.setup });
    // 不拖住进程退出；正常情况下由 close 停掉
    worker.unref();
    worker.on(
      'message',
      ({ id, result, error }: { id: number; result?: ModuleResult | null; error?: Error }) => {
        const job = this.running.get(id)!;
        this.running.delete(id);
        if (this.retiring.delete(worker)) {
          this.workers = this.workers.filter((item) => item !== worker);
          void worker.terminate();
        } else this.idle.push(worker);
        if (error) job.reject(Object.assign(new Error(error.message), error));
        else job.resolve(result ?? null);
        this.dispatch();
      },
    );
    worker.on('error', (error) => {
      // 线程意外退出：它手上的请求失败，线程从池里去掉，之后的请求由其他线程（或新线程）处理
      for (const [id, job] of this.running) {
        if (job.worker !== worker) continue;
        this.running.delete(id);
        job.reject(error);
      }
      this.workers = this.workers.filter((item) => item !== worker);
      this.idle = this.idle.filter((item) => item !== worker);
      this.dispatch();
    });
    this.workers.push(worker);
    return worker;
  }
}

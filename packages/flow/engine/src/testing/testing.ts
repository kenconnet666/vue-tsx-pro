/**
 * 测试用的引擎（docs/decisions/0001 第 8 节）：PGlite（进程内的 PostgreSQL，Node 与浏览器都能跑）、建好表、假时钟。
 * 单元测试与设计器的试运行共用。
 *
 *   const { engine, clock } = await createTestEngine({ extensions });
 *   await engine.publish(purchase);
 *   clock.advance({ hours: 3 });
 *   await engine.jobs.runDue();
 */
import { PGlite } from '@electric-sql/pglite';
import type { Adapter } from '@zerodep-dev/easy-query-ts';
import { pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import { flowSchema } from '../core/entities.ts';
import { createFlowEngine, type FlowEngine } from '../engine.ts';
import type { FlowEngineOptions } from '../types.ts';

/** 可以拨的时钟 */
export interface TestClock {
  now: () => Date;
  /** 拨到某一刻 */
  set(at: Date | string): void;
  /** 往后拨 */
  advance(by: { days?: number; hours?: number; minutes?: number }): void;
}

/** 假时钟：从 start 开始，只在 set、advance 时变 */
export function createTestClock(start: Date | string = '2026-01-05T09:00:00Z'): TestClock {
  let current = new Date(start);
  return {
    now: () => new Date(current),
    set: (at) => {
      current = new Date(at);
    },
    advance: ({ days = 0, hours = 0, minutes = 0 }) => {
      current = new Date(current.getTime() + ((days * 24 + hours) * 60 + minutes) * 60_000);
    },
  };
}

/** 共用的 PGlite：启动要一两秒，清空只要几毫秒，所以一个进程（标签页）只启动一个 */
let shared: PGlite | undefined;

/**
 * 测试用的引擎：假时钟，库默认是共用的 PGlite、每次清空重建（同一时刻只用一个测试引擎；试运行自己排队）。
 * 给了 adapter（实库）时先删掉引擎的表再建，每次都是空的
 */
export async function createTestEngine(
  options: Omit<FlowEngineOptions, 'adapter' | 'clock'> & {
    start?: Date | string;
    adapter?: Adapter;
  } = {},
): Promise<{ engine: FlowEngine; clock: TestClock }> {
  const clock = createTestClock(options.start);
  const engine = createFlowEngine({
    ...options,
    adapter: options.adapter ?? pglite((shared ??= new PGlite())),
    clock: clock.now,
  });
  if (options.adapter) {
    for (const entity of Object.values(flowSchema.entities)) {
      await engine.db.sql.execute`DROP TABLE IF EXISTS ${engine.db.sql.ident(entity.table)}`;
    }
  } else {
    await engine.db.sql.execute`DROP SCHEMA IF EXISTS public CASCADE`;
    await engine.db.sql.execute`CREATE SCHEMA public`;
  }
  await engine.createTables();
  return { engine, clock };
}

export {
  simulate,
  type OpenItem,
  type SimulationInput,
  type SimulationResult,
  type SimulationStep,
} from './simulate.ts';

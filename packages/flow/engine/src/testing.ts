/**
 * 测试用的引擎（docs/decisions/0001 第 8 节）：SQLite 内存库、建好表、假时钟。单元测试与设计器的试运行共用。
 *
 *   const { engine, clock } = await createTestEngine({ extensions });
 *   await engine.publish(purchase);
 *   clock.advance({ hours: 3 });
 *   await engine.jobs.runDue();
 */
import { DatabaseSync } from 'node:sqlite';
import { sqlite } from '@zerodep-dev/easy-query-ts-sqlite';
import { createFlowEngine, type FlowEngine } from './engine.ts';
import type { FlowEngineOptions } from './types.ts';

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

/** 测试用的引擎：内存库、建好表、假时钟 */
export async function createTestEngine(
  options: Omit<FlowEngineOptions, 'adapter' | 'clock'> & { start?: Date | string } = {},
): Promise<{ engine: FlowEngine; clock: TestClock }> {
  const clock = createTestClock(options.start);
  const engine = createFlowEngine({
    ...options,
    adapter: sqlite(new DatabaseSync(':memory:')),
    clock: clock.now,
  });
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

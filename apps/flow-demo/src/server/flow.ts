/**
 * 示例的流程引擎（只在服务端）：node:sqlite 的库（FLOW_DB 指文件，不写时是内存库，重启就清空），启动时建表、发布流程；
 * 到点的作业（时限、提醒、异步动作）由 flowModule 在服务端启动时开始做（ROADMAP 14.7、15.3）
 */
import { DatabaseSync } from 'node:sqlite';
import { sqlite } from '@zerodep-dev/easy-query-ts-sqlite';
import { createFlowEngine } from '@zerodep-dev/flow-ts-engine';
import type { KitModule } from '@zerodep-dev/vue-tsx-pro-kit/server';
import { processes } from '../processes.ts';
import { USERS } from './context.ts';

export const engine = createFlowEngine({
  adapter: sqlite(new DatabaseSync(process.env.FLOW_DB ?? ':memory:')),
  admins: ['admin'],
  org: {
    members: (source) =>
      'role' in source
        ? Object.values(USERS)
            .filter((user) => user.roles?.includes(source.role))
            .map((user) => user.id)
        : [],
  },
});

await engine.createTables();
for (const definition of processes) await engine.publish(definition);

/**
 * 流程引擎这一块的框架模块：启动时开始做到点的作业（每 10 秒），多实例部署时各进程靠作业表上的抢占不会重复做
 */
export const flowModule: KitModule = {
  name: 'flow',
  start() {
    const timer = setInterval(() => {
      engine.jobs.runDue().catch((error: unknown) => console.error('流程作业出错', error));
    }, 10_000);
    timer.unref();
  },
};

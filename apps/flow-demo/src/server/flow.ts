/**
 * 示例的流程引擎（只在服务端）：PGlite 的库（FLOW_DB 指数据目录，不写时是内存库，重启就清空），启动时建表、发布流程；
 * 到点的作业（时限、提醒、异步动作）由 flowModule 在服务端启动时开始做（ROADMAP 14.7、15.3）
 */
import { PGlite } from '@electric-sql/pglite';
import { pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import { createFlowEngine } from '@zerodep-dev/flow-ts-engine';
import type { KitModule } from '@zerodep-dev/vue-tsx-pro-kit/server';
import { processes } from '../processes.ts';
import { USERS } from './context.ts';

export const engine = createFlowEngine({
  adapter: pglite(new PGlite(process.env.FLOW_DB)),
  admins: ['admin'],
  // 付款流程的自动动作：推送到 ERP。示例里单笔超过 10 万时 ERP 拒收，作业失败进“异常作业”，管理员重试或跳过
  extensions: {
    actions: {
      pushToErp: ({ variables }) => {
        if (Number(variables['amount']) > 100_000) throw new Error('ERP 拒收：单笔超过 10 万');
      },
    },
  },
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

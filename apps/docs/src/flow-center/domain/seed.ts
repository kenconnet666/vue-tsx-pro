/**
 * 演示数据：第一次打开时按时钟往前推着写进去——几天前发起、有人处理过、有的超时、有的付款失败进了异常、有的等着选采购员。
 * 切换演示身份就能看到各人的待办：林小满、周启航（上级）、孙悦（财务）、何静（销售总监）、顾承远（总经理）、
 * 袁清（法务，会签到一半的合同）。
 */
import type { Actor, FlowCommand, FlowEngine, TodoItem } from '@zerodep-dev/flow-ts-engine';

/** 写种子时拨时钟：回到几天前的某个钟点 */
export type TimeTravel = (daysAgo: number, hour?: number) => void;

/** 一条种子：说明（进度里显示）与做法 */
interface SeedStep {
  readonly label: string;
  readonly run: (helpers: SeedHelpers) => Promise<void>;
}

interface SeedHelpers {
  readonly at: TimeTravel;
  /** 以某人的身份发起，返回实例编号 */
  readonly start: (
    by: string,
    process: string,
    variables: Record<string, unknown>,
  ) => Promise<number>;
  /** 跑到点的作业（异步的调用流程、推 ERP） */
  readonly runJobs: () => Promise<void>;
  /** 某人待办里第一份这样的（找子流程这类不知道编号的实例），返回实例编号 */
  readonly find: (by: string, match: (item: TodoItem) => boolean) => Promise<number>;
  /** 以某人的身份处理这个实例在他名下（或他能认领）的待办 */
  readonly act: (
    by: string,
    instance: number,
    outcome: string,
    extra?: Partial<Extract<FlowCommand, { type: 'complete' }>>,
  ) => Promise<void>;
}

const STEPS: readonly SeedStep[] = [
  {
    label: '陈晓请年假，等林小满审批',
    run: async ({ at, start }) => {
      at(1, 10);
      await start('1005', 'leave', {
        kind: '年假',
        days: '2',
        from: '2026-11-12',
        to: '2026-11-13',
        reason: '回老家参加婚礼',
        handover: [{ id: '1006', type: 'user', name: '许知意' }],
      });
    },
  },
  {
    label: '韩东请 5 天事假，周启航已同意，等沈若水',
    run: async ({ at, start, act }) => {
      at(3, 9);
      const id = await start('1007', 'leave', {
        kind: '事假',
        days: '5',
        from: '2026-11-17',
        to: '2026-11-21',
        reason: '家里装修，需要盯工',
      });
      at(3, 14);
      await act('1004', id, 'approve', { comment: '安排好交接' });
    },
  },
  {
    label: '魏然请病假，已经走完',
    run: async ({ at, start, act }) => {
      at(9, 9);
      const id = await start('1009', 'leave', {
        kind: '病假',
        days: '1',
        from: '2026-10-30',
        to: '2026-10-30',
        reason: '发烧',
      });
      at(9, 11);
      await act('1002', id, 'approve');
      at(8, 10);
      await act('1014', id, 'approve');
    },
  },
  {
    label: '杨柳请调休，赵一鸣两天没处理（超时）',
    run: async ({ at, start }) => {
      at(4, 16);
      await start('1014', 'leave', {
        kind: '调休',
        days: '1',
        from: '2026-11-10',
        to: '2026-11-10',
        reason: '周末加班调休',
      });
    },
  },
  {
    label: '苏念报销上海出差，周启航已同意，在财务的收件箱',
    run: async ({ at, start, act }) => {
      at(2, 10);
      const id = await start('1008', 'expense', {
        title: '上海客户现场部署',
        city: '上海',
        from: '2026-11-03',
        to: '2026-11-05',
        lines: [
          { item: '高铁往返', on: '2026-11-03', cost: '1106.00' },
          { item: '酒店两晚', on: '2026-11-04', cost: '1380.00' },
          { item: '市内交通', on: '2026-11-05', cost: '214.50' },
        ],
        amount: '2700.50',
      });
      at(2, 15);
      await act('1004', id, 'approve');
    },
  },
  {
    label: '许知意报销深圳展会，付款时 ERP 拒收（异常）',
    run: async ({ at, start, act }) => {
      at(6, 9);
      const id = await start('1006', 'expense', {
        title: '深圳电子展参展',
        city: '深圳',
        from: '2026-10-27',
        to: '2026-10-30',
        lines: [
          { item: '展位费', on: '2026-10-27', cost: '18000.00' },
          { item: '机票', on: '2026-10-27', cost: '3200.00' },
          { item: '酒店', on: '2026-10-28', cost: '3600.00' },
        ],
        amount: '24800.00',
      });
      at(6, 11);
      await act('1003', id, 'approve');
      at(5, 10);
      await act('1011', id, 'approve', { variables: { approved: '24800.00' } });
      at(5, 15);
      await act('1001', id, 'approve', { comment: '展会效果好，同意' });
    },
  },
  {
    label: '吕晨申请采购演示机，等何静审批并选采购员',
    run: async ({ at, start }) => {
      at(1, 15);
      await start('1019', 'purchase', {
        title: '客户演示用笔记本',
        supplier: 'huadong',
        items: [{ material: '笔记本电脑 14 寸', quantity: 3, price: '6999.00' }],
        amount: '20997.00',
        needBy: '2026-11-20',
        reason: '华东区客户演示',
      });
    },
  },
  {
    label: '施雨申请采购展厅设备（8 万），何静已同意，等总经理',
    run: async ({ at, start, act }) => {
      at(2, 9);
      const id = await start('1020', 'purchase', {
        title: '展厅大屏与音响',
        supplier: 'huanan',
        items: [
          { material: '86 寸会议大屏', quantity: 2, price: '32000.00' },
          { material: '会议音响套装', quantity: 1, price: '16000.00' },
        ],
        amount: '80000.00',
        needBy: '2026-12-01',
      });
      at(2, 16);
      await act('1018', id, 'approve', { comment: '年底客户活动要用' });
    },
  },
  {
    label: '郑可提交年度维保合同（36 万），吴昊已同意、蒋律已会签，等袁清会签与财务审核',
    run: async ({ at, start, act }) => {
      at(2, 10);
      const id = await start('1016', 'contract', {
        title: '2027 年度设备维保',
        counterparty: '华东数码',
        amount: '360000.00',
        signOn: '2026-11-20',
        plans: [
          { label: '维保首付款', amount: '108000.00', due: '2026-12-01' },
          { label: '维保尾款', amount: '252000.00', due: '2027-06-30' },
        ],
      });
      at(2, 15);
      await act('1015', id, 'approve');
      at(1, 11);
      await act('1021', id, 'approve', { comment: '违约条款已按模板改过' });
    },
  },
  {
    label:
      '冯远的软件许可合同（6 万）已生效：两期付款自动发起，首付推了 ERP、等银行回单，尾款等财务',
    run: async ({ at, start, act, runJobs, find }) => {
      at(6, 9);
      const id = await start('1017', 'contract', {
        title: '设计软件三年许可',
        counterparty: '北方办公',
        amount: '60000.00',
        signOn: '2026-11-03',
        plans: [
          { label: '软件许可首付', amount: '30000.00', due: '2026-11-10' },
          { label: '软件许可尾款', amount: '30000.00', due: '2027-11-10' },
        ],
      });
      at(6, 14);
      await act('1015', id, 'approve');
      at(5, 10);
      await act('1021', id, 'approve');
      await act('1022', id, 'approve');
      await act('1011', id, 'approve');
      at(4, 16);
      await act('1022', id, 'approve', { comment: '原件已归档' });
      // 调用付款是异步的：作业跑了才有两张付款单
      await runJobs();
      at(3, 10);
      const first = await find('1012', (t) => t.title?.includes('首付') ?? false);
      await act('1012', first, 'approve');
    },
  },
];

/** 写演示数据；progress 报到第几条 */
export async function seed(
  engine: FlowEngine,
  {
    actor,
    at,
    progress,
  }: {
    /** 引擎眼里的这个人（从库里的组织读） */
    actor: (id: string) => Promise<Actor>;
    at: TimeTravel;
    progress: (label: string, done: number, total: number) => void;
  },
): Promise<void> {
  const helpers: SeedHelpers = {
    at,
    runJobs: async () => {
      await engine.jobs.runDue();
    },
    async find(by, match) {
      const item = (await engine.query.todo(await actor(by))).find(match);
      if (!item) throw new Error(`种子：${by} 的待办里没有要找的那份`);
      return item.instanceId;
    },
    async start(by, process, variables) {
      const result = await engine.run({ type: 'start', process, variables }, await actor(by));
      return result.instance.id;
    },
    async act(by, instance, outcome, extra = {}) {
      const who = await actor(by);
      const item = (await engine.query.todo(who)).find((t) => t.instanceId === instance);
      if (!item) throw new Error(`种子：${by} 在实例 ${instance} 上没有待办`);
      await engine.run({ type: 'complete', workItem: item.id, outcome, ...extra }, who);
    },
  };
  for (const [index, step] of STEPS.entries()) {
    progress(step.label, index, STEPS.length);
    await step.run(helpers);
  }
}

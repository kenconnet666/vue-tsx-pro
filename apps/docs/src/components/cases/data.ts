// 降本管理案例共用的虚构数据：主数据（人员、团队、型号、工作包、供应商）与一批任务卡。字段、状态与口径按《需求定义方案》
// 的任务卡与一本账；名称都是虚构的。按序号确定地生成（不用随机数），每次打开都一样，截图与测试才稳定
import { createStatusMap } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { shallowRef } from 'vue';

/** 人员（联络人、主办责任人） */
export const people = [
  { value: 'E10732', label: '林小满', description: '复合材料中心 · 结构设计' },
  { value: 'E20418', label: '周一航', description: '制造工程部 · 工艺' },
  { value: 'E31056', label: '陈默', description: '采购部 · 供应商管理' },
  { value: 'E40287', label: '许悠', description: 'PEMO · 计划' },
  { value: 'E50913', label: '王晴', description: '成本团队 · 测算' },
];

/** 当前用户：林小满（产品团队，任务的主办责任人） */
export const CURRENT_USER = 'E10732';

/** 提出单位 */
export const orgs = ['总装制造中心', '复合材料中心', '制造工程部', '采购部'];

/** 责任一级团队与编码里的缩写 */
export const teams = ['总体技术集成团队', '复合材料结构集成团队', '起落架液压系统集成团队'];
const teamCodes = ['ZT', 'FC', 'QY'];

/** 型号与工作包 */
export const models = ['机型 A', '机型 B'];
export const workPackages = ['平尾', '机身', '舱门', '客舱', '起落架', '机电'];

/** 供应商 */
export const suppliers = ['供应商甲', '供应商乙', '供应商丙', '供应商丁'];

/** 任务类别 */
export const categories = [
  { value: 'design', label: '设计优化' },
  { value: 'source', label: '多货源' },
  { value: 'process', label: '工艺优化' },
];

/** 任务来源（单机降本主表的任务来源字典） */
export const sources = [
  { value: 'supplier', label: '供应商建议', description: '渠道一：供应商提交的降本建议' },
  { value: 'team', label: '项目团队方案', description: '渠道二：PEMO 派单、产品团队出方案' },
  { value: 'review', label: '年度成本评审', description: '成本团队在评审中识别' },
];

/** 来源渠道：任务从哪条渠道汇入任务池 */
export const channels = [
  { value: 'one', label: '渠道一', description: '供应商建议' },
  { value: 'two', label: '渠道二', description: '项目团队方案' },
];

/** 任务状态：八个正常状态按流程先后，后三个是异常状态（options() 的顺序就是这个顺序） */
export const taskStatuses = createStatusMap({
  pending: { label: '待启动', tone: 'neutral' },
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'info' },
  awaiting: { label: '待认定', tone: 'warning' },
  confirmed: { label: '已认定', tone: 'accent' },
  negotiating: { label: '商务洽谈中', tone: 'warning' },
  realized: { label: '已兑现', tone: 'success' },
  closed: { label: '关闭', tone: 'neutral' },
  paused: { label: '暂停', tone: 'neutral' },
  terminated: { label: '终止', tone: 'danger' },
  unpriced: { label: '挂账待定', tone: 'warning' },
});

/** 状态分组：任务池的页签、统计看板矩阵的行，两处一致，点矩阵的格子跳到对应的页签 */
export const statusGroups = [
  { value: 'doing', label: '执行中', statuses: ['pending', 'designing', 'verifying'] },
  { value: 'awaiting', label: '待认定', statuses: ['awaiting'] },
  { value: 'business', label: '商务中', statuses: ['confirmed', 'negotiating'] },
  { value: 'realized', label: '已兑现', statuses: ['realized'] },
  { value: 'closed', label: '已关闭', statuses: ['closed'] },
  { value: 'abnormal', label: '异常', statuses: ['paused', 'terminated', 'unpriced'] },
] as const;

/** 正常流程里的先后（异常状态不在里面） */
const FLOW = [
  'pending',
  'designing',
  'verifying',
  'awaiting',
  'confirmed',
  'negotiating',
  'realized',
  'closed',
];
/** 已经走到 status 这一步或之后 */
export const reached = (status: string, step: string) =>
  FLOW.indexOf(status) >= FLOW.indexOf(step) && FLOW.includes(status);

/** 收益状态（一本账）：任务池里的任务是预测、承诺、实现三种，加上挂账待定；机会值是渠道里还没评估的建议 */
export const valueStates = createStatusMap({
  forecast: { label: '预测值', tone: 'info' },
  committed: { label: '承诺值', tone: 'accent' },
  realized: { label: '实现值', tone: 'success' },
  unpriced: { label: '挂账待定', tone: 'warning' },
});

/** 金额口径：三栏分开，不混总数 */
export const amountBases = [
  { value: 'hard', label: '硬节约' },
  { value: 'avoid', label: '成本规避' },
  { value: 'soft', label: '软节约' },
];

/** 差额 D 的归因 */
export const gapReasons = ['供应商让利', '商务条件置换', '原材料价格波动', '测算偏差', '其他'];

/** 任务卡的里程碑：每个任务至少三个，每个都要上传交付证据 */
export interface Milestone {
  label: '方案确定' | '验证完成' | '收益确认';
  /** 完成日期；没完成时为 null */
  done: string | null;
  /** 交付证据的文件名 */
  evidence: string | null;
}

/** 完成形式（主表的字典） */
export const completionForms = ['MI 批准', 'QSL 入册', 'ECP 批准', '文件', '实施'];

/** 本任务经费来源（主表的字典，多选） */
export const fundingSources = [
  { value: 'quality', label: '精品工程' },
  { value: 'easa', label: 'EASA' },
  { value: 'plateau', label: '高原型' },
  { value: 'stretch', label: '加长型' },
];

/**
 * 一张任务卡（任务池里的一行）：信息表的主表字段（降本项目）加上任务池的管理字段（状态、里程碑、收益）。
 * 主表字段在“降本项目编辑”里维护，管理字段在任务卡详情里推进
 */
export interface CostTask {
  /** 任务编号：DJ（单机降本）或 DMC - 完成年度 - 团队缩写 - 序号 */
  code: string;
  name: string;
  /** 来源渠道（channels 的 value） */
  channel: string;
  /** 关联的建议编号（渠道一）或方案编号（渠道二） */
  sourceCode: string;
  model: string;
  workPackage: string;
  supplier: string;
  /** 任务类别（categories 的 value） */
  category: string;
  team: string;
  /** 主办责任人工号 */
  owner: string;
  /** 降本类型：单机降本（金额是元，按万元显示）或降 DMC（美元 / FH） */
  kind: 'unit' | 'dmc';
  /** 状态（taskStatuses 的 key） */
  status: string;
  /** 收益状态（valueStates 的 key） */
  valueState: string;
  /** 金额口径（amountBases 的 value） */
  basis: string;
  /** 预期收益：建议卡或方案卡上的量级，认定前的预测用它 */
  expected: Decimal;
  /** 测算金额 A：收益认定时锁定；认定前、挂账待定为 null */
  a: Decimal | null;
  /** 商务金额 B：商务谈定后回填 */
  b: Decimal | null;
  /** 差额 D（B − A）的归因 */
  gapReason: string | null;
  /** 计划完成时间（ISO） */
  due: string;
  milestones: Milestone[];
  /** 关闭三材料：验证窗结论、收益认定意见、商务谈定记录 */
  closing: { verification: boolean; benefit: boolean; business: boolean };
  /** 简要描述 */
  description: string;
  /** 提出单位 */
  org: string;
  /** 联络人工号（主表；工号由联络人带出） */
  contact: string;
  /** 必装 / 选装 */
  install: 'required' | 'optional';
  /** 数模编号 + 版本 */
  modelNo: string;
  /** 完成年度 */
  year: string;
  /** 贯彻架次 */
  flights: number | null;
  /** 完成形式（completionForms） */
  form: string;
  /** 是否需要 SB 贯彻航线架次 */
  needSb: boolean;
  /** 本任务经费来源（fundingSources 的 value） */
  funding: string[];
  /** 项目建议书编号 */
  proposalNo: string;
  /** 备注 */
  remark: string;
}

/** 案例里的“今天”：固定下来，超时、到期的天数每次都一样 */
export const TODAY = '2026-10-21';

/** ISO 日期加几天 */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 两个 ISO 日期相差几天（to − from） */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** 已经结束的状态：不再算超时 */
export const isFinished = (task: CostTask) => ['closed', 'terminated'].includes(task.status);

/** 超时天数：过了计划完成时间还没结束的天数；没超时为 0 */
export const overdueDays = (task: CostTask) =>
  isFinished(task) ? 0 : Math.max(0, daysBetween(task.due, TODAY));

/** 能不能关闭：已兑现且三材料齐全 */
export const canClose = (task: CostTask) =>
  task.status === 'realized' && Object.values(task.closing).every(Boolean);

const parts = [
  '平尾翼根整流罩',
  '机身支架',
  '舱门密封件',
  '客舱地板支撑件',
  '线束支架',
  '内饰连接件',
  '货舱门铰链',
  '襟翼滑轨罩',
  '起落架舱口盖',
  '液压管路卡箍',
  'APU 进气格栅',
];

// 越早的阶段任务越多：按这个序列循环取状态
const statusCycle = [
  'pending',
  'designing',
  'designing',
  'designing',
  'verifying',
  'verifying',
  'verifying',
  'awaiting',
  'awaiting',
  'confirmed',
  'negotiating',
  'negotiating',
  'realized',
  'realized',
  'closed',
  'closed',
  'closed',
  'paused',
  'unpriced',
  'terminated',
];

/** 第 index 项任务（确定地生成） */
function task(index: number): CostTask {
  const part = parts[index % parts.length]!;
  const category = categories[index % categories.length]!;
  const status = statusCycle[(index * 7) % statusCycle.length]!;
  const kind = index % 4 === 1 ? 'dmc' : 'unit';
  const teamIndex = index % teams.length;
  const year = String(2026 + (index % 5 === 0 ? 1 : 0));
  const channel = index % 3 === 2 ? 'two' : 'one';
  // 单机降本 2 万到 40 万元、精确到分；降 DMC 0.4 到 3.6 美元 / FH
  const expected =
    kind === 'unit'
      ? new Decimal(20_000 + ((index * 7919) % 380_000)).plus(
          new Decimal((index * 37) % 100).div(100),
        )
      : new Decimal(0.4 + (index % 9) * 0.4).toDecimalPlaces(2);
  const confirmed = reached(status, 'confirmed');
  const a = confirmed ? expected.times(0.92 + (index % 5) * 0.03).toDecimalPlaces(2) : null;
  const b =
    reached(status, 'realized') && a ? a.times(0.88 + (index % 7) * 0.03).toDecimalPlaces(2) : null;
  const done = (step: string, offset: number) =>
    reached(status, step) ? addDays(TODAY, -offset) : null;
  const evidence = ['方案评审纪要.pdf', '验证窗结论.pdf', '收益认定意见.pdf'];
  return {
    code: `${kind === 'unit' ? 'DJ' : 'DMC'}-${year}-${teamCodes[teamIndex]}-${index + 1}`,
    name: `${part}${category.label}`,
    channel,
    sourceCode: `${channel === 'one' ? 'JY' : 'FA'}-2026-${String(index + 101).padStart(4, '0')}`,
    model: models[index % 4 === 3 ? 1 : 0]!,
    workPackage: workPackages[index % workPackages.length]!,
    supplier: suppliers[(index * 3) % suppliers.length]!,
    category: category.value,
    team: teams[teamIndex]!,
    owner: people[(index * 3) % people.length]!.value,
    kind,
    status,
    // 收益状态与进度是两个维度：商务洽谈中有的已签合同（承诺值），关闭了有的还没完成调价（仍是承诺值）
    valueState:
      status === 'unpriced'
        ? 'unpriced'
        : status === 'closed'
          ? index % 4 === 0
            ? 'committed'
            : 'realized'
          : status === 'realized' || (status === 'negotiating' && index % 3 === 0)
            ? 'committed'
            : 'forecast',
    basis: amountBases[index % 7 === 0 ? 2 : index % 3 === 1 ? 1 : 0]!.value,
    expected,
    a,
    b,
    gapReason: b ? gapReasons[index % gapReasons.length]! : null,
    // 计划完成时间散在“今天”前后两个月里：有超时的、有快到期的
    due: addDays(TODAY, ((index * 17) % 75) - 15),
    milestones: [
      {
        label: '方案确定',
        done: done('verifying', 60),
        evidence: reached(status, 'verifying') ? evidence[0]! : null,
      },
      {
        label: '验证完成',
        done: done('awaiting', 30),
        evidence: reached(status, 'awaiting') ? evidence[1]! : null,
      },
      {
        label: '收益确认',
        done: done('confirmed', 12),
        evidence: reached(status, 'confirmed') ? evidence[2]! : null,
      },
    ],
    closing: {
      verification: reached(status, 'awaiting'),
      benefit: confirmed,
      // 已兑现的任务里有一部分还没上传商务谈定记录：不能关闭
      business: reached(status, 'realized') && index % 3 !== 0,
    },
    description: `${part}${category.label}：减少紧固件与工时，材料降本与工时降本的计算依据见三级项目建议书。`,
    org: orgs[index % orgs.length]!,
    contact: people[(index * 2 + 1) % people.length]!.value,
    install: index % 5 === 4 ? 'optional' : 'required',
    modelNo: `C1H0${(index % 9) + 1}-${5500 + index}-00${(index % 3) + 1} R0${(index % 4) + 1}`,
    year,
    flights: index % 3 === 0 ? null : 20 + (index % 6) * 10,
    form: completionForms[index % completionForms.length]!,
    needSb: kind === 'dmc' && index % 2 === 0,
    funding: index % 4 === 0 ? ['quality', 'easa'] : index % 4 === 1 ? ['plateau'] : [],
    proposalNo: index % 3 === 1 ? `SJ-2026-${String(index + 300).padStart(4, '0')}` : '',
    remark: '',
  };
}

/** 任务池：86 项 */
export const costTasks: readonly CostTask[] = Array.from({ length: 86 }, (_, index) => task(index));

/** 工号 → 姓名 */
export const personName = (id: string) => people.find((person) => person.value === id)?.label ?? id;

/** 类别、来源、渠道的 value → 名称 */
export const labelOf = (list: readonly { value: string; label: string }[], value: string) =>
  list.find((item) => item.value === value)?.label ?? value;

/** 当前用户主办、还没结束的任务，按计划完成时间排 */
export const myTasks = costTasks
  .filter((task) => task.owner === CURRENT_USER && !isFinished(task))
  .toSorted((a, b) => a.due.localeCompare(b.due));

/** 收件箱：流转到当前用户岗位（产品团队）、等着认领或处理的事 */
export const inbox = [
  {
    id: 'm1',
    tone: 'accent',
    title: '建议 JY-2026-0187“整流罩支架材料替代”派到产品团队',
    meta: '技术评估 · 剩 15 个工作日 · 待认领',
    time: '10 分钟前',
  },
  {
    id: 'm2',
    tone: 'warning',
    title: '方案 FA-2026-0142“舱门密封件第二货源”待编制',
    meta: 'PEMO 派单 · 剩 3 个工作日',
    time: '2 小时前',
  },
  {
    id: 'm3',
    tone: 'danger',
    title: '王晴退回了任务 DJ-2026-FC-14 的验证材料',
    meta: '验证窗结论缺少试验报告，请补充后重新提交',
    time: '昨天',
  },
] as const;

/**
 * 任务卡的存储：同一个文档站里的案例页共用（新建、编辑、删除后回到任务池、看板都能看到）；刷新页面回到初始数据
 */
export const taskStore = shallowRef<readonly CostTask[]>(costTasks);

/** 新建或保存一张任务卡（按编号覆盖） */
export function saveTask(task: CostTask): void {
  const index = taskStore.value.findIndex((item) => item.code === task.code);
  taskStore.value =
    index < 0
      ? [task, ...taskStore.value]
      : taskStore.value.map((item, position) => (position === index ? task : item));
}

/** 删除一张任务卡；返回撤销函数（放回原来的位置） */
export function removeTask(code: string): () => void {
  const index = taskStore.value.findIndex((item) => item.code === code);
  const task = taskStore.value[index];
  taskStore.value = taskStore.value.filter((item) => item.code !== code);
  return () => {
    if (!task) return;
    const next = [...taskStore.value];
    next.splice(index, 0, task);
    taskStore.value = next;
  };
}

/** 新任务卡的编号：类型 - 完成年度 - 团队缩写 - 下一个序号 */
export function nextTaskCode(kind: 'unit' | 'dmc', year: string, team: string): string {
  const serial =
    Math.max(...taskStore.value.map((task) => Number(task.code.split('-').at(-1)))) + 1;
  return `${kind === 'unit' ? 'DJ' : 'DMC'}-${year}-${teamCodes[teams.indexOf(team)] ?? 'ZT'}-${serial}`;
}

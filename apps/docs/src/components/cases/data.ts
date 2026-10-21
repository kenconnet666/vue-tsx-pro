// 降本管理案例共用的虚构数据：主数据（人员、团队、型号、工作包、供应商）与一批任务卡。字段、状态与口径按《需求定义方案》
// 的任务卡与一本账；名称都是虚构的。按序号确定地生成（不用随机数），每次打开都一样，截图与测试才稳定
import { createStatusMap, daysBetween, shiftIsoDate } from '@vue-tsx-pro/ui';
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

/** 提出部门：属于提出单位（组织机构树的下一级） */
export const depts: Record<string, string[]> = {
  总装制造中心: ['总装一车间', '计划室'],
  复合材料中心: ['结构设计室', '成型工艺室'],
  制造工程部: ['工艺技术室', '工装室'],
  采购部: ['供应商管理室', '价格室'],
};

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
export const taskFlow = [
  'pending',
  'designing',
  'verifying',
  'awaiting',
  'confirmed',
  'negotiating',
  'realized',
  'closed',
];
/** 关闭、已兑现：节点都完成了 */
const isFinishedStatus = (status: string) => status === 'closed' || status === 'realized';

/** 已经走到 status 这一步或之后 */
export const reached = (status: string, step: string) =>
  taskFlow.indexOf(status) >= taskFlow.indexOf(step) && taskFlow.includes(status);

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

/** 单机降本明细：更改前或更改后的一个零件（单机降本明细表的构型通知单信息） */
export interface PartSide {
  /** 受影响零件的件号 */
  partNo: string;
  /** 供应商件号 */
  supplierPartNo: string;
  /** 单机数量（>0） */
  quantity: number;
  /** 材料是否发生变化 */
  materialChanged: boolean;
  /** 材料牌号、状态、规格、技术条件（材料变化时填） */
  materialGrade: string;
  materialCondition: string;
  materialSpec: string;
  materialStandard: string;
  /** 单件材料定额与定额单位 */
  quota: Decimal;
  quotaUnit: string;
  /** 材料单价（元） */
  materialPrice: Decimal;
  /** 单件工时定额（小时）与费率（元 / 小时） */
  laborHours: Decimal;
  laborRate: Decimal;
}

/** 更改类型 */
export const changeTypes = ['取消', '新增', '换号', '升版'] as const;

/** 一条零件更改：取消只有更改前，新增只有更改后 */
export interface PartChange {
  id: string;
  changeType: (typeof changeTypes)[number];
  before: PartSide | null;
  after: PartSide | null;
}

/** 单机降本明细表：项目信息、零件更改与工程评估 */
export interface UnitDetail {
  /** 构型通知单编号（可多个） */
  notices: string[];
  /** 项目描述与项目优化内容 */
  projectDescription: string;
  optimization: string;
  /** 是否双定点 */
  dualSource: boolean;
  /** 工程责任人工号 */
  engineer: string;
  parts: PartChange[];
  /** 工程初步评估：意见、具体原因（暂不具备实施条件、待评估时必填）、类型 */
  evaluation: { opinion: '初步同意' | '暂不具备实施条件' | '待评估'; reason: string; type: string };
}

/** 一个零件的费用：单件材料费、工时费、单件价格（材料费 + 工时费）、单机价格（单件价格 × 单机数量），系统计算 */
export function partCost(side: PartSide | null) {
  const zero = new Decimal(0);
  if (!side) return { material: zero, labor: zero, unit: zero, aircraft: zero };
  const material = side.quota.times(side.materialPrice);
  const labor = side.laborHours.times(side.laborRate);
  const unit = material.plus(labor);
  return { material, labor, unit, aircraft: unit.times(side.quantity) };
}

/** 一条更改的收益：单件材料费、工时费、零件收益与单机零件收益（更改前 − 更改后），系统计算 */
export function partSaving(change: PartChange) {
  const before = partCost(change.before);
  const after = partCost(change.after);
  return {
    material: before.material.minus(after.material),
    labor: before.labor.minus(after.labor),
    part: before.unit.minus(after.unit),
    aircraft: before.aircraft.minus(after.aircraft),
  };
}

/** 单机降本：明细里各条更改的单机零件收益之和（元） */
export const unitSaving = (detail: UnitDetail) =>
  detail.parts.reduce((total, change) => total.plus(partSaving(change).aircraft), new Decimal(0));

/** DMC 的一个实施节点（DMC 实施节点信息表）：按完成形式先后排 */
export interface DmcNode {
  /** 完成形式：ECP 批准、MI 批准、QSL 入册、实施…… */
  form: string;
  /** 计划完成日期 */
  due: string;
  /** 实际完成日期；没完成时为 null */
  done: string | null;
  /** 贯彻架次 */
  flights: number | null;
  /** 责任一级团队 */
  team: string;
  /** 是否需要 SB 贯彻航线架次 */
  needSb: boolean;
}

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
  /** 提出部门（属于提出单位） */
  dept: string;
  /** 联络人工号（主表；工号由联络人带出） */
  contact: string;
  /** 必装 / 选装 */
  install: 'required' | 'optional';
  /** 数模编号 + 版本 */
  modelNo: string;
  /** 供应商件号（DMC 主表，可多个） */
  supplierPartNos: string[];
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
  /** 单机降本明细（单机降本）；降 DMC 为 null */
  unitDetail: UnitDetail | null;
  /** DMC 实施节点（降 DMC）；单机降本为空 */
  dmcNodes: DmcNode[];
}

/**
 * 两种降本类型：名称、编码列的表头、金额的单位与格式（显示与输入共用）。
 * 单机降本存的是元、按万元显示；降 DMC 是美元 / FH。一个视图里只有一种单位，不混着相加
 */
export const costKinds = {
  unit: {
    label: '单机降本',
    codeHeader: '降本项目编码',
    unit: '万元',
    format: { scale: 10_000, minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
  dmc: {
    label: '降 DMC',
    codeHeader: '项目编码',
    unit: '美元/FH',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
} as const;

/** 案例里的“今天”：固定下来，超时、到期的天数每次都一样 */
export const TODAY = '2026-10-21';

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

// 两两一组：原材料与可以替换的更便宜的材料
const materials = [
  { grade: '7050-T7451', spec: '厚 40 mm 板材', price: 860, unit: 'kg' },
  { grade: '2024-T351', spec: '厚 25 mm 板材', price: 520, unit: 'kg' },
  { grade: 'T700/环氧', spec: '预浸料', price: 1280, unit: 'm²' },
  { grade: 'T300/环氧', spec: '预浸料', price: 960, unit: 'm²' },
];

/**
 * 第 index 项任务的一条零件更改：更改后定额少两成、工时少三成，换号的有三分之一同时换成更便宜的材料。
 * 单件几千到一万多元、单机数量 2 到 8 件，一项任务一到三条：单机零件收益合计约 1 到 40 万元
 */
function partChange(index: number, position: number, partBase: number): PartChange {
  const seed = index + position;
  const changeType = changeTypes[seed % 4 === 0 ? 3 : 2]!;
  const pair = (seed % 2) * 2;
  const materialChanged = changeType === '换号' && seed % 3 === 0;
  const materialBefore = materials[pair]!;
  const materialAfter = materials[materialChanged ? pair + 1 : pair]!;
  const quantity = 2 + (seed % 4) * 2;
  const side = (
    partNo: string,
    material: (typeof materials)[number],
    quota: number,
    hours: number,
  ): PartSide => ({
    partNo,
    supplierPartNo: `S${partNo}`,
    quantity,
    materialChanged,
    materialGrade: material.grade,
    materialCondition: '退火态',
    materialSpec: material.spec,
    materialStandard: 'Q/AVIC 2026',
    quota: new Decimal(quota).toDecimalPlaces(2),
    quotaUnit: material.unit,
    materialPrice: new Decimal(material.price),
    laborHours: new Decimal(hours).toDecimalPlaces(1),
    laborRate: new Decimal(280),
  });
  const quota = 12 + ((index * 7 + position * 3) % 13) * 4;
  const hours = 20 + ((index * 5 + position) % 9) * 7.5;
  const before = side(
    `C1H0${partBase}-${5500 + index}-${101 + position}`,
    materialBefore,
    quota,
    hours,
  );
  return {
    id: `${index}-${position}`,
    changeType,
    before,
    // 换号是新件号，升版是同一件号的新版本
    after: side(
      changeType === '换号'
        ? `C1H0${partBase}-${6500 + index}-${201 + position}`
        : `${before.partNo}A`,
      materialAfter,
      quota * 0.8,
      hours * 0.7,
    ),
  };
}

/** 第 index 项单机降本任务的明细 */
function unitDetail(index: number, part: string): UnitDetail {
  const count = 1 + (index % 3);
  const opinion = index % 9 === 4 ? '待评估' : '初步同意';
  return {
    notices: [
      `GT-2026-${String(index + 400).padStart(4, '0')}`,
      ...(index % 4 === 0 ? [`GT-2026-${String(index + 900).padStart(4, '0')}`] : []),
    ],
    projectDescription: `${part}由两件合并为一件，减少紧固件与装配工时。`,
    optimization: '合并零件、换用更轻的材料、减少机加工序。',
    dualSource: index % 5 === 2,
    engineer: people[(index + 1) % people.length]!.value,
    parts: Array.from({ length: count }, (_, position) =>
      partChange(index, position, (index % 9) + 1),
    ),
    evaluation: {
      opinion,
      reason: opinion === '待评估' ? '需要补充强度校核报告' : '',
      type: index % 3 === 0 ? '降本不降价' : '降本降价',
    },
  };
}

/** 第 index 项降 DMC 任务的实施节点：ECP 批准 → MI 批准 → QSL 入册 → 实施，每 30 天一个 */
function dmcNodes(index: number, status: string, due: string, team: string): DmcNode[] {
  const forms = ['ECP 批准', 'MI 批准', 'QSL 入册', '实施'];
  // 已完成几个节点：随进度推进
  const finished = isFinishedStatus(status)
    ? 4
    : Math.min(3, Math.max(0, taskFlow.indexOf(status)));
  return forms.map((form, position) => {
    const planned = shiftIsoDate(due, { days: (position - 3) * 30 });
    return {
      form,
      due: planned,
      done: position < finished ? shiftIsoDate(planned, { days: (index % 5) - 2 }) : null,
      flights: form === '实施' ? 20 + (index % 6) * 10 : null,
      team,
      needSb: form === '实施' && index % 2 === 0,
    };
  });
}

/** 第 index 项任务（确定地生成） */
function task(index: number): CostTask {
  const part = parts[index % parts.length]!;
  const category = categories[index % categories.length]!;
  const status = statusCycle[(index * 7) % statusCycle.length]!;
  const kind = index % 4 === 1 ? 'dmc' : 'unit';
  const teamIndex = index % teams.length;
  const channel = index % 3 === 2 ? 'two' : 'one';
  // 降 DMC 是每 4 项里的第 2 项：按 index % 4 取会让它们都落在同一个单位，错开一位
  const org = orgs[(index + Math.floor(index / 4)) % orgs.length]!;
  // 单机降本的预期收益由明细算出（各条更改的单机零件收益之和，元）；降 DMC 0.4 到 3.6 美元 / FH
  const detail = kind === 'unit' ? unitDetail(index, part) : null;
  const expected = detail
    ? unitSaving(detail).toDecimalPlaces(2)
    : new Decimal(0.4 + (index % 9) * 0.4).toDecimalPlaces(2);
  // 计划完成时间散在“今天”前后两个月里：有超时的、有快到期的；刚开始的有一半排到明年上半年。
  // 完成年度就是计划完成的年份（编码里的年度）
  const justStarted = ['pending', 'designing'].includes(status) && index % 2 === 0;
  const due = shiftIsoDate(TODAY, { days: ((index * 17) % 75) - 15 + (justStarted ? 150 : 0) });
  const year = due.slice(0, 4);
  const confirmed = reached(status, 'confirmed');
  const a = confirmed ? expected.times(0.92 + (index % 5) * 0.03).toDecimalPlaces(2) : null;
  const b =
    reached(status, 'realized') && a ? a.times(0.88 + (index % 7) * 0.03).toDecimalPlaces(2) : null;
  const done = (step: string, offset: number) =>
    reached(status, step) ? shiftIsoDate(TODAY, { days: -offset }) : null;
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
    // 口径不按 index % 3 取：降 DMC 是每 4 项里的第 2 项，会和团队（index % 3）绑在一起
    basis: amountBases[index % 7 === 0 ? 2 : Math.floor(index / 4) % 4 === 1 ? 1 : 0]!.value,
    expected,
    a,
    b,
    gapReason: b ? gapReasons[index % gapReasons.length]! : null,
    due,
    milestones: [
      {
        label: '方案确定',
        done: done('verifying', 60 + (index % 11)),
        evidence: reached(status, 'verifying') ? evidence[0]! : null,
      },
      {
        label: '验证完成',
        // 待认定的刚验证完 2 到 19 天：认定时限（10 个工作日）有超期的、有快到的
        done: done('awaiting', status === 'awaiting' ? 2 + ((index * 5) % 18) : 30 + (index % 7)),
        evidence: reached(status, 'awaiting') ? evidence[1]! : null,
      },
      {
        label: '收益确认',
        done: done('confirmed', 12 + (index % 5)),
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
    org,
    dept: depts[org]![index % 2]!,
    contact: people[(index * 2 + 1) % people.length]!.value,
    install: index % 5 === 4 ? 'optional' : 'required',
    modelNo: `C1H0${(index % 9) + 1}-${5500 + index}-00${(index % 3) + 1} R0${(index % 4) + 1}`,
    supplierPartNos:
      kind === 'dmc'
        ? [`SP-${5500 + index}-01`, ...(index % 3 === 0 ? [`SP-${5500 + index}-02`] : [])]
        : [],
    year,
    // 降 DMC 的贯彻架次就是“实施”节点的架次
    flights: kind === 'dmc' || index % 3 !== 0 ? 20 + (index % 6) * 10 : null,
    form: completionForms[index % completionForms.length]!,
    needSb: kind === 'dmc' && index % 2 === 0,
    funding: index % 4 === 0 ? ['quality', 'easa'] : index % 4 === 1 ? ['plateau'] : [],
    proposalNo: index % 3 === 1 ? `SJ-2026-${String(index + 300).padStart(4, '0')}` : '',
    remark: '',
    unitDetail: detail,
    dmcNodes: kind === 'dmc' ? dmcNodes(index, status, due, teams[teamIndex]!) : [],
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

/**
 * 把任务推进到 next：完成对应的里程碑、补上金额与关闭材料（演示用的简化规则）。
 * 项目详情的“下一步”与收益认定的“认定并锁定 A”共用
 */
export function advanceTask(task: CostTask, next: string): CostTask {
  const finish = (label: Milestone['label']) =>
    task.milestones.map((item) =>
      item.label === label && !item.done
        ? { ...item, done: TODAY, evidence: `${label}证据.pdf` }
        : item,
    );
  switch (next) {
    case 'verifying':
      return { ...task, status: next, milestones: finish('方案确定') };
    case 'awaiting':
      return {
        ...task,
        status: next,
        milestones: finish('验证完成'),
        closing: { ...task.closing, verification: true },
      };
    case 'confirmed':
      return {
        ...task,
        status: next,
        milestones: finish('收益确认'),
        a: task.a ?? latestEstimate(task),
        closing: { ...task.closing, benefit: true },
      };
    case 'realized': {
      const a = task.a ?? task.expected;
      return {
        ...task,
        status: next,
        valueState: 'committed',
        b: a.times(0.98).toDecimalPlaces(2),
        gapReason: task.gapReason ?? '商务条件置换',
        closing: { ...task.closing, business: true },
        // 兑现时降 DMC 的实施节点都已完成（同生成数据的规则）
        dmcNodes: task.dmcNodes.map((node) => ({ ...node, done: node.done ?? TODAY })),
      };
    }
    case 'closed':
      return { ...task, status: next, valueState: 'realized' };
    default:
      return { ...task, status: next };
  }
}

/** 待认定的项目最新一版测算（V2）的金额：认定时锁定为 A */
export const latestEstimate = (task: CostTask) => task.expected.times(0.97).toDecimalPlaces(2);

/** from 到 to 之间还有几个工作日（不含 from，含 to；to 在 from 之前时为负数）；不算法定节假日 */
export function workdaysBetween(from: string, to: string): number {
  const sign = to >= from ? 1 : -1;
  let count = 0;
  for (let day = from; day !== to;) {
    day = shiftIsoDate(day, { days: sign });
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += sign;
  }
  return count;
}

/** 收益认定的时限：验证完成后 10 个工作日内认定 */
export const CONFIRM_WORKDAYS = 10;

/** 待认定的项目离认定时限还有几个工作日（负数是超期）；还没验证完成时为 null */
export function confirmWorkdaysLeft(task: CostTask): number | null {
  const verified = task.milestones.find((item) => item.label === '验证完成')?.done;
  return verified == null ? null : CONFIRM_WORKDAYS - workdaysBetween(verified, TODAY);
}

/**
 * 一本账上挂的金额：预测值用测算 A（认定前用预期收益），承诺、实现用商务 B（还没谈定用 A）；挂账待定没有金额。
 * 一本账、统计看板都按它算，两处的数一致
 */
export function ledgerAmount(task: CostTask): Decimal | null {
  if (task.valueState === 'unpriced') return null;
  if (task.valueState === 'forecast') return task.a ?? task.expected;
  return task.b ?? task.a ?? task.expected;
}

/** 收益认定的退回记录：退回后任务回到“验证中”，在收益认定的“退回”页签里看原因 */
export interface ConfirmReturn {
  code: string;
  reason: string;
  /** 退回日期 */
  at: string;
}

export const confirmReturns = shallowRef<readonly ConfirmReturn[]>(
  costTasks
    .filter((task) => task.status === 'verifying')
    .slice(0, 3)
    .map((task, index) => ({
      code: task.code,
      reason: [
        '验证窗结论缺少试验报告',
        '测算参数与报价不一致，请复核材料单价',
        '工时定额没有依据',
      ][index]!,
      at: shiftIsoDate(TODAY, { days: -(index * 3 + 2) }),
    })),
);

/** 退回一项：任务回到验证中、验证窗结论作废，记下原因 */
export function returnTask(task: CostTask, reason: string): void {
  saveTask({
    ...task,
    status: 'verifying',
    milestones: task.milestones.map((item) =>
      item.label === '验证完成' ? { ...item, done: null, evidence: null } : item,
    ),
    closing: { ...task.closing, verification: false },
  });
  confirmReturns.value = [{ code: task.code, reason, at: TODAY }, ...confirmReturns.value];
}

/** 机会值：渠道里还没评估、还没进任务池的建议与方案（一本账的“机会值”一栏） */
export interface Opportunity {
  code: string;
  name: string;
  kind: 'unit' | 'dmc';
  channel: string;
  team: string;
  basis: string;
  /** 建议卡上的预期收益量级（单机降本是元，降 DMC 是美元 / FH） */
  expected: Decimal;
}

export const opportunities: readonly Opportunity[] = Array.from({ length: 14 }, (_, index) => {
  const kind = index % 3 === 1 ? 'dmc' : 'unit';
  const channel = index % 2 === 0 ? 'one' : 'two';
  return {
    code: `${channel === 'one' ? 'JY' : 'FA'}-2026-${String(201 + index).padStart(4, '0')}`,
    name: `${parts[(index * 5) % parts.length]}${categories[index % categories.length]!.label}`,
    kind,
    channel,
    team: teams[index % teams.length]!,
    basis: amountBases[index % 4 === 3 ? 1 : index % 7 === 5 ? 2 : 0]!.value,
    expected:
      kind === 'dmc'
        ? new Decimal(0.5 + (index % 5) * 0.3).toDecimalPlaces(2)
        : new Decimal(30_000 + ((index * 48_611) % 220_000)),
  };
});

/** 新任务卡的编号：类型 - 完成年度 - 团队缩写 - 下一个序号 */
export function nextTaskCode(kind: 'unit' | 'dmc', year: string, team: string): string {
  const serial =
    Math.max(...taskStore.value.map((task) => Number(task.code.split('-').at(-1)))) + 1;
  return `${kind === 'unit' ? 'DJ' : 'DMC'}-${year}-${teamCodes[teams.indexOf(team)] ?? 'ZT'}-${serial}`;
}

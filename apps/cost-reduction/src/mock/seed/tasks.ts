/**
 * 假后端的任务池：86 张任务卡、收益认定的退回记录、渠道里的机会。按序号确定地生成（不用随机数），
 * 每次重置都一样，截图与测试才稳定。字段、状态与口径按《需求定义方案》的任务卡与一本账
 */
import { shiftIsoDate } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { TODAY } from '../../domain/clock';
import type { Opportunity } from '../../domain/ledger/value';
import { unitSaving } from '../../domain/task/calc';
import { formatTaskCode } from '../../domain/task/code';
import { reached, taskFlow } from '../../domain/task/status';
import {
  changeTypes,
  type ConfirmReturn,
  type CostTask,
  type DmcNode,
  type PartChange,
  type PartSide,
  type TaskStatus,
  type UnitDetail,
  type ValueState,
} from '../../domain/task/types';
import { masterSeed, taskPeople } from './master';

const { dictionaries, teams, models, workPackages, suppliers, orgs } = masterSeed;
const categories = dictionaries.categories;
const amountBases = dictionaries.amountBases.map((item) => item.value);
const gapReasons = dictionaries.gapReasons.map((item) => item.value);
const completionForms = dictionaries.completionForms.map((item) => item.value);

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
const statusCycle: readonly TaskStatus[] = [
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

const person = (position: number) => taskPeople[position % taskPeople.length]!.id;

/** 关闭、已兑现：节点都完成了 */
const isFinishedStatus = (status: TaskStatus) => status === 'closed' || status === 'realized';

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
    engineer: person(index + 1),
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
function dmcNodes(index: number, status: TaskStatus, due: string, team: string): DmcNode[] {
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

/** 收益状态与进度是两个维度：商务洽谈中有的已签合同（承诺值），关闭了有的还没完成调价（仍是承诺值） */
function valueStateOf(status: TaskStatus, index: number): ValueState {
  if (status === 'unpriced') return 'unpriced';
  if (status === 'closed') return index % 4 === 0 ? 'committed' : 'realized';
  return status === 'realized' || (status === 'negotiating' && index % 3 === 0)
    ? 'committed'
    : 'forecast';
}

/** 第 index 项任务（确定地生成） */
function task(index: number): CostTask {
  const part = parts[index % parts.length]!;
  const category = categories[index % categories.length]!;
  const status = statusCycle[(index * 7) % statusCycle.length]!;
  const kind = index % 4 === 1 ? 'dmc' : 'unit';
  const team = teams[index % teams.length]!;
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
  const done = (step: TaskStatus, offset: number) =>
    reached(status, step) ? shiftIsoDate(TODAY, { days: -offset }) : null;
  const evidence = ['方案评审纪要.pdf', '验证窗结论.pdf', '收益认定意见.pdf'];
  return {
    code: formatTaskCode(kind, year, team.code, index + 1),
    name: `${part}${category.label}`,
    channel,
    sourceCode: `${channel === 'one' ? 'JY' : 'FA'}-2026-${String(index + 101).padStart(4, '0')}`,
    model: models[index % 4 === 3 ? 1 : 0]!,
    workPackage: workPackages[index % workPackages.length]!,
    supplier: suppliers[(index * 3) % suppliers.length]!,
    category: category.value,
    team: team.name,
    owner: person(index * 3),
    kind,
    status,
    valueState: valueStateOf(status, index),
    // 口径不按 index % 3 取：降 DMC 是每 4 项里的第 2 项，会和团队（index % 3）绑在一起
    basis: amountBases[index % 7 === 0 ? 2 : Math.floor(index / 4) % 4 === 1 ? 1 : 0]!,
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
    org: org.name,
    dept: org.depts[index % 2]!,
    contact: person(index * 2 + 1),
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
    dmcNodes: kind === 'dmc' ? dmcNodes(index, status, due, team.name) : [],
  };
}

/** 任务池：86 项 */
export const seedTasks = (): CostTask[] => Array.from({ length: 86 }, (_, index) => task(index));

/** 收益认定的退回记录：验证中的前三项是被退回的 */
export const seedConfirmReturns = (tasks: readonly CostTask[]): ConfirmReturn[] =>
  tasks
    .filter((item) => item.status === 'verifying')
    .slice(0, 3)
    .map((item, index) => ({
      code: item.code,
      reason: [
        '验证窗结论缺少试验报告',
        '测算参数与报价不一致，请复核材料单价',
        '工时定额没有依据',
      ][index]!,
      at: shiftIsoDate(TODAY, { days: -(index * 3 + 2) }),
    }));

/** 机会值：渠道里还没评估、还没进任务池的建议与方案（14 项） */
export const seedOpportunities = (): Opportunity[] =>
  Array.from({ length: 14 }, (_, index) => {
    const kind = index % 3 === 1 ? 'dmc' : 'unit';
    const channel = index % 2 === 0 ? 'one' : 'two';
    return {
      code: `${channel === 'one' ? 'JY' : 'FA'}-2026-${String(201 + index).padStart(4, '0')}`,
      name: `${parts[(index * 5) % parts.length]}${categories[index % categories.length]!.label}`,
      kind,
      channel,
      team: teams[index % teams.length]!.name,
      basis: amountBases[index % 4 === 3 ? 1 : index % 7 === 5 ? 2 : 0]!,
      expected:
        kind === 'dmc'
          ? new Decimal(0.5 + (index % 5) * 0.3).toDecimalPlaces(2)
          : new Decimal(30_000 + ((index * 48_611) % 220_000)),
    };
  });

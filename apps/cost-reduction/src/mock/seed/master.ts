/**
 * 假后端的主数据与字典（名称都是虚构的）：人员与演示身份、组织、责任一级团队、型号、工作包、供应商、字典。
 * 后端接上后由 SAP 主数据、组织机构与字典管理提供
 */
import { plainDict, type MasterData, type Person } from '../../domain/master';

/**
 * 任务里出现的人员（联络人、主办、工程责任人）：任务按序号从这五个人里轮着取，
 * 顺序不能改（改了任务数据就变了）
 */
export const taskPeople: readonly Person[] = [
  {
    id: 'E10732',
    name: '林小满',
    title: '复合材料中心 · 结构设计',
    roles: ['product'],
    team: '复合材料结构集成团队',
    leads: ['product:FC'],
  },
  {
    id: 'E20418',
    name: '周一航',
    title: '制造工程部 · 工艺',
    roles: ['product'],
    team: '起落架液压系统集成团队',
    leads: ['product:QY'],
  },
  {
    id: 'E31056',
    name: '陈默',
    title: '采购部 · 商务',
    roles: ['business'],
    leads: ['business'],
  },
  {
    id: 'E40287',
    name: '许悠',
    title: 'PEMO · 计划',
    roles: ['pemo'],
    team: '总体技术集成团队',
    leads: ['pemo'],
  },
  {
    id: 'E50913',
    name: '王晴',
    title: '成本团队 · 测算（负责人）',
    roles: ['cost'],
    leads: ['cost'],
  },
];

/** 其余的演示身份：总体团队的设计、成本团队的第二人（认领要抢）、项目团队、财务、管理员与供应商的主账号、子账号 */
const otherPeople: readonly Person[] = [
  {
    id: 'E10855',
    name: '宋知行',
    title: '总体技术集成团队 · 总体设计',
    roles: ['product'],
    team: '总体技术集成团队',
    leads: ['product:ZT'],
  },
  { id: 'E50377', name: '唐可', title: '成本团队 · 测算', roles: ['cost'] },
  {
    id: 'E60521',
    name: '顾北辰',
    title: '项目团队 · 型号副总师',
    roles: ['project'],
    leads: ['project'],
  },
  {
    id: 'E70315',
    name: '沈知遥',
    title: '财务部 · 成本核算',
    roles: ['finance'],
    leads: ['finance'],
  },
  { id: 'E80001', name: '何川', title: '信息化部 · 系统管理', roles: ['admin'] },
  {
    id: 'S01-ZL',
    name: '赵立',
    title: '供应商甲 · 主账号',
    roles: ['supplier'],
    supplier: '供应商甲',
  },
  {
    id: 'S01-QD',
    name: '钱多多',
    title: '供应商甲 · 工艺部（子账号）',
    roles: ['supplierMember'],
    supplier: '供应商甲',
  },
];

/** 打开页面时默认的身份：林小满（产品团队，任务的主办责任人） */
export const DEFAULT_USER = 'E10732';

/** 主数据与字典 */
export const masterSeed: MasterData = {
  people: [...taskPeople, ...otherPeople],
  orgs: [
    { name: '总装制造中心', depts: ['总装一车间', '计划室'] },
    { name: '复合材料中心', depts: ['结构设计室', '成型工艺室'] },
    { name: '制造工程部', depts: ['工艺技术室', '工装室'] },
    { name: '采购部', depts: ['供应商管理室', '价格室'] },
  ],
  teams: [
    { name: '总体技术集成团队', code: 'ZT' },
    { name: '复合材料结构集成团队', code: 'FC' },
    { name: '起落架液压系统集成团队', code: 'QY' },
  ],
  models: ['机型 A', '机型 B'],
  workPackages: ['平尾', '机身', '舱门', '客舱', '起落架', '机电'],
  suppliers: ['供应商甲', '供应商乙', '供应商丙', '供应商丁'],
  // 演示用的年度指标：单机降本 600 万元，降 DMC 18 美元/FH
  targets: [
    { kind: 'unit', year: '2026', amount: '6000000' },
    { kind: 'dmc', year: '2026', amount: '18' },
  ],
  dictionaries: {
    categories: [
      { value: 'design', label: '设计优化' },
      { value: 'source', label: '多货源' },
      { value: 'process', label: '工艺优化' },
    ],
    sources: [
      { value: 'supplier', label: '供应商建议', description: '渠道一：供应商提交的降本建议' },
      { value: 'team', label: '项目团队方案', description: '渠道二：PEMO 派单、产品团队出方案' },
      { value: 'review', label: '年度成本评审', description: '成本团队在评审中识别' },
    ],
    channels: [
      { value: 'one', label: '渠道一', description: '供应商建议' },
      { value: 'two', label: '渠道二', description: '项目团队方案' },
    ],
    completionForms: plainDict(['MI 批准', 'QSL 入册', 'ECP 批准', '文件', '实施']),
    fundingSources: [
      { value: 'quality', label: '精品工程' },
      { value: 'easa', label: 'EASA' },
      { value: 'plateau', label: '高原型' },
      { value: 'stretch', label: '加长型' },
    ],
    amountBases: [
      { value: 'hard', label: '硬节约', description: '实际支出减少' },
      { value: 'avoid', label: '成本规避', description: '避免了本会发生的支出' },
      { value: 'soft', label: '软节约', description: '效率改善等难以直接计量' },
    ],
    gapReasons: plainDict(['供应商让利', '商务条件置换', '原材料价格波动', '测算偏差', '其他']),
    changeTypes: plainDict(['取消', '新增', '换号', '升版']),
    installTypes: [
      { value: 'required', label: '必装' },
      { value: 'optional', label: '选装' },
    ],
    evaluationOpinions: plainDict(['初步同意', '暂不具备实施条件', '待评估']),
    reductionTypes: plainDict(['降本降价', '降本不降价']),
  },
};

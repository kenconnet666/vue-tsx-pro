/**
 * 主数据与字典：人员、组织、责任一级团队、型号、工作包、供应商，以及各处下拉用的字典。
 * 由后端维护（SAP 的物料与供应商主数据、组织机构、字典管理），前端启动时取一次、缓存起来，各页同步读取
 */
import type { RoleKey } from './roles';
import type { CostKind } from './task/types';

/** 字典的一项：值、名称、说明 */
export interface DictItem {
  /** 存下来的值 */
  value: string;
  /** 显示的名称 */
  label: string;
  /** 说明（下拉里的第二行） */
  description?: string;
}

/** 人员 */
export interface Person {
  /** 工号（供应商账号是账号名） */
  id: string;
  /** 姓名 */
  name: string;
  /** 单位与岗位的说明（“复合材料中心 · 结构设计”） */
  title: string;
  /** 角色 */
  roles: readonly RoleKey[];
  /** 所属的责任一级团队（产品团队的成员、PEMO 负责的分片） */
  team?: string;
  /** 所属的供应商（供应商账号） */
  supplier?: string;
  /** 负责的收件箱：没人认领时由他指定承办人、审批改派申请 */
  leads?: readonly string[];
}

/** 提出单位与下属的提出部门（组织机构树的两级） */
export interface Org {
  /** 单位名称 */
  name: string;
  /** 下属部门 */
  depts: readonly string[];
}

/** 责任一级团队：降本指标按它分解，编码里用它的拼音缩写 */
export interface Team {
  /** 团队名称 */
  name: string;
  /** 拼音缩写（DJ-2026-FC-1 里的 FC） */
  code: string;
}

/** 各处下拉用的字典 */
export interface Dictionaries {
  /** 任务类别：设计优化、多货源、工艺优化 */
  categories: readonly DictItem[];
  /** 任务来源 */
  sources: readonly DictItem[];
  /** 来源渠道：任务从哪条渠道汇入任务池 */
  channels: readonly DictItem[];
  /** 完成形式：MI 批准、QSL 入册…… */
  completionForms: readonly DictItem[];
  /** 本任务经费来源（多选） */
  fundingSources: readonly DictItem[];
  /** 金额口径：硬节约、成本规避、软节约 */
  amountBases: readonly DictItem[];
  /** 差额 D 的归因 */
  gapReasons: readonly DictItem[];
  /** 零件的更改类型：取消、新增、换号、升版 */
  changeTypes: readonly DictItem[];
  /** 必装 / 选装 */
  installTypes: readonly DictItem[];
  /** 工程初步评估意见 */
  evaluationOpinions: readonly DictItem[];
  /** 降本的类型（降本降价、降本不降价） */
  reductionTypes: readonly DictItem[];
}

/** 主数据：前端启动时取一次 */
export interface MasterData {
  /** 人员 */
  people: readonly Person[];
  /** 提出单位与部门 */
  orgs: readonly Org[];
  /** 责任一级团队 */
  teams: readonly Team[];
  /** 型号 */
  models: readonly string[];
  /** 工作包 */
  workPackages: readonly string[];
  /** 供应商 */
  suppliers: readonly string[];
  /** 年度降本指标：统计看板的目标线 */
  targets: readonly AnnualTarget[];
  /** 字典 */
  dictionaries: Dictionaries;
}

/** 一种降本类型一年的降本指标 */
export interface AnnualTarget {
  /** 降本类型 */
  kind: CostKind;
  /** 年度 */
  year: string;
  /** 指标金额：十进制字符串，单位同账面（单机降本是元，降 DMC 是美元 / FH） */
  amount: string;
}

/** 字典里的值 → 名称；不认识的值原样显示 */
export const labelOf = (list: readonly DictItem[], value: string) =>
  list.find((item) => item.value === value)?.label ?? value;

/** 只有名称的字典（值就是名称）：完成形式、差额归因这类直接存文字的 */
export const plainDict = (labels: readonly string[]): DictItem[] =>
  labels.map((label) => ({ value: label, label }));

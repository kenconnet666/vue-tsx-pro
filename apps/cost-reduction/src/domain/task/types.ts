/**
 * 任务卡（降本项目）：《降本项目信息表》的主表与明细，加上《需求定义方案》任务池的管理字段（状态、里程碑、收益）。
 * 主表与明细在编辑页维护，管理字段在任务卡详情里推进
 */
import type Decimal from 'decimal.js';

/** 降本类型：单机降本（金额是元，按万元显示）或降 DMC（美元 / FH） */
export type CostKind = 'unit' | 'dmc';

/** 任务状态：八个正常状态与三个异常状态 */
export interface TaskStatuses {
  /** 待启动 */
  pending: unknown;
  /** 方案设计中 */
  designing: unknown;
  /** 验证中 */
  verifying: unknown;
  /** 待认定 */
  awaiting: unknown;
  /** 已认定 */
  confirmed: unknown;
  /** 商务洽谈中 */
  negotiating: unknown;
  /** 已兑现 */
  realized: unknown;
  /** 关闭 */
  closed: unknown;
  /** 暂停（异常） */
  paused: unknown;
  /** 终止（异常） */
  terminated: unknown;
  /** 挂账待定（异常）：定价依据缺失但收益客观存在 */
  unpriced: unknown;
}

/** 任务状态 */
export type TaskStatus = keyof TaskStatuses;

/** 收益状态（一本账的栏）：预测、承诺、实现，以及挂账待定；机会值是渠道里还没进任务池的建议 */
export interface ValueStates {
  /** 预测值：评估通过待实施 */
  forecast: unknown;
  /** 承诺值：有合同或批文支撑 */
  committed: unknown;
  /** 实现值：已交付并完成调价 */
  realized: unknown;
  /** 挂账待定：写“待定价”，不并入零 */
  unpriced: unknown;
}

/** 收益状态 */
export type ValueState = keyof ValueStates;

/** 里程碑的名称：每个任务至少三个 */
export type MilestoneLabel = '方案确定' | '验证完成' | '收益确认';

/** 任务卡的一个里程碑：每个都要上传交付证据，不允许只改状态 */
export interface Milestone {
  /** 名称 */
  label: MilestoneLabel;
  /** 完成日期；没完成时为 null */
  done: string | null;
  /** 交付证据的文件名 */
  evidence: string | null;
}

/** 关闭三材料：缺一不得关闭 */
export interface ClosingMaterials {
  /** 验证窗结论（成本团队出具） */
  verification: boolean;
  /** 收益认定意见 */
  benefit: boolean;
  /** 商务谈定记录 */
  business: boolean;
}

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
  /** 材料牌号（材料变化时填） */
  materialGrade: string;
  /** 材料状态 */
  materialCondition: string;
  /** 材料规格 */
  materialSpec: string;
  /** 技术条件（材料规范） */
  materialStandard: string;
  /** 单件材料定额 */
  quota: Decimal;
  /** 定额单位（张、kg、m²） */
  quotaUnit: string;
  /** 材料单价（元） */
  materialPrice: Decimal;
  /** 单件工时定额（小时） */
  laborHours: Decimal;
  /** 费率（元 / 小时） */
  laborRate: Decimal;
}

/** 零件的更改类型 */
export const changeTypes = ['取消', '新增', '换号', '升版'] as const;

/** 零件的更改类型 */
export type ChangeType = (typeof changeTypes)[number];

/** 一条零件更改：取消只有更改前，新增只有更改后 */
export interface PartChange {
  /** 标识 */
  id: string;
  /** 更改类型 */
  changeType: ChangeType;
  /** 更改前 */
  before: PartSide | null;
  /** 更改后 */
  after: PartSide | null;
}

/** 工程初步评估意见 */
export type EvaluationOpinion = '初步同意' | '暂不具备实施条件' | '待评估';

/** 单机降本明细表：项目信息、零件更改与工程评估 */
export interface UnitDetail {
  /** 构型通知单编号（可多个） */
  notices: string[];
  /** 项目描述 */
  projectDescription: string;
  /** 项目优化内容 */
  optimization: string;
  /** 是否双定点 */
  dualSource: boolean;
  /** 工程责任人工号 */
  engineer: string;
  /** 零件更改：受影响零件一个件号一条 */
  parts: PartChange[];
  /** 工程初步评估：意见、具体原因（暂不具备实施条件、待评估时必填）、类型（降本降价……） */
  evaluation: { opinion: EvaluationOpinion; reason: string; type: string };
}

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

/** 必装 / 选装 */
export type InstallType = 'required' | 'optional';

/** 一张任务卡（任务池里的一行） */
export interface CostTask {
  /** 任务编号：DJ（单机降本）或 DMC - 完成年度 - 团队缩写 - 序号，系统生成 */
  code: string;
  /** 项目名称 */
  name: string;
  /** 来源渠道（字典 channels） */
  channel: string;
  /** 关联的建议编号（渠道一）或方案编号（渠道二） */
  sourceCode: string;
  /** 型号 */
  model: string;
  /** 工作包 */
  workPackage: string;
  /** 涉及供应商 */
  supplier: string;
  /** 任务类别（字典 categories） */
  category: string;
  /** 责任一级团队 */
  team: string;
  /** 主办责任人工号 */
  owner: string;
  /** 降本类型 */
  kind: CostKind;
  /** 状态 */
  status: TaskStatus;
  /** 收益状态 */
  valueState: ValueState;
  /** 金额口径（字典 amountBases） */
  basis: string;
  /** 预期收益：建议卡或方案卡上的量级，认定前的预测用它 */
  expected: Decimal;
  /** 测算金额 A：收益认定时锁定，此后不可改；认定前、挂账待定为 null */
  a: Decimal | null;
  /** 商务金额 B：商务谈定后回填 */
  b: Decimal | null;
  /** 差额 D（B − A）的归因（字典 gapReasons） */
  gapReason: string | null;
  /** 计划完成时间（ISO 日期） */
  due: string;
  /** 里程碑：方案确定、验证完成、收益确认 */
  milestones: Milestone[];
  /** 关闭三材料 */
  closing: ClosingMaterials;
  /** 简要描述 */
  description: string;
  /** 提出单位 */
  org: string;
  /** 提出部门（属于提出单位） */
  dept: string;
  /** 联络人工号（工号由联络人带出） */
  contact: string;
  /** 必装 / 选装 */
  install: InstallType;
  /** 数模编号 + 版本 */
  modelNo: string;
  /** 供应商件号（DMC 主表，可多个） */
  supplierPartNos: string[];
  /** 完成年度 */
  year: string;
  /** 贯彻架次 */
  flights: number | null;
  /** 完成形式（字典 completionForms） */
  form: string;
  /** 是否需要 SB 贯彻航线架次 */
  needSb: boolean;
  /** 本任务经费来源（字典 fundingSources） */
  funding: string[];
  /** 项目建议书编号 */
  proposalNo: string;
  /** 备注 */
  remark: string;
  /** 单机降本明细（单机降本）；降 DMC 为 null */
  unitDetail: UnitDetail | null;
  /** DMC 实施节点（降 DMC）；单机降本为空 */
  dmcNodes: DmcNode[];
  /** 在审批中的计划调整；没有时为 null */
  pendingChange: PendingPlanChange | null;
  /** 变更记录（新的在前）：PEMO 同意的计划调整 */
  changes: TaskChangeRecord[];
}

/** 计划调整的内容：调成什么、为什么（主办提交，PEMO 审批；不得自行改日期） */
export interface PlanChange {
  /** 调整后的计划完成时间（ISO 日期） */
  due: string;
  /** 调整后的主办工号 */
  owner: string;
  /** 调整原因 */
  reason: string;
}

/** 在审批中的计划调整：内容与谁、哪天提交的 */
export interface PendingPlanChange extends PlanChange {
  /** 申请人工号 */
  by: string;
  /** 提交日期（ISO 日期） */
  at: string;
}

/** 一项从什么改成什么 */
export interface ValueChange {
  /** 原来的 */
  before: string;
  /** 改成的 */
  after: string;
}

/** 变更记录的一条：同意的计划调整，改了哪几项 */
export interface TaskChangeRecord {
  /** 生效日期（ISO 日期） */
  at: string;
  /** 申请人工号 */
  by: string;
  /** 同意的人工号 */
  approvedBy: string;
  /** 调整原因 */
  reason: string;
  /** 计划完成时间；没改时为 null */
  due: ValueChange | null;
  /** 主办；没改时为 null */
  owner: ValueChange | null;
}

/** 收益认定的退回记录：退回后任务回到“验证中”，在收益认定的“退回”页签里看原因 */
export interface ConfirmReturn {
  /** 任务编号 */
  code: string;
  /** 退回原因 */
  reason: string;
  /** 退回日期 */
  at: string;
}

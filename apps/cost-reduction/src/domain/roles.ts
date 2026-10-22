/**
 * 角色：《需求定义方案》的五类主体，供应商分主账号与子账号，另有财务与系统管理员。
 * 三条管理线各管一段：成本团队管钱不管进度，PEMO 管进度不管钱，产品团队管干活不管结论
 */

/** 角色 */
export interface Roles {
  /** 供应商主账号：提交建议、认可测算、确认方案等签署类动作（有商务含义，只能主账号做） */
  supplier: unknown;
  /** 供应商子账号：填报建议、传附件、看本部门进展 */
  supplierMember: unknown;
  /** 成本团队：齐全性检查、收益测算、收益认定、储备库维护 */
  cost: unknown;
  /** PEMO：派单、提级裁决、任务池进度管理、关闭审核 */
  pemo: unknown;
  /** 产品团队：技术评估、方案设计、验证实施 */
  product: unknown;
  /** 项目团队：分级决策、重大事项审定 */
  project: unknown;
  /** 财务：维护测算公式（公式层统一维护、版本冻结） */
  finance: unknown;
  /** 系统管理员：基础数据、流程配置、用户与权限 */
  admin: unknown;
}

/** 角色 */
export type RoleKey = keyof Roles;

/** 角色的名称 */
export const roleNames: Readonly<Record<RoleKey, string>> = {
  supplier: '供应商（主账号）',
  supplierMember: '供应商（子账号）',
  cost: '成本团队',
  pemo: 'PEMO',
  product: '产品团队',
  project: '项目团队',
  finance: '财务',
  admin: '系统管理员',
};

/** 是不是供应商（主账号或子账号）：外部参与方，只看得到与自己有关的单据 */
export const isSupplierRole = (role: RoleKey) => role === 'supplier' || role === 'supplierMember';

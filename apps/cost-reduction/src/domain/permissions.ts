/**
 * 权限：哪些角色能做哪些事（流程节点上的处理由节点的处理人决定，不在这里）。
 * 前端按它显示导航与按钮，后端对每个操作再校验一次；三条线各管一段：成本团队管钱、PEMO 管进度、产品团队管干活
 */
import type { RoleKey } from './roles';

/** 平台上的操作 */
export interface Actions {
  /** 新建、导入任务卡（建卡归 PEMO） */
  'task.create': unknown;
  /** 编辑任务卡的信息表字段（主表与明细） */
  'task.edit': unknown;
  /** 删除待启动的任务卡 */
  'task.delete': unknown;
  /** 暂停、恢复任务 */
  'task.pause': unknown;
  /** 终止任务 */
  'task.terminate': unknown;
  /** 演示：替处理人推进到下一状态（正式页面里由各节点的处理人处理） */
  'task.advance': unknown;
  /** 收益认定：锁定 A、挂账待定 */
  'benefit.confirm': unknown;
  /** 提交、撤回供应商建议（签署类，只能主账号） */
  'suggestion.submit': unknown;
  /** 填写建议草稿、上传附件 */
  'suggestion.draft': unknown;
  /** 新的渠道二需求 */
  'plan.create': unknown;
  /** 维护测算参数 */
  'estimate.params': unknown;
  /** 维护测算公式 */
  'estimate.formula': unknown;
  /** 维护储备库 */
  'reserve.manage': unknown;
  /** 基础数据、字典、流程配置、工作日历 */
  'system.manage': unknown;
}

/** 平台上的操作 */
export type Action = keyof Actions;

/** 每个操作允许的角色 */
const allowed: Readonly<Record<Action, readonly RoleKey[]>> = {
  'task.create': ['pemo', 'admin'],
  'task.edit': ['pemo', 'product', 'admin'],
  'task.delete': ['pemo', 'admin'],
  'task.pause': ['pemo'],
  'task.terminate': ['pemo'],
  'task.advance': ['pemo', 'cost', 'product', 'business', 'admin'],
  'benefit.confirm': ['cost'],
  'suggestion.submit': ['supplier'],
  'suggestion.draft': ['supplier', 'supplierMember'],
  'plan.create': ['pemo'],
  'estimate.params': ['cost'],
  'estimate.formula': ['finance'],
  'reserve.manage': ['cost'],
  'system.manage': ['admin'],
};

/** 有这些角色的人能不能做这件事 */
export const can = (roles: readonly RoleKey[], action: Action) =>
  allowed[action].some((role) => roles.includes(role));

/** 做这件事要哪些角色（提示“只有……能……”） */
export const rolesFor = (action: Action) => allowed[action];

/**
 * 演示业务库的种子与宿主模块 `@app/business` 的声明（domain/business.ts 建表、写种子、登记模块）。
 * 这里只有常量：页面（字典）、工作室的语言服务（声明）也读它，不带上 ORM。
 */

export const SUPPLIER_ROWS = [
  {
    id: 'huadong',
    name: '华东数码',
    category: '电子设备',
    rating: 5,
    blocked: false,
    blockedReason: null,
  },
  {
    id: 'huanan',
    name: '华南视讯',
    category: '音视频',
    rating: 4,
    blocked: false,
    blockedReason: null,
  },
  {
    id: 'beifang',
    name: '北方办公',
    category: '办公用品',
    rating: 4,
    blocked: false,
    blockedReason: null,
  },
  {
    id: 'xibu',
    name: '西部线缆',
    category: '线缆',
    rating: 2,
    blocked: true,
    blockedReason: '资质过期',
  },
] as const;

export const MATERIAL_ROWS = [
  { id: 'm-screen', name: '86 寸会议大屏', unit: '台', price: '32000.00', supplierId: 'huanan' },
  { id: 'm-audio', name: '会议音响套装', unit: '套', price: '16000.00', supplierId: 'huanan' },
  { id: 'm-laptop', name: '笔记本电脑', unit: '台', price: '8500.00', supplierId: 'huadong' },
  { id: 'm-paper', name: 'A4 复印纸', unit: '箱', price: '120.00', supplierId: 'beifang' },
  { id: 'm-cable', name: '六类网线', unit: '箱', price: '650.00', supplierId: 'xibu' },
] as const;

/** 成本中心挂在部门上；预算按年 */
export const COST_CENTERS = [
  { id: 'cc-rd', name: '研发中心', departmentId: '20' },
  { id: 'cc-sales', name: '销售部', departmentId: '60' },
  { id: 'cc-admin', name: '总经办', departmentId: '10' },
] as const;

export const BUDGET_ROWS = [
  { id: 'cc-rd-2026', costCenterId: 'cc-rd', year: 2026, amount: '600000.00', used: '420000.00' },
  {
    id: 'cc-sales-2026',
    costCenterId: 'cc-sales',
    year: 2026,
    amount: '300000.00',
    used: '90000.00',
  },
  {
    id: 'cc-admin-2026',
    costCenterId: 'cc-admin',
    year: 2026,
    amount: '150000.00',
    used: '148000.00',
  },
] as const;

/** `@app/business` 的声明（app-business.d.ts 的原文）：发布时的类型检查、工作室编辑器的补全与报错都按它 */
export { default as BUSINESS_TYPES } from './app-business.d.ts?raw';

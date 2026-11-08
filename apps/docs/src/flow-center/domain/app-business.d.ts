// 宿主模块 @app/business 的声明（domain/business.ts 登记）：本项目的类型检查、工作室的编辑器都读这一份
declare module '@app/business' {
  /** 供应商 */
  export interface SupplierInfo {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    /** 评级 1–5 */
    readonly rating: number;
    /** 停用了（资质过期、黑名单）不能再签约、下单 */
    readonly blocked: boolean;
    readonly blockedReason: string | null;
  }
  /** 物料 */
  export interface MaterialInfo {
    readonly id: string;
    readonly name: string;
    readonly unit: string;
    /** 参考单价（元） */
    readonly price: number;
    readonly supplierId: string | null;
  }
  /** 按编号找供应商（采购单里存的是编号） */
  export function supplier(id: string): Promise<SupplierInfo | null>;
  /** 按名字找供应商（合同的相对方写的是名字） */
  export function supplierByName(name: string): Promise<SupplierInfo | null>;
  /** 全部物料 */
  export function materials(): Promise<MaterialInfo[]>;
  /** 成本中心这一年还剩多少预算（元）；没有预算时为 0 */
  export function budgetLeft(costCenter: string, year: number): Promise<number>;
}

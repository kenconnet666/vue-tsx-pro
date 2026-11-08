/**
 * 演示的业务库（与流程同一个库）：供应商、物料、成本中心与预算。登记成宿主模块 `@app/business`——
 * 流程代码 `import { supplierByName } from '@app/business'`，引擎按版本链接；声明（BUSINESS_TYPES）给工作室的编辑器。
 * 种子与声明在 business-data.ts（页面、语言服务也读，不带 ORM）。
 */
import {
  col,
  createDb,
  defineSchema,
  entity,
  type Adapter,
  type Row,
} from '@zerodep-dev/easy-query-ts';
import type { HostModule } from '@zerodep-dev/flow-ts-engine';
import {
  BUDGET_ROWS,
  BUSINESS_TYPES,
  COST_CENTERS,
  MATERIAL_ROWS,
  SUPPLIER_ROWS,
} from './business-data';

const text = () => col.string().dbType('text');

export const Supplier = entity(
  'biz_supplier',
  {
    id: text().primaryKey(),
    name: text(),
    category: text(),
    rating: col.int(),
    blocked: col.boolean(),
    blockedReason: text().nullable(),
  },
  { comment: '供应商', indexes: [{ columns: ['name'], unique: true }] },
);

export const Material = entity(
  'biz_material',
  {
    id: text().primaryKey(),
    name: text(),
    unit: text(),
    price: col.decimal(14, 2),
    supplierId: text().nullable(),
  },
  { comment: '物料' },
);

export const CostCenter = entity(
  'biz_cost_center',
  { id: text().primaryKey(), name: text(), departmentId: text() },
  { comment: '成本中心' },
);

/** 成本中心一年的预算：amount 是总额，used 是已用 */
export const Budget = entity(
  'biz_budget',
  {
    id: text().primaryKey(),
    costCenterId: text(),
    year: col.int(),
    amount: col.decimal(14, 2),
    used: col.decimal(14, 2),
  },
  { comment: '预算', indexes: [{ columns: ['costCenterId', 'year'], unique: true }] },
);

export const businessSchema = defineSchema({ Supplier, Material, CostCenter, Budget });

/**
 * 业务库：建表、第一次写种子，和登记给流程代码的模块。模块读的是准备时载入的快照（同组织目录）：
 * 守卫、动作在推进的事务里执行，PGlite 只有一条连接，这时另开查询会等自己的事务。改了业务表调 refresh()
 */
export function createBusiness(adapter: Adapter) {
  const db = createDb({ schema: businessSchema, adapter });
  let snapshot = {
    suppliers: [] as Row<typeof Supplier>[],
    materials: [] as Row<typeof Material>[],
    budgets: [] as Row<typeof Budget>[],
  };

  async function refresh(): Promise<void> {
    const [suppliers, materials, budgets] = await Promise.all([
      db
        .queryable(Supplier)
        .orderBy((s) => s.id)
        .toList(),
      db
        .queryable(Material)
        .orderBy((m) => m.id)
        .toList(),
      db.queryable(Budget).toList(),
    ]);
    snapshot = { suppliers, materials, budgets };
  }

  async function prepare(): Promise<void> {
    await db.createTables();
    if ((await db.queryable(Supplier).count()) === 0) {
      await db
        .insert(Supplier)
        .values([...SUPPLIER_ROWS])
        .execute();
      await db
        .insert(Material)
        .values([...MATERIAL_ROWS])
        .execute();
      await db
        .insert(CostCenter)
        .values([...COST_CENTERS])
        .execute();
      await db
        .insert(Budget)
        .values([...BUDGET_ROWS])
        .execute();
    }
    await refresh();
  }

  const exports = {
    supplier: async (id: string) => snapshot.suppliers.find((s) => s.id === id) ?? null,
    supplierByName: async (name: string) => snapshot.suppliers.find((s) => s.name === name) ?? null,
    materials: async () => snapshot.materials.map((m) => ({ ...m, price: Number(m.price) })),
    budgetLeft: async (costCenter: string, year: number) => {
      const budget = snapshot.budgets.find((b) => b.costCenterId === costCenter && b.year === year);
      // 两位小数：换成分再减，不受浮点误差影响
      return budget
        ? (Math.round(Number(budget.amount) * 100) - Math.round(Number(budget.used) * 100)) / 100
        : 0;
    },
  };

  const module: HostModule = { exports, types: BUSINESS_TYPES };
  return { prepare, refresh, module };
}

export type Business = ReturnType<typeof createBusiness>;

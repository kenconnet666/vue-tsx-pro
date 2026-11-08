/**
 * 组织目录：把组织的表接到引擎上——org（角色、部门展开成人）、处理人解析器（上级、部门负责人）、做事的人（Actor）。
 *
 *   const directory = createOrgDirectory({ adapter, isAdmin: (e) => e.roles.includes('admin') });
 *   await directory.createTables();
 *   const engine = createFlowEngine({ adapter, org: directory.org, extensions: { resolvers: directory.resolvers } });
 *
 * 引擎在事务里展开处理人，读的是内存里的一份快照，不另发查询：组织很小、很少变，快照省掉每个节点的几次往返，
 * 也不会在只有一条连接的库（PGlite）上等自己的事务。经目录改的（sync、save*、removeDepartment）会自动刷新，并广播 ORG_CHANNEL：
 * 多实例部署时别的进程收听它、调 refresh()（见 core/channels.ts）；绕过目录直接改了表也调 refresh()
 */
import { createDb, type Adapter } from '@zerodep-dev/easy-query-ts';
import { ORG_CHANNEL } from '../core/channels.ts';
import { FlowError } from '../core/errors.ts';
import type { Actor, ExtensionContext, FlowOrg, Resolver } from '../types.ts';
import {
  OrgDepartment,
  OrgEmployee,
  OrgRole,
  orgSchema,
  type DepartmentRow,
  type EmployeeRow,
  type OrgDb,
  type RoleRow,
} from './entities.ts';

export interface OrgDirectoryOptions {
  readonly adapter: Adapter;
  /** 谁能做管理员的事（干预流程、处理异常）；不给时没有管理员 */
  readonly isAdmin?: (employee: EmployeeRow) => boolean;
  /** 扩展种类（候选写成 `{ group }`）的成员；不给时为空 */
  readonly groupMembers?: (group: string) => readonly string[] | Promise<readonly string[]>;
}

/** 部门的值；sort 不写时是 0 */
export type DepartmentInput = Omit<DepartmentRow, 'sort'> & { readonly sort?: number };
/** 员工的值；不写的：职务、上级为空，没有角色，在职 */
export type EmployeeInput = Pick<EmployeeRow, 'id' | 'name' | 'departmentId'> &
  Partial<Pick<EmployeeRow, 'title' | 'managerId' | 'roles' | 'active'>>;

/** 整批同步的数据：三张表的全部行 */
export interface OrgData {
  readonly departments: readonly DepartmentInput[];
  readonly roles: readonly RoleRow[];
  readonly employees: readonly EmployeeInput[];
}

/** 读出来的组织：部门按树的先序（上级在前、同级按 sort），员工、角色按编号 */
export interface OrgSnapshot {
  readonly departments: readonly DepartmentRow[];
  readonly roles: readonly RoleRow[];
  readonly employees: readonly EmployeeRow[];
}

export interface OrgDirectory {
  readonly db: OrgDb;
  /** 建缺的表（开发、测试；生产走迁移脚本） */
  createTables(): Promise<void>;
  /** 整批替换成这份数据（从 HR 系统同步、演示数据），一个事务里做完，然后刷新快照 */
  sync(data: OrgData): Promise<void>;
  /** 重新读快照 */
  refresh(): Promise<void>;
  /** 新增或修改部门（按编号）：上级要存在，不能是它自己或它下面的部门；负责人要是在职的员工 */
  saveDepartment(row: DepartmentInput): Promise<void>;
  /** 删部门：下面还有部门或员工时不删（invalid-input） */
  removeDepartment(id: string): Promise<void>;
  /** 新增或修改员工（按编号）：部门要存在，上级不能是他自己或他的下属；离职写 active: false，不删 */
  saveEmployee(row: EmployeeInput): Promise<void>;
  /** 新增或修改角色（按编号） */
  saveRole(row: RoleRow): Promise<void>;
  /** 当前的组织（没读过时先读） */
  snapshot(): Promise<OrgSnapshot>;
  /** 给引擎的 org：角色、部门（含下级部门）展开成在职的人；部门收件箱的负责人是部门负责人 */
  readonly org: FlowOrg;
  /**
   * 处理人解析器，参数（定义里的 args）：
   * - `manager`：发起人的直属上级；`levels: 2` 是上级的上级；`field` 指定按单据里这个字段的人算（默认发起人）。离职的跳过，再往上找
   * - `departmentHead`：发起人所在部门的负责人；`level: 1` 是他所在的一级部门（根部门下面那一级）的，他本身在更高的部门时按所在部门；
   *   负责人是他自己、空缺或离职时找上级部门的；`field` 同上
   */
  readonly resolvers: { readonly manager: Resolver; readonly departmentHead: Resolver };
  /** 引擎眼里的这个人：角色、所在部门及其全部上级部门（上级部门的收件箱他也看得到，与 members 的展开一致）；不在或离职时 undefined */
  actorOf(id: string): Promise<Actor | undefined>;
}

/** 快照加上查找用的索引 */
interface Loaded extends OrgSnapshot {
  readonly department: ReadonlyMap<string, DepartmentRow>;
  readonly employee: ReadonlyMap<string, EmployeeRow>;
  readonly children: ReadonlyMap<string | null, readonly DepartmentRow[]>;
}

export function createOrgDirectory(options: OrgDirectoryOptions): OrgDirectory {
  const db = createDb({ schema: orgSchema, adapter: options.adapter });
  let loading: Promise<Loaded> | undefined;

  const load = () =>
    (loading ??= read(db).catch((error: unknown) => {
      loading = undefined;
      throw error;
    }));
  const refresh = async () => {
    loading = undefined;
    await load();
  };

  /** 部门和它下面的全部部门（数据里有环时也会停下） */
  const subtree = (org: Loaded, id: string): Set<string> => {
    const found = new Set([id]);
    for (const at of found) for (const child of org.children.get(at) ?? []) found.add(child.id);
    return found;
  };

  /** 部门和它的全部上级部门，从近到远 */
  const lineage = (org: Loaded, id: string | null): DepartmentRow[] => {
    const chain: DepartmentRow[] = [];
    for (let at = id; at !== null;) {
      const department = org.department.get(at);
      // 数据里有环时停下
      if (!department || chain.includes(department)) break;
      chain.push(department);
      at = department.parentId;
    }
    return chain;
  };

  const active = (org: Loaded, id: string | null) => {
    const employee = id === null ? undefined : org.employee.get(id);
    return employee?.active ? employee : undefined;
  };

  /** 解析器按谁算：args.field 指的单据字段，默认发起人 */
  const subjectOf = (org: Loaded, context: ExtensionContext) => {
    const field = context.args.field;
    const id = typeof field === 'string' ? context.read(field) : context.instance.startedBy;
    return typeof id === 'string' ? org.employee.get(id) : undefined;
  };

  const manager: Resolver = async (context) => {
    const org = await load();
    let levels = typeof context.args.levels === 'number' ? context.args.levels : 1;
    const seen = new Set<string>();
    for (let at = subjectOf(org, context)?.managerId ?? null; at !== null && !seen.has(at);) {
      seen.add(at);
      const employee = org.employee.get(at);
      if (!employee) break;
      if (employee.active && --levels === 0) return [employee.id];
      at = employee.managerId;
    }
    return [];
  };

  const departmentHead: Resolver = async (context) => {
    const org = await load();
    const subject = subjectOf(org, context);
    if (!subject) return [];
    const chain = lineage(org, subject.departmentId);
    // chain 从近到远、最后一个是根：第 level 级部门在倒数第 level + 1 个
    const level = typeof context.args.level === 'number' ? context.args.level : undefined;
    const from = level === undefined ? 0 : Math.max(0, chain.length - 1 - level);
    const head = chain
      .slice(from)
      .map((department) => active(org, department.headId))
      .find((employee) => employee && employee.id !== subject.id);
    return head ? [head.id] : [];
  };

  const org: FlowOrg = {
    members: async (source) => {
      if ('group' in source) return (await options.groupMembers?.(source.group)) ?? [];
      const loaded = await load();
      if ('role' in source)
        return loaded.employees
          .filter((e) => e.active && e.roles.includes(source.role))
          .map((e) => e.id);
      const departments = subtree(loaded, source.department);
      return loaded.employees
        .filter((e) => e.active && departments.has(e.departmentId))
        .map((e) => e.id);
    },
    inboxManager: async ({ kind, value }) => {
      if (kind !== 'department') return undefined;
      const loaded = await load();
      return lineage(loaded, value)
        .map((department) => active(loaded, department.headId))
        .find(Boolean)?.id;
    },
  };

  const invalid = (message: string) => new FlowError('invalid-input', message);

  async function saveDepartment(row: DepartmentInput) {
    const loaded = await load();
    if (row.parentId != null) {
      if (!loaded.department.has(row.parentId)) throw invalid(`没有上级部门 ${row.parentId}`);
      if (subtree(loaded, row.id).has(row.parentId))
        throw invalid('上级部门不能是它自己或它下面的部门');
    }
    if (row.headId != null && !active(loaded, row.headId))
      throw invalid(`负责人 ${row.headId} 不是在职的员工`);
    await db
      .insert(OrgDepartment)
      .values(row)
      .onConflict((d) => d.id)
      .merge()
      .execute();
    await db.notify(ORG_CHANNEL);
    await refresh();
  }

  async function removeDepartment(id: string) {
    const loaded = await load();
    if ((loaded.children.get(id) ?? []).length > 0) throw invalid('下面还有部门，先移走或删掉它们');
    if (loaded.employees.some((e) => e.departmentId === id))
      throw invalid('部门里还有员工（含离职的），先调到别的部门');
    await db
      .delete(OrgDepartment)
      .where((d) => d.id.eq(id))
      .execute();
    await db.notify(ORG_CHANNEL);
    await refresh();
  }

  async function saveEmployee(row: EmployeeInput) {
    const loaded = await load();
    if (!loaded.department.has(row.departmentId)) throw invalid(`没有部门 ${row.departmentId}`);
    // 顺着上级往上走，走回他自己就是绕成了圈
    for (let at = row.managerId ?? null, steps = 0; at !== null; steps++) {
      if (at === row.id || steps > loaded.employees.length)
        throw invalid('上级不能是他自己或他的下属');
      at = loaded.employee.get(at)?.managerId ?? null;
    }
    if (row.managerId != null && !loaded.employee.has(row.managerId))
      throw invalid(`没有员工 ${row.managerId}`);
    await db
      .insert(OrgEmployee)
      .values(row)
      .onConflict((e) => e.id)
      .merge()
      .execute();
    await db.notify(ORG_CHANNEL);
    await refresh();
  }

  async function saveRole(row: RoleRow) {
    await db
      .insert(OrgRole)
      .values(row)
      .onConflict((r) => r.id)
      .merge()
      .execute();
    await db.notify(ORG_CHANNEL);
    await refresh();
  }

  return {
    db,
    createTables: () => db.createTables(),
    saveDepartment,
    removeDepartment,
    saveEmployee,
    saveRole,
    sync: async (data) => {
      await db.transaction(async (tx) => {
        for (const entity of [OrgEmployee, OrgRole, OrgDepartment])
          await tx.delete(entity).all().execute();
        if (data.departments.length)
          await tx.insert(OrgDepartment).values(data.departments).execute();
        if (data.roles.length) await tx.insert(OrgRole).values(data.roles).execute();
        if (data.employees.length) await tx.insert(OrgEmployee).values(data.employees).execute();
        await tx.notify(ORG_CHANNEL);
      });
      await refresh();
    },
    refresh,
    snapshot: load,
    org,
    resolvers: { manager, departmentHead },
    actorOf: async (id) => {
      const loaded = await load();
      const employee = active(loaded, id);
      if (!employee) return undefined;
      return {
        id: employee.id,
        name: employee.name,
        roles: employee.roles,
        departments: lineage(loaded, employee.departmentId).map((d) => d.id),
        admin: options.isAdmin?.(employee) ?? false,
      };
    },
  };
}

/** 读三张表、排好、建索引；读失败时下次再读 */
async function read(db: OrgDb): Promise<Loaded> {
  const [departments, roles, employees] = await Promise.all([
    db
      .queryable(OrgDepartment)
      .orderBy((d) => [d.sort, d.id])
      .toList(),
    db
      .queryable(OrgRole)
      .orderBy((r) => r.id)
      .toList(),
    db
      .queryable(OrgEmployee)
      .orderBy((e) => e.id)
      .toList(),
  ]);
  const children = new Map<string | null, DepartmentRow[]>();
  for (const department of departments) {
    const siblings = children.get(department.parentId) ?? [];
    siblings.push(department);
    children.set(department.parentId, siblings);
  }
  const ordered: DepartmentRow[] = [];
  const visit = (parent: string | null) => {
    for (const child of children.get(parent) ?? []) {
      ordered.push(child);
      visit(child.id);
    }
  };
  visit(null);
  return {
    departments: ordered,
    roles,
    employees,
    department: new Map(departments.map((d) => [d.id, d])),
    employee: new Map(employees.map((e) => [e.id, e])),
    children,
  };
}

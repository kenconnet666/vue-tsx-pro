/**
 * 组织目录：把组织的表接到引擎上——org（角色、部门展开成人）、处理人解析器（上级、部门负责人）、做事的人（Actor）。
 *
 *   const directory = createOrgDirectory({ adapter, isAdmin: (e) => e.roles.includes('admin') });
 *   await directory.createTables();
 *   const engine = createFlowEngine({ adapter, org: directory.org, extensions: { resolvers: directory.resolvers } });
 *
 * 引擎在事务里展开处理人，读的是内存里的一份快照，不另发查询：组织很小、很少变，快照省掉每个节点的几次往返，
 * 也不会在只有一条连接的库（PGlite）上等自己的事务。经 sync() 改的会自动刷新；绕过它直接改了表、或别的进程改了，调 refresh()
 */
import { createDb, type Adapter, type Insert } from '@zerodep-dev/easy-query-ts';
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

/** 整批同步的数据：三张表的全部行 */
export interface OrgData {
  readonly departments: readonly Insert<typeof OrgDepartment>[];
  readonly roles: readonly Insert<typeof OrgRole>[];
  readonly employees: readonly Insert<typeof OrgEmployee>[];
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

  return {
    db,
    createTables: () => db.createTables(),
    sync: async (data) => {
      await db.transaction(async (tx) => {
        for (const entity of [OrgEmployee, OrgRole, OrgDepartment])
          await tx.delete(entity).all().execute();
        if (data.departments.length)
          await tx.insert(OrgDepartment).values(data.departments).execute();
        if (data.roles.length) await tx.insert(OrgRole).values(data.roles).execute();
        if (data.employees.length) await tx.insert(OrgEmployee).values(data.employees).execute();
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

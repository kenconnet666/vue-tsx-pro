/**
 * 组织的表：部门（树）、角色、员工（带上级）。引擎不依赖它们（org 与解析器是选项里的函数），这是现成的一种接法：
 * 没有自己的组织库时直接用，有 HR 系统时按 `directory.sync()` 整批同步进来。
 * 编号是文字（工号、部门编码），与引擎里人的编号（Actor.id）一一对应；同引擎的表一样只有逻辑外键
 */
import { col, defineSchema, entity, type Db, type Row } from '@zerodep-dev/easy-query-ts';

const text = () => col.string().dbType('text');

/** 部门：parentId 为空的是根 */
export const OrgDepartment = entity(
  'org_department',
  {
    id: text().primaryKey(),
    name: text(),
    parentId: text().nullable(),
    /** 部门负责人 */
    headId: text().nullable(),
    /** 同级里的先后 */
    sort: col.int().dbDefault('0'),
  },
  { comment: '部门', indexes: [{ columns: ['parentId'] }] },
);

/** 角色（财务、法务……）：定义里按编号写处理人 */
export const OrgRole = entity(
  'org_role',
  {
    id: text().primaryKey(),
    name: text(),
  },
  { comment: '角色' },
);

/** 员工：一个所在部门、若干角色、一个直属上级；离职的不删，active 置否（历史待办里的名字还在） */
export const OrgEmployee = entity(
  'org_employee',
  {
    id: text().primaryKey(),
    name: text(),
    /** 职务（显示用） */
    title: text().nullable(),
    departmentId: text(),
    /** 直属上级；最高的人没有 */
    managerId: text().nullable(),
    roles: col.array(text()).dbDefault("'{}'"),
    active: col.boolean().dbDefault('true'),
  },
  {
    comment: '员工',
    indexes: [{ columns: ['departmentId'] }, { columns: ['roles'], using: 'gin' }],
  },
);

export const orgSchema = defineSchema({ OrgDepartment, OrgRole, OrgEmployee });

/** 组织用的 Db */
export type OrgDb = Db<typeof orgSchema>;

export type DepartmentRow = Row<typeof OrgDepartment>;
export type RoleRow = Row<typeof OrgRole>;
export type EmployeeRow = Row<typeof OrgEmployee>;

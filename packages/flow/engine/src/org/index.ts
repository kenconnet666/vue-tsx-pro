/** 组织目录（`@zerodep-dev/flow-ts-engine/org`）：组织的表，与接到引擎上的 org、处理人解析器、Actor */
export {
  createOrgDirectory,
  type OrgData,
  type OrgDirectory,
  type OrgDirectoryOptions,
  type OrgSnapshot,
} from './directory.ts';
export {
  OrgDepartment,
  OrgEmployee,
  OrgRole,
  orgSchema,
  type DepartmentRow,
  type EmployeeRow,
  type OrgDb,
  type RoleRow,
} from './entities.ts';

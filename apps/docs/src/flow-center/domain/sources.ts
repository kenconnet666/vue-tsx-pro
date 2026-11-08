/**
 * 单据里的数据来源（组件库的 formSources）：供应商字典、从库里的组织选人、上传附件（演示里不真的上传，记下文件名）。
 * 流程中心的页面用 Provider 给一次（组织变了重建），字段的 meta 按名字引用（`options: { source: 'suppliers' }`、人员字段）。
 */
import {
  localPeopleSource,
  type FormSources,
  type PeopleEntry,
  type PeopleNode,
} from '@zerodep-dev/vue-tsx-pro-ui';
import type { OrgSnapshot } from '@zerodep-dev/flow-ts-engine/org';
import { SUPPLIER_ROWS } from './business-data';

/** 供应商（字典，来自业务库的种子）：值是编号，写进单据；停用的标出来 */
export const SUPPLIERS = SUPPLIER_ROWS.map((s) => ({
  value: s.id,
  label: s.blocked ? `${s.name}（停用：${s.blockedReason}）` : s.name,
}));

/** 部门树（在职的人挂在所在部门下）→ 选人用的组织架构 */
function tree(org: OrgSnapshot, parent: string | null): PeopleNode[] {
  return org.departments
    .filter((d) => d.parentId === parent)
    .map((d) => ({
      id: d.id,
      type: 'department',
      name: d.name,
      children: [
        ...tree(org, d.id),
        ...org.employees
          .filter((e) => e.active && e.departmentId === d.id)
          .map((e): PeopleNode => ({
            id: e.id,
            type: 'user',
            name: e.name,
            description: e.title ? `${d.name} · ${e.title}` : d.name,
          })),
      ],
    }));
}

/** 按库里的组织建数据来源 */
export function formSourcesOf(org: OrgSnapshot): FormSources {
  const roles: PeopleEntry[] = org.roles.map((r) => ({ id: r.id, type: 'role', name: r.name }));
  return {
    options: { suppliers: SUPPLIERS },
    people: localPeopleSource(tree(org, null), roles),
    // 演示：不传到哪里，记下文件名与大小当作已上传
    upload: async (file) => ({ id: `${Date.now()}-${file.name}`, url: '' }),
  };
}

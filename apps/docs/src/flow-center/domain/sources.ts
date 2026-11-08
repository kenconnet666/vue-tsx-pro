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

/** 供应商（字典）：值写进单据 */
export const SUPPLIERS = [
  { value: 'huadong', label: '华东数码' },
  { value: 'huanan', label: '华南视讯' },
  { value: 'beifang', label: '北方办公' },
  { value: 'xibu', label: '西部线缆' },
];

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

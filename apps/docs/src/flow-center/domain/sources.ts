/**
 * 单据里的数据来源（组件库的 formSources）：供应商字典、从演示公司的组织里选人、上传附件（演示里不真的上传，记下文件名）。
 * 流程中心的页面用 Provider 给一次，字段的 meta 按名字引用（`options: { source: 'suppliers' }`、人员字段）。
 */
import {
  localPeopleSource,
  type FormSources,
  type PeopleEntry,
  type PeopleNode,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { DEPARTMENTS, PEOPLE, ROLES } from './org';

/** 供应商（字典）：值写进单据 */
export const SUPPLIERS = [
  { value: 'huadong', label: '华东数码' },
  { value: 'huanan', label: '华南视讯' },
  { value: 'beifang', label: '北方办公' },
  { value: 'xibu', label: '西部线缆' },
];

/** 部门树 → 选人用的组织架构 */
function tree(parent: string | null): PeopleNode[] {
  return DEPARTMENTS.filter((d) => d.parent === parent).map((d) => ({
    id: d.id,
    type: 'department',
    name: d.name,
    children: [
      ...tree(d.id),
      ...PEOPLE.filter((p) => p.department === d.id).map((p): PeopleNode => ({
        id: p.id,
        type: 'user',
        name: p.name,
        description: `${d.name} · ${p.title}`,
      })),
    ],
  }));
}

const roles: PeopleEntry[] = Object.entries(ROLES).map(([id, name]) => ({
  id,
  type: 'role',
  name,
}));

export const formSources: FormSources = {
  options: { suppliers: SUPPLIERS },
  people: localPeopleSource(tree(null), roles),
  // 演示：不传到哪里，记下文件名与大小当作已上传
  upload: async (file) => ({ id: `${Date.now()}-${file.name}`, url: '' }),
};

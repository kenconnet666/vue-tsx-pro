// 示例用的组织架构：公司下面三个部门，采购部再分两个组；另有四个角色
import type { PeopleEntry, PeopleNode } from '@zerodep-dev/vue-tsx-pro-ui';

const person = (id: string, name: string, description: string): PeopleNode => ({
  id,
  type: 'user',
  name,
  description,
});

const department = (
  id: string,
  name: string,
  description: string,
  children: PeopleNode[],
): PeopleNode => ({ id, type: 'department', name, description, children });

export const org: PeopleNode[] = [
  department('d-buy', '采购部', '公司', [
    department('d-buy-source', '寻源组', '采购部', [
      person('u-zhao', '赵一凡', '采购部 · 寻源工程师'),
      person('u-sun', '孙悦', '采购部 · 寻源工程师'),
    ]),
    department('d-buy-exec', '执行组', '采购部', [
      person('u-zhou', '周婷', '采购部 · 采购专员'),
      person('u-wu', '吴昊', '采购部 · 采购专员'),
    ]),
    person('u-lin', '林晓', '采购部 · 经理'),
  ]),
  department('d-qa', '质量部', '公司', [
    person('u-chen', '陈思雨', '质量部 · 经理'),
    person('u-li', '李想', '质量部 · 质量工程师'),
  ]),
  department('d-fin', '财务部', '公司', [
    person('u-wang', '王建国', '财务部 · 经理'),
    person('u-wu-jia', '吴佳', '财务部 · 会计'),
    person('u-zheng', '郑一鸣', '财务部 · 出纳'),
  ]),
];

export const roles: PeopleEntry[] = [
  { id: 'r-buyer', type: 'role', name: '采购专员', description: '采购部' },
  { id: 'r-buy-manager', type: 'role', name: '采购经理', description: '采购部' },
  { id: 'r-qa', type: 'role', name: '质量工程师', description: '质量部' },
  { id: 'r-cashier', type: 'role', name: '出纳', description: '财务部' },
];

/**
 * 演示公司的组织：部门（树）、角色、员工（带上级）。第一次打开时由 Worker 同步进库（引擎的组织目录 `flow-ts-engine/org`），
 * 之后页面、引擎都从库里读（管理页改了也就生效）。编号都是数字的文字（同真实系统的工号、部门编码）。
 */
import type { OrgData } from '@zerodep-dev/flow-ts-engine/org';

/** 角色的编号（定义里按它写处理人） */
export const ROLE = {
  head: '1',
  finance: '2',
  hr: '3',
  purchasing: '4',
  legal: '5',
  ceo: '6',
} as const;

/** 演示身份默认是林小满（前端组长，有下属的请假要批） */
export const DEFAULT_ACTOR = '1003';

/** 员工的一行：编号、名字、职务、部门、直属上级、角色 */
const e = (
  id: string,
  name: string,
  title: string,
  departmentId: string,
  managerId: string | null,
  roles: string[] = [],
) => ({ id, name, title, departmentId, managerId, roles });

/** 写进库的组织 */
export const ORG: OrgData = {
  roles: [
    { id: ROLE.head, name: '部门负责人' },
    { id: ROLE.finance, name: '财务' },
    { id: ROLE.hr, name: '人事' },
    { id: ROLE.purchasing, name: '采购' },
    { id: ROLE.legal, name: '法务' },
    { id: ROLE.ceo, name: '总经理' },
  ],
  departments: [
    { id: '10', name: '总经办', parentId: null, headId: '1001', sort: 0 },
    { id: '20', name: '研发中心', parentId: '10', headId: '1002', sort: 1 },
    { id: '21', name: '前端组', parentId: '20', headId: '1003', sort: 2 },
    { id: '22', name: '后端组', parentId: '20', headId: '1004', sort: 3 },
    { id: '30', name: '财务部', parentId: '10', headId: '1010', sort: 4 },
    { id: '40', name: '人事部', parentId: '10', headId: '1013', sort: 5 },
    { id: '50', name: '采购部', parentId: '10', headId: '1015', sort: 6 },
    { id: '60', name: '销售部', parentId: '10', headId: '1018', sort: 7 },
    { id: '70', name: '法务部', parentId: '10', headId: '1021', sort: 8 },
  ],
  employees: [
    e('1001', '顾承远', '总经理', '10', null, [ROLE.ceo, ROLE.head]),
    e('1002', '沈若水', '研发总监', '20', '1001', [ROLE.head]),
    e('1003', '林小满', '前端组长', '21', '1002', [ROLE.head]),
    e('1004', '周启航', '后端组长', '22', '1002', [ROLE.head]),
    e('1005', '陈晓', '前端工程师', '21', '1003'),
    e('1006', '许知意', '前端工程师', '21', '1003'),
    e('1007', '韩东', '后端工程师', '22', '1004'),
    e('1008', '苏念', '后端工程师', '22', '1004'),
    e('1009', '魏然', '测试工程师', '20', '1002'),
    e('1010', '钱明哲', '财务经理', '30', '1001', [ROLE.head, ROLE.finance]),
    e('1011', '孙悦', '会计', '30', '1010', [ROLE.finance]),
    e('1012', '方晴', '出纳', '30', '1010', [ROLE.finance]),
    e('1013', '赵一鸣', '人事经理', '40', '1001', [ROLE.head, ROLE.hr]),
    e('1014', '杨柳', '招聘专员', '40', '1013', [ROLE.hr]),
    e('1015', '吴昊', '采购经理', '50', '1001', [ROLE.head, ROLE.purchasing]),
    e('1016', '郑可', '采购专员', '50', '1015', [ROLE.purchasing]),
    e('1017', '冯远', '采购专员', '50', '1015', [ROLE.purchasing]),
    e('1018', '何静', '销售总监', '60', '1001', [ROLE.head]),
    e('1019', '吕晨', '客户经理', '60', '1018'),
    e('1020', '施雨', '客户经理', '60', '1018'),
    e('1021', '蒋律', '法务经理', '70', '1001', [ROLE.head, ROLE.legal]),
    e('1022', '袁清', '法务专员', '70', '1021', [ROLE.legal]),
  ],
};

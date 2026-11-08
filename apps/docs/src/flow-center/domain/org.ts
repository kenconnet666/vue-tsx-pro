/**
 * 演示公司的组织：部门（树）、角色、员工（带上级）。引擎的 org（角色、部门展开成人）与处理人解析器（直属上级、部门负责人）建在它上面；
 * 顶栏切换演示身份时也从这里取人。编号都是数字的文字（同真实系统的自增主键）。
 */
import type { Actor, FlowEngineOptions, Resolver } from '@zerodep-dev/flow-ts-engine';

/** 部门 */
export interface Department {
  readonly id: string;
  readonly name: string;
  /** 上级部门 */
  readonly parent: string | null;
  /** 部门负责人 */
  readonly head: string;
}

/** 员工 */
export interface Person {
  readonly id: string;
  readonly name: string;
  /** 职务（显示用） */
  readonly title: string;
  readonly department: string;
  readonly roles: readonly string[];
  /** 直属上级；总经理没有 */
  readonly manager: string | null;
}

/** 角色：编号 → 名字 */
export const ROLES: Readonly<Record<string, string>> = {
  '1': '部门负责人',
  '2': '财务',
  '3': '人事',
  '4': '采购',
  '5': '法务',
  '6': '总经理',
};

/** 角色的编号（定义里按它写处理人） */
export const ROLE = {
  head: '1',
  finance: '2',
  hr: '3',
  purchasing: '4',
  legal: '5',
  ceo: '6',
} as const;

export const DEPARTMENTS: readonly Department[] = [
  { id: '10', name: '总经办', parent: null, head: '1001' },
  { id: '20', name: '研发中心', parent: '10', head: '1002' },
  { id: '21', name: '前端组', parent: '20', head: '1003' },
  { id: '22', name: '后端组', parent: '20', head: '1004' },
  { id: '30', name: '财务部', parent: '10', head: '1010' },
  { id: '40', name: '人事部', parent: '10', head: '1013' },
  { id: '50', name: '采购部', parent: '10', head: '1015' },
  { id: '60', name: '销售部', parent: '10', head: '1018' },
  { id: '70', name: '法务部', parent: '10', head: '1021' },
];

const p = (
  id: string,
  name: string,
  title: string,
  department: string,
  manager: string | null,
  roles: readonly string[] = [],
): Person => ({ id, name, title, department, manager, roles });

export const PEOPLE: readonly Person[] = [
  p('1001', '顾承远', '总经理', '10', null, [ROLE.ceo, ROLE.head]),
  p('1002', '沈若水', '研发总监', '20', '1001', [ROLE.head]),
  p('1003', '林小满', '前端组长', '21', '1002', [ROLE.head]),
  p('1004', '周启航', '后端组长', '22', '1002', [ROLE.head]),
  p('1005', '陈晓', '前端工程师', '21', '1003'),
  p('1006', '许知意', '前端工程师', '21', '1003'),
  p('1007', '韩东', '后端工程师', '22', '1004'),
  p('1008', '苏念', '后端工程师', '22', '1004'),
  p('1009', '魏然', '测试工程师', '20', '1002'),
  p('1010', '钱明哲', '财务经理', '30', '1001', [ROLE.head, ROLE.finance]),
  p('1011', '孙悦', '会计', '30', '1010', [ROLE.finance]),
  p('1012', '方晴', '出纳', '30', '1010', [ROLE.finance]),
  p('1013', '赵一鸣', '人事经理', '40', '1001', [ROLE.head, ROLE.hr]),
  p('1014', '杨柳', '招聘专员', '40', '1013', [ROLE.hr]),
  p('1015', '吴昊', '采购经理', '50', '1001', [ROLE.head, ROLE.purchasing]),
  p('1016', '郑可', '采购专员', '50', '1015', [ROLE.purchasing]),
  p('1017', '冯远', '采购专员', '50', '1015', [ROLE.purchasing]),
  p('1018', '何静', '销售总监', '60', '1001', [ROLE.head]),
  p('1019', '吕晨', '客户经理', '60', '1018'),
  p('1020', '施雨', '客户经理', '60', '1018'),
  p('1021', '蒋律', '法务经理', '70', '1001', [ROLE.head, ROLE.legal]),
  p('1022', '袁清', '法务专员', '70', '1021', [ROLE.legal]),
];

const byId = new Map(PEOPLE.map((person) => [person.id, person]));

/** 按编号找人 */
export const personOf = (id: string | null | undefined): Person | undefined =>
  id ? byId.get(id) : undefined;

/** 名字；找不到时是编号 */
export const nameOf = (id: string | null | undefined): string => personOf(id)?.name ?? id ?? '';

/** 部门和它下面所有部门的编号 */
function subtree(id: string): string[] {
  return [id, ...DEPARTMENTS.filter((d) => d.parent === id).flatMap((d) => subtree(d.id))];
}

/** 引擎眼里的这个人：角色、所在部门（含上级部门，部门的收件箱上级部门的人也看得到时用） */
export function actorOf(person: Person): Actor {
  return {
    id: person.id,
    name: person.name,
    roles: person.roles,
    departments: [person.department],
    admin: person.roles.includes(ROLE.ceo),
  };
}

/** 引擎的 org：角色、部门展开成人 */
export const org: NonNullable<FlowEngineOptions['org']> = {
  members: (source) => {
    if ('role' in source)
      return PEOPLE.filter((p) => p.roles.includes(source.role)).map((p) => p.id);
    if ('department' in source) {
      const ids = subtree(source.department);
      return PEOPLE.filter((p) => ids.includes(p.department)).map((p) => p.id);
    }
    return [];
  },
};

/** 处理人解析器：发起人的直属上级、发起人所在部门的负责人（是自己时往上一级） */
export const resolvers: Readonly<Record<string, Resolver>> = {
  manager: ({ instance }) => {
    const manager = personOf(instance.startedBy)?.manager;
    return manager ? [manager] : [];
  },
  departmentHead: ({ instance }) => {
    const person = personOf(instance.startedBy);
    let department = DEPARTMENTS.find((d) => d.id === person?.department);
    while (department && department.head === person?.id && department.parent)
      department = DEPARTMENTS.find((d) => d.id === department!.parent);
    return department ? [department.head] : [];
  },
};

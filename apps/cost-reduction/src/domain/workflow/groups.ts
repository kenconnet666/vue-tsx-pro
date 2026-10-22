/**
 * 岗位收件箱（流程里的候选组）：成本团队、PEMO、项目团队、商务、财务各一个；产品团队按责任一级团队分开
 * （`product:FC`）。一个人属于哪些收件箱由角色与所属团队决定；负责人（leads）在没人认领时指定承办人
 */
import type { Person } from '../master';
import type { RoleKey } from '../roles';

/** 只有一个收件箱的岗位 */
const roleGroups: Partial<Record<RoleKey, string>> = {
  cost: 'cost',
  pemo: 'pemo',
  project: 'project',
  business: 'business',
  finance: 'finance',
};

/** 产品团队的收件箱：按责任一级团队的缩写 */
export const productGroup = (teamCode: string) => `product:${teamCode}`;

/** 收件箱的名称 */
export function groupName(group: string, teams: readonly { name: string; code: string }[]): string {
  if (group.startsWith('product:')) {
    const code = group.slice('product:'.length);
    return teams.find((team) => team.code === code)?.name ?? `产品团队 ${code}`;
  }
  return (
    { cost: '成本团队', pemo: 'PEMO', project: '项目团队', business: '商务', finance: '财务' }[
      group
    ] ?? group
  );
}

/** 一个人所在的收件箱 */
export function groupsOf(
  person: Pick<Person, 'roles' | 'team'>,
  teams: readonly { name: string; code: string }[],
): string[] {
  const groups = person.roles.flatMap((role) => roleGroups[role] ?? []);
  if (person.roles.includes('product') && person.team) {
    const code = teams.find((team) => team.name === person.team)?.code;
    if (code) groups.push(productGroup(code));
  }
  return groups;
}

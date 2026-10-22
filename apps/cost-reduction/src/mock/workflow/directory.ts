/** 流转模拟用的人员与岗位：按主数据里的角色、团队与负责的收件箱 */
import type { MasterData } from '../../domain/master';
import { groupsOf } from '../../domain/workflow/groups';
import type { WorkflowDirectory } from './engine';

/** 按主数据建人员与岗位 */
export function createDirectory(master: MasterData): WorkflowDirectory {
  const groups = new Map(
    master.people.map((person) => [person.id, groupsOf(person, master.teams)]),
  );
  return {
    inGroup: (user, group) => groups.get(user)?.includes(group) ?? false,
    leaderOf: (group) => master.people.find((person) => person.leads?.includes(group))?.id ?? null,
  };
}

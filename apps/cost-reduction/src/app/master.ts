/**
 * 主数据与字典的缓存：启动时取一次（main.ts 等它取回再挂载页面），之后各页同步读取。
 * 下拉的选项、工号换姓名、团队的简称都从这里取，不在页面里写死
 */
import { shallowRef } from 'vue';
import { getMaster } from '../api/session';
import { labelOf, type DictItem, type Dictionaries, type MasterData } from '../domain/master';

const data = shallowRef<MasterData | null>(null);

/** 取主数据（启动时调用一次） */
export async function loadMaster(): Promise<void> {
  data.value = await getMaster();
}

/** 主数据：启动时已经取回 */
export function master(): MasterData {
  if (!data.value) throw new Error('主数据还没加载：先在 main.ts 里等 loadMaster() 完成');
  return data.value;
}

/** 一个字典的选项 */
export const dict = (name: keyof Dictionaries): readonly DictItem[] => master().dictionaries[name];

/** 字典里的值 → 名称 */
export const dictLabel = (name: keyof Dictionaries, value: string) => labelOf(dict(name), value);

/** 工号 → 姓名；不认识的工号原样显示 */
export const personName = (id: string) =>
  master().people.find((person) => person.id === id)?.name ?? id;

/** 人员的选项（联络人、工程责任人）：值是工号，第二行是单位与岗位；供应商账号不在里面 */
export const staffOptions = () =>
  master()
    .people.filter((person) => !person.supplier)
    .map((person) => ({ value: person.id, label: person.name, description: person.title }));

/** 责任一级团队的名称 */
export const teamNames = () => master().teams.map((team) => team.name);

/** 团队名去掉“集成团队”的后缀：表格的列窄；全称放在悬停提示里 */
export const shortTeam = (team: string) => team.replace('集成团队', '');

/** 提出单位下属的部门 */
export const deptsOf = (org: string) =>
  master().orgs.find((item) => item.name === org)?.depts ?? [];

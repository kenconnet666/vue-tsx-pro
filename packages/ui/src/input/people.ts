/**
 * 人员与组织选择器（PeoplePicker、PeoplePickerPanel）的数据：选的是人员、部门、岗位三种，数据由接入方的 source 提供。
 *
 *   const source: PeopleSource = {
 *     children: (parent, signal) => http.get('/org/children', { query: { parent: parent?.id }, signal }),
 *     search: (query, signal) => http.get('/org/search', { query: { q: query }, signal }),
 *     positions: (signal) => http.get('/org/positions', { signal }),
 *   };
 *   <PeoplePicker source={source} _value={owners} />
 *
 * 选中的值是 PeopleEntry 的数组（带名字，回显不用再查）；同一个人、部门按 type + id 判断（peopleKey）。
 * 组织架构不大、已经整棵在前端时用 localPeopleSource。
 */

/** 能选的类型 */
export interface PeopleTypes {
  /** 人员 */
  user: unknown;
  /** 部门：选中就是部门里的人（怎么展开由后端定） */
  department: unknown;
  /** 岗位（角色）：流程的岗位收件箱 */
  position: unknown;
}

/** 能选的类型 */
export type PeopleType = keyof PeopleTypes;

/** 一个人员、部门或岗位 */
export interface PeopleEntry {
  /** 标识：同一种类型里唯一（工号、部门编码、岗位编码） */
  id: string;
  /** 类型 */
  type: PeopleType;
  /** 名字 */
  name: string;
  /** 说明：人员的部门与岗位、部门的上级路径；搜索结果里分辨同名的 */
  description?: string;
  /** 头像地址（人员）；没有时显示名字的头一个字 */
  avatar?: string;
  /** 部门下还有子部门或人员；false 时没有“下级”，不写时按有 */
  hasChildren?: boolean;
}

/** 数据来源：接入方按自己的接口实现；signal 在换了部门、改了搜索词、关掉选择器时中止 */
export interface PeopleSource {
  /** 一个部门下的子部门与人员（部门在前）；parent 为 null 时是最上层 */
  children(parent: PeopleEntry | null, signal: AbortSignal): Promise<readonly PeopleEntry[]>;
  /** 按关键字搜，人员、部门、岗位都可以返回；不写时没有搜索框 */
  search?(query: string, signal: AbortSignal): Promise<readonly PeopleEntry[]>;
  /** 全部岗位；不写时没有“岗位”页 */
  positions?(signal: AbortSignal): Promise<readonly PeopleEntry[]>;
}

/** 组织架构的一个节点：部门带着下级 */
export interface PeopleNode extends PeopleEntry {
  /** 子部门与人员 */
  children?: readonly PeopleNode[];
}

/** 同一个人员、部门、岗位的键：类型加标识 */
export const peopleKey = (entry: Pick<PeopleEntry, 'type' | 'id'>) => `${entry.type}:${entry.id}`;

/** 去掉下级、只留这一项本身（写进选中的值、最近选过的） */
const plain = ({ id, type, name, description, avatar, hasChildren }: PeopleEntry): PeopleEntry => ({
  id,
  type,
  name,
  ...(description != null ? { description } : {}),
  ...(avatar != null ? { avatar } : {}),
  ...(hasChildren != null ? { hasChildren } : {}),
});

/**
 * 整棵在前端的组织架构做成数据来源：示例、测试与规模不大的系统直接用。
 * 搜索按名字与说明（不分大小写），岗位单独给；部门的 hasChildren 按有没有 children 填上
 */
export function localPeopleSource(
  tree: readonly PeopleNode[],
  positions: readonly PeopleEntry[] = [],
): PeopleSource {
  const byKey = new Map<string, PeopleNode>();
  const all: PeopleNode[] = [];
  const visit = (level: readonly PeopleNode[]) => {
    for (const node of level) {
      byKey.set(peopleKey(node), node);
      all.push(node);
      visit(node.children ?? []);
    }
  };
  visit(tree);
  const view = (node: PeopleNode): PeopleEntry =>
    plain(node.type === 'department' ? { ...node, hasChildren: !!node.children?.length } : node);
  const matches = (entry: PeopleEntry, text: string) =>
    entry.name.toLocaleLowerCase().includes(text) ||
    !!entry.description?.toLocaleLowerCase().includes(text);
  return {
    children: (parent) =>
      Promise.resolve((parent ? (byKey.get(peopleKey(parent))?.children ?? []) : tree).map(view)),
    search: (query) => {
      const text = query.trim().toLocaleLowerCase();
      return Promise.resolve(
        [...all.map(view), ...positions.map(plain)].filter((entry) => matches(entry, text)),
      );
    },
    ...(positions.length > 0 ? { positions: () => Promise.resolve(positions.map(plain)) } : {}),
  };
}

/** 写进值里的一项：去掉下级与其他字段 */
export const toPeopleValue = plain;

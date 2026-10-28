/**
 * 处理人解析：定义里的来源（指定的人、角色、部门、发起人、同某节点、解析器）→ 候选。
 * 只解析出人时直接落到人（一个人）或进以这些人为候选的收件箱；有角色、部门时进收件箱，由其中的人认领
 */
import { isRef, type AssigneeSource } from '@zerodep-dev/flow-ts-model';
import { FlowError } from './errors.ts';
import type { ExtensionContext, FlowEngineOptions } from './types.ts';

/** 一个候选 */
export interface Candidate {
  readonly kind: 'user' | 'role' | 'department' | 'group';
  readonly value: string;
}

/** 解析时用到的：取值、最后的处理人、发起人、扩展 */
export interface ResolveScope {
  readonly context: ExtensionContext;
  readonly handledBy: Readonly<Record<string, string>>;
  readonly options: FlowEngineOptions;
}

/** 值或引用 → 文字编号；引用的值是数组时展开 */
function idsOf(value: unknown, scope: ResolveScope): string[] {
  const raw = isRef(value) ? scope.context.read(value.ref) : value;
  if (raw === undefined || raw === null || raw === '') return [];
  return (Array.isArray(raw) ? raw : [raw]).map(String);
}

/** 解析处理人的来源，去重 */
export async function resolveCandidates(
  sources: readonly AssigneeSource[],
  scope: ResolveScope,
): Promise<Candidate[]> {
  const found: Candidate[] = [];
  const add = (kind: Candidate['kind'], values: readonly string[]) => {
    for (const value of values) {
      if (!found.some((c) => c.kind === kind && c.value === value)) found.push({ kind, value });
    }
  };
  for (const source of sources) {
    if ('user' in source) add('user', idsOf(source.user, scope));
    else if ('role' in source) add('role', idsOf(source.role, scope));
    else if ('department' in source) add('department', idsOf(source.department, scope));
    else if ('initiator' in source) add('user', [scope.context.instance.startedBy]);
    else if ('sameAs' in source) {
      const user = scope.handledBy[source.sameAs];
      if (user) add('user', [user]);
    } else if ('resolver' in source) {
      const resolver = scope.options.extensions?.resolvers?.[source.resolver];
      if (!resolver) {
        throw new FlowError('invalid-definition', `没有注册处理人解析器 ${source.resolver}`);
      }
      add('user', [...(await resolver({ ...scope.context, args: source.args ?? {} }))].map(String));
    } else if ('group' in source) {
      add(
        'group',
        idsOf(source.id, scope).map((id) => `${source.group}:${id}`),
      );
    } else {
      throw new FlowError('invalid-definition', '这一版不支持“上一步的处理人选”（pick）');
    }
  }
  return found;
}

/** 候选展开成人（会签的参与人、抄送）：角色、部门、扩展种类经 org.members 展开 */
export async function expandToUsers(
  candidates: readonly Candidate[],
  options: FlowEngineOptions,
): Promise<string[]> {
  const users: string[] = [];
  for (const candidate of candidates) {
    const members =
      candidate.kind === 'user'
        ? [candidate.value]
        : await requireOrg(options).members(
            candidate.kind === 'role'
              ? { role: candidate.value }
              : candidate.kind === 'department'
                ? { department: candidate.value }
                : { group: candidate.value },
          );
    for (const user of members) if (!users.includes(user)) users.push(user);
  }
  return users;
}

function requireOrg(options: FlowEngineOptions) {
  if (!options.org) {
    throw new FlowError(
      'invalid-definition',
      '要把角色、部门展开成人（会签、抄送），引擎的选项里要给 org',
    );
  }
  return options.org;
}

/**
 * 预测下一步（Java 场景 preview-skip-sign、purchase-views、pick）：发起页、待办详情按选的结果往下看会到哪些节点、谁处理。
 * - 按模型包的 selectEdges 选边，穿过网关与抄送；会被自动跳过的人工节点（处理人就是发起人、与上一步相同）不停，按“同意”接着看；
 * - 会签列出参与的每个人，单人的列出那个人，落到角色、部门（收件箱）的说 inbox；结束、自动节点列出来但不往后看。
 *
 * 上一步选下一步的处理人：节点的处理人写 `{ pick: { from?, max? } }` 时，由走到它之前的那一步选人。预测里带上要选人的节点与能选的人，
 * 提交时查（没选、选了不能选的人、选多了），记进运行状态的 picks，走到那个节点时由选的人处理（assignees.ts）。
 */
import {
  selectEdges,
  type ProcessDefinition,
  type ProcessGraph,
  type ProcessNode,
  type RouteInput,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import { expandToUsers, resolveCandidates, type ResolveScope } from './assignees.ts';
import { FlowError } from './errors.ts';

/** 一个要选处理人的下一步 */
export interface PickPrompt {
  /** 节点 */
  readonly node: string;
  /** 节点的名字 */
  readonly nodeName: string;
  /** 最多选几个；不限时为 null */
  readonly max: number | null;
  /** 能选的人（用户编号）；不限时为 null（从整个组织里选） */
  readonly candidates: readonly string[] | null;
}

/** 预测的一个下一步 */
export interface NextStep {
  readonly node: string;
  readonly nodeName: string;
  /** 节点类型：task、end、service…… */
  readonly type: ProcessNode['type'];
  /** 处理的人（用户编号）：单人的那一个、会签的每一个；进收件箱、要上一步选人时是空的 */
  readonly handlers: readonly string[];
  /** 进收件箱（角色、部门里谁有空谁认领） */
  readonly inbox: boolean;
  /** 要上一步选处理人时：能选的人与最多几个 */
  readonly pick: PickPrompt | null;
}

/** 提交时选的人：节点 → 用户编号 */
export type Picks = Readonly<Record<string, readonly (string | number)[]>>;

/** 预测时要知道的：图、定义的设置、解析处理人、发起人与这一步的处理人（自动跳过按它们判断） */
export interface PredictScope extends ResolveScope {
  readonly graph: ProcessGraph;
  readonly definition: ProcessDefinition;
  /** 刚处理完的人（发起时是发起人） */
  readonly previous: string;
}

/** 预测时穿过去的节点：网关与抄送 */
const PASS_THROUGH: ReadonlySet<string> = new Set(['exclusive', 'inclusive', 'parallel', 'cc']);

/** 节点的 `{ pick }` 来源 */
function pickOf(node: TaskNode) {
  for (const source of node.assignees ?? []) if ('pick' in source) return source.pick;
  return undefined;
}

/** 没写处理人时用所在泳道的收件箱（同 execution.ts） */
function sourcesOf(graph: ProcessGraph, node: TaskNode) {
  if (node.assignees) return node.assignees;
  const inbox = graph.lane(node.lane)?.inbox;
  if (!inbox) return [];
  if ('role' in inbox) return [{ role: inbox.role }];
  if ('department' in inbox) return [{ department: inbox.department }];
  return [{ group: inbox.group, id: inbox.id }];
}

/** 从一个节点按结果往下看 */
export async function nextSteps(
  scope: PredictScope,
  from: string,
  input: RouteInput,
): Promise<NextStep[]> {
  const steps: NextStep[] = [];
  const seen = new Set<string>();
  const base = (node: ProcessNode) => ({ node: node.id, nodeName: node.name, type: node.type });
  const walk = async (id: string, outcome: string | null): Promise<void> => {
    for (const edge of selectEdges(scope.graph, id, { read: input.read, outcome })) {
      const node = scope.graph.node(edge.to);
      if (!node || seen.has(node.id)) continue;
      seen.add(node.id);
      if (PASS_THROUGH.has(node.type)) {
        await walk(node.id, null);
        continue;
      }
      if (node.type !== 'task') {
        steps.push({ ...base(node), handlers: [], inbox: false, pick: null });
        continue;
      }
      const pick = pickOf(node);
      if (pick) {
        const candidates = pick.from
          ? await expandToUsers(await resolveCandidates(pick.from, scope), scope.options)
          : null;
        steps.push({
          ...base(node),
          handlers: [],
          inbox: false,
          pick: { node: node.id, nodeName: node.name, max: pick.max ?? null, candidates },
        });
        continue;
      }
      if (node.multi) {
        const sources = Array.isArray(node.multi.participants)
          ? node.multi.participants
          : [{ user: node.multi.participants as never }];
        const users = await expandToUsers(await resolveCandidates(sources, scope), scope.options);
        steps.push({ ...base(node), handlers: users, inbox: false, pick: null });
        continue;
      }
      const candidates = await resolveCandidates(sourcesOf(scope.graph, node), scope);
      const direct =
        candidates.length === 1 && candidates[0]!.kind === 'user' ? candidates[0]!.value : null;
      // 会被自动跳过：按“同意”接着往下看（同 execution.ts 的 arriveTask）
      const skip = node.autoSkip ?? scope.definition.settings?.autoSkip;
      const approve = node.outcomes.find((o) => (o.kind ?? 'approve') === 'approve');
      const skipped =
        direct !== null &&
        approve !== undefined &&
        ((skip?.initiator && direct === scope.context.instance.startedBy) ||
          (skip?.sameAsPrevious && direct === scope.previous));
      if (skipped) {
        await walk(node.id, approve.key);
        continue;
      }
      steps.push({
        ...base(node),
        handlers: direct === null ? [] : [direct],
        inbox: direct === null && candidates.length > 0,
        pick: null,
      });
    }
  };
  await walk(from, input.outcome ?? null);
  return steps;
}

/** 预测里要选处理人的节点 */
export const picksOf = (steps: readonly NextStep[]): PickPrompt[] =>
  steps.flatMap((step) => (step.pick ? [step.pick] : []));

/** 查提交的选人：每个要选的节点都选了、选的人能选、没选多；通过时返回整理好的（编号是文字） */
export function checkPicks(
  prompts: readonly PickPrompt[],
  given: Picks | undefined,
): Record<string, string[]> {
  const picks: Record<string, string[]> = {};
  const errors: { field: string; code: string }[] = [];
  for (const prompt of prompts) {
    const ids = [...new Set((given?.[prompt.node] ?? []).map(String))];
    const field = `picks.${prompt.node}`;
    if (ids.length === 0) errors.push({ field, code: 'required' });
    else if (prompt.candidates && ids.some((id) => !prompt.candidates!.includes(id)))
      errors.push({ field, code: 'not-allowed' });
    else if (prompt.max !== null && ids.length > prompt.max)
      errors.push({ field, code: 'too-many' });
    else picks[prompt.node] = ids;
  }
  const [first] = errors;
  if (first) {
    const name = prompts.find((p) => `picks.${p.node}` === first.field)?.nodeName ?? first.field;
    throw new FlowError(
      'invalid-input',
      first.code === 'required' ? `要给“${name}”选处理人` : `给“${name}”选的人不对`,
      { field: first.field, code: first.code, errors },
    );
  }
  return picks;
}

/**
 * 代理（docs/decisions/0010 第 3 节）：某人不在（休假、出差）时设一段时间、哪些流程，新到他手上的待办交给代理人，
 * 待办上记着本该是谁的（proxyFor）。到达时解析（Execution.insertItem），已经在手上的不动——要交出去用转办。
 * 代理人自己也设了代理时顺着找下去（绕回来的就停在绕回之前的那个人）；收件箱里的候选人设了代理时，代理人也加进候选。
 */
import type { Row } from '@zerodep-dev/easy-query-ts';
import { FlowProxy, type FlowDb } from '../core/entities.ts';
import type { EngineCore } from '../core/context.ts';
import { FlowError } from '../core/errors.ts';
import type { Actor } from '../types.ts';
import type { ProxyInput, ProxyView } from '../views.ts';

/** 这一刻对这个流程生效的代理规则（新设的优先） */
async function activeRule(db: FlowDb, user: string, processKey: string, now: Date) {
  const rules = await db
    .queryable(FlowProxy)
    .where((p) => [p.principal.eq(user), p.cancelledAt.isNull(), p.startsAt.le(now)])
    .orderBy((p) => p.id.desc())
    .toList();
  return rules.find(
    (r) =>
      (r.endsAt === null || r.endsAt > now) &&
      (r.processKeys.length === 0 || r.processKeys.includes(processKey)),
  );
}

/** 这个人这一刻的代理人（顺着代理人的代理找到底）；没设代理时为空 */
export async function agentOf(
  db: FlowDb,
  user: string,
  processKey: string,
  now: Date,
): Promise<string | null> {
  const seen = new Set([user]);
  let current = user;
  for (;;) {
    const rule = await activeRule(db, current, processKey, now);
    if (!rule || seen.has(rule.agent)) return current === user ? null : current;
    seen.add(rule.agent);
    current = rule.agent;
  }
}

const proxyView = (row: Row<typeof FlowProxy>, now: Date): ProxyView => ({
  id: row.id,
  principal: row.principal,
  agent: row.agent,
  processKeys: row.processKeys,
  startsAt: row.startsAt,
  endsAt: row.endsAt,
  note: row.note,
  createdAt: row.createdAt,
  active: row.startsAt <= now && (row.endsAt === null || row.endsAt > now),
});

/** 代理规则：装进引擎核心（core.proxies） */
export function createProxies(core: EngineCore) {
  const { db, now } = core;

  /** 只能管自己的；管理员可以替别人设 */
  const ownerOf = (actor: Actor, principal: string | undefined) => {
    const owner = principal ?? actor.id;
    if (owner !== actor.id && !actor.admin)
      throw new FlowError('forbidden', '只能设自己的代理', { principal: owner });
    return owner;
  };

  /** 我设的、别人交给我的，还没结束的（没撤销、没过期），新设的在前 */
  async function list(actor: Actor): Promise<{ mine: ProxyView[]; forMe: ProxyView[] }> {
    const at = now();
    const rows = (
      await db
        .queryable(FlowProxy)
        .where((p) => [p.cancelledAt.isNull()])
        .orderBy((p) => p.id.desc())
        .toList()
    ).filter(
      (r) => (r.principal === actor.id || r.agent === actor.id) && (!r.endsAt || r.endsAt > at),
    );
    return {
      mine: rows.filter((r) => r.principal === actor.id).map((r) => proxyView(r, at)),
      forMe: rows.filter((r) => r.agent === actor.id).map((r) => proxyView(r, at)),
    };
  }

  /** 设一条代理：开始不写是现在，结束不写是一直到撤销；流程不写是全部 */
  async function save(actor: Actor, input: ProxyInput): Promise<ProxyView> {
    const principal = ownerOf(actor, input.principal);
    const at = now();
    const startsAt = input.startsAt ?? at;
    const endsAt = input.endsAt ?? null;
    if (!input.agent) throw new FlowError('invalid-input', '要写代理人');
    if (input.agent === principal) throw new FlowError('invalid-input', '代理人不能是自己');
    if (endsAt && endsAt <= startsAt)
      throw new FlowError('invalid-input', '结束要晚于开始', { startsAt, endsAt });
    const values = {
      principal,
      agent: input.agent,
      processKeys: [...(input.processKeys ?? [])],
      startsAt,
      endsAt,
      note: input.note?.trim() || null,
      createdAt: at,
      createdBy: actor.id,
      cancelledAt: null,
    };
    const id = Number(await db.insert(FlowProxy).values(values).returnId());
    return proxyView({ id, ...values }, at);
  }

  /** 撤销（委托人自己或管理员）；返回撤了没有 */
  async function cancel(actor: Actor, id: number): Promise<boolean> {
    const row = await db
      .queryable(FlowProxy)
      .where((p) => [p.id.eq(id)])
      .first();
    if (!row || row.cancelledAt) return false;
    ownerOf(actor, row.principal);
    return (
      (await db
        .update(FlowProxy)
        .set({ cancelledAt: now() })
        .where((p) => [p.id.eq(id), p.cancelledAt.isNull()])
        .execute()) > 0
    );
  }

  return { list, save, cancel };
}

/** 代理规则模块 */
export type Proxies = ReturnType<typeof createProxies>;

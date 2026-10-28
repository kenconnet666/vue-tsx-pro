/**
 * 会签的完成规则（docs/decisions/0001 第 9 节）：每处理一份，按这一组的全部待办与排队的人判断结束了没有、结果是什么。
 * - all、sequential：有人选了非通过的结果立即结束，按他的；全部通过才结束
 * - any：第一个人处理完就结束
 * - ratio：同一结果的人数占比达到门槛就结束；有一票否决的结果立即结束；都办完还没达到按 fallback
 */
import type { MultiInstance, Outcome } from '@zerodep-dev/flow-ts-model';
import { FlowError } from './errors.ts';

/** 一组待办里的一份 */
export interface SignVote {
  readonly state: 'open' | 'waiting' | 'done' | 'canceled';
  readonly outcome: string | null;
}

/** 判断：还没结束是 undefined，结束了是结果 */
export function decideCountersign(
  multi: MultiInstance,
  outcomes: readonly Outcome[],
  votes: readonly SignVote[],
  queued: number,
): string | undefined {
  const done = votes.filter((v) => v.state === 'done');
  const total = votes.filter((v) => v.state !== 'canceled').length + queued;
  const kindOf = (key: string | null) => outcomes.find((o) => o.key === key)?.kind ?? 'approve';
  const allDone = done.length === total;
  switch (multi.complete) {
    case 'all':
    case 'sequential': {
      const objection = done.find((v) => kindOf(v.outcome) !== 'approve');
      if (objection) return objection.outcome!;
      return allDone ? (done.at(-1)?.outcome ?? undefined) : undefined;
    }
    case 'any':
      return done[0]?.outcome ?? undefined;
    case 'ratio': {
      const veto = done.find((v) => outcomes.find((o) => o.key === v.outcome)?.veto);
      if (veto) return veto.outcome!;
      const threshold = multi.ratio ?? 1;
      const counts = new Map<string, number>();
      for (const v of done) counts.set(v.outcome!, (counts.get(v.outcome!) ?? 0) + 1);
      for (const [outcome, count] of counts) {
        if (total > 0 && count / total >= threshold - 1e-9) return outcome;
      }
      if (!allDone) return undefined;
      if (!multi.fallback) {
        throw new FlowError('invalid-definition', '按比例会签都办完了没达到门槛，又没写 fallback');
      }
      return multi.fallback;
    }
    default:
      throw new FlowError('invalid-definition', `这一版不支持会签规则 ${multi.complete}`);
  }
}

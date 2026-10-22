/** 假接口：收益认定、一本账、统计看板 */
import Decimal from 'decimal.js';
import { http, HttpResponse } from 'msw';
import { TODAY } from '../../domain/clock';
import { dashboardSummary } from '../../domain/ledger/dashboard';
import { valueLedgerRows, type ValueLedgerQuery } from '../../domain/ledger/value';
import { confirmRows } from '../../domain/task/benefit';
import { can } from '../../domain/permissions';
import { returnForVerification } from '../../domain/task/lifecycle';
import type { CostKind } from '../../domain/task/types';
import type { MockDatabase } from '../db';
import { actorOf, attempt, bodyOf, fail, latency, route } from '../respond';
import { advanceTaskTo, taskInstance } from '../workflow/task-flow';

const kindOf = (params: URLSearchParams): CostKind =>
  params.get('kind') === 'dmc' ? 'dmc' : 'unit';

/** 收益的路由 */
export const benefitHandlers = (db: MockDatabase) => {
  /** 待认定的任务；不是成本团队、不存在或不在待认定时给出出错的响应 */
  const awaiting = (request: Request, code: unknown) => {
    const roles = db.master.people.find((person) => person.id === actorOf(request))?.roles ?? [];
    if (!can(roles, 'benefit.confirm')) return { error: fail(403, '收益认定由成本团队做') };
    const task = db.task(String(code));
    if (!task) return { error: fail(404, `没有找到项目 ${String(code)}`) };
    if (task.status !== 'awaiting') return { error: fail(409, `${task.code} 不在待认定`) };
    return { task };
  };

  return [
    http.get(route('confirmList'), async ({ request }) => {
      await latency();
      const params = new URL(request.url).searchParams;
      return HttpResponse.json(
        confirmRows(db.tables.tasks, db.tables.confirmReturns, {
          kind: kindOf(params),
          keyword: params.get('keyword') ?? '',
        }),
      );
    }),
    http.post(route('confirmApprove'), async ({ request, params }) => {
      await latency();
      const { task, error } = awaiting(request, params.code);
      if (error) return error;
      return attempt(() => {
        db.run((engine) => advanceTaskTo(engine, task, 'confirmed', actorOf(request)));
        return HttpResponse.json(db.task(task.code));
      });
    }),
    http.post(route('confirmReturn'), async ({ request, params }) => {
      await latency();
      const { task, error } = awaiting(request, params.code);
      if (error) return error;
      const reason = (await bodyOf<{ reason: string }>(request)).reason?.trim() ?? '';
      if (reason.length < 4) return fail(400, '写明退回的原因（至少 4 个字）');
      return attempt(() => {
        // 流程调整：回到验证实施（落到原来的主办），验证窗结论作废
        const instance = taskInstance(db.workflow, task.code);
        if (instance)
          db.run((engine) => engine.move(instance.id, actorOf(request), ['verify'], reason));
        db.saveTask(returnForVerification(db.task(task.code)!));
        db.addConfirmReturn({ code: task.code, reason, at: TODAY });
        return HttpResponse.json(db.task(task.code));
      });
    }),
    http.get(route('valueLedger'), async ({ request }) => {
      await latency();
      const params = new URL(request.url).searchParams;
      const query: Omit<ValueLedgerQuery, 'kind'> = {
        basis: params.get('basis') ?? 'hard',
        keyword: params.get('keyword') ?? '',
        team: params.get('team') || null,
      };
      const rowsOf = (kind: CostKind) =>
        valueLedgerRows(db.tables.tasks, db.tables.opportunities, { ...query, kind });
      return HttpResponse.json({
        rows: rowsOf(kindOf(params)),
        counts: { unit: rowsOf('unit').length, dmc: rowsOf('dmc').length },
      });
    }),
    http.get(route('dashboard'), async ({ request }) => {
      await latency();
      const { teams, dictionaries, targets } = db.master;
      const kind = kindOf(new URL(request.url).searchParams);
      const target = targets.find((item) => item.kind === kind && item.year === TODAY.slice(0, 4));
      return HttpResponse.json(
        dashboardSummary(db.tables.tasks, kind, {
          teams: teams.map((team) => team.name),
          gapReasons: dictionaries.gapReasons.map((item) => item.value),
          amountBases: dictionaries.amountBases.map((item) => item.value),
          target: target ? new Decimal(target.amount) : null,
        }),
      );
    }),
  ];
};

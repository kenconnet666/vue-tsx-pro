/** 假接口：收益认定、一本账、统计看板 */
import { http, HttpResponse } from 'msw';
import { TODAY } from '../../domain/clock';
import { dashboardSummary } from '../../domain/ledger/dashboard';
import { valueLedgerRows, type ValueLedgerQuery } from '../../domain/ledger/value';
import { confirmRows } from '../../domain/task/benefit';
import { advanceTask, returnForVerification } from '../../domain/task/lifecycle';
import type { CostKind } from '../../domain/task/types';
import type { MockDatabase } from '../db';
import { bodyOf, fail, latency, route } from '../respond';

const kindOf = (params: URLSearchParams): CostKind =>
  params.get('kind') === 'dmc' ? 'dmc' : 'unit';

/** 收益的路由 */
export const benefitHandlers = (db: MockDatabase) => {
  /** 待认定的任务；不存在或不在待认定时给出出错的响应 */
  const awaiting = (code: unknown) => {
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
    http.post(route('confirmApprove'), async ({ params }) => {
      await latency();
      const { task, error } = awaiting(params.code);
      if (error) return error;
      const confirmed = advanceTask(task, 'confirmed');
      db.saveTask(confirmed);
      return HttpResponse.json(confirmed);
    }),
    http.post(route('confirmReturn'), async ({ request, params }) => {
      await latency();
      const { task, error } = awaiting(params.code);
      if (error) return error;
      const reason = (await bodyOf<{ reason: string }>(request)).reason?.trim() ?? '';
      if (reason.length < 4) return fail(400, '写明退回的原因（至少 4 个字）');
      const returned = returnForVerification(task);
      db.saveTask(returned);
      db.addConfirmReturn({ code: task.code, reason, at: TODAY });
      return HttpResponse.json(returned);
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
      const { teams, dictionaries } = db.master;
      return HttpResponse.json(
        dashboardSummary(db.tables.tasks, kindOf(new URL(request.url).searchParams), {
          teams: teams.map((team) => team.name),
          gapReasons: dictionaries.gapReasons.map((item) => item.value),
          amountBases: dictionaries.amountBases.map((item) => item.value),
        }),
      );
    }),
  ];
};

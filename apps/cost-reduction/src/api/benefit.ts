/** 收益的接口：收益认定（锁定 A、退回验证）、一本账、统计看板 */
import type { DashboardSummary } from '../domain/ledger/dashboard';
import type { ValueLedgerQuery, ValueLedgerRow } from '../domain/ledger/value';
import type { ConfirmRow, ConfirmView } from '../domain/task/benefit';
import type { CostKind, CostTask } from '../domain/task/types';
import { apiPaths, fillPath, http } from './client';
import { decodeConfirmRows, decodeDashboard, decodeLedgerRow, decodeTask, type Wire } from './wire';

/** 收益认定三个页签的行（一种降本类型、关键字下） */
export async function listConfirmRows(
  query: { kind: CostKind; keyword: string },
  signal?: AbortSignal,
): Promise<Record<ConfirmView, ConfirmRow[]>> {
  return decodeConfirmRows(
    await http.get<Wire<Record<ConfirmView, ConfirmRow[]>>>(apiPaths.confirmList, {
      query,
      signal,
    }),
  );
}

/** 认定并锁定 A：按最新一版测算锁定，此后不能改 */
export async function approveBenefit(code: string): Promise<CostTask> {
  return decodeTask(await http.post<Wire<CostTask>>(fillPath(apiPaths.confirmApprove, { code })));
}

/** 退回验证：任务回到验证中，验证窗结论作废，原因记在“退回”页签 */
export async function returnBenefit(code: string, reason: string): Promise<CostTask> {
  return decodeTask(
    await http.post<Wire<CostTask>>(fillPath(apiPaths.confirmReturn, { code }), { reason }),
  );
}

/** 一本账：当前单位与口径下的行，以及两种单位各有几行（页签上的数） */
export async function getValueLedger(
  query: ValueLedgerQuery,
  signal?: AbortSignal,
): Promise<{ rows: ValueLedgerRow[]; counts: Record<CostKind, number> }> {
  const result = await http.get<{
    rows: Wire<ValueLedgerRow>[];
    counts: Record<CostKind, number>;
  }>(apiPaths.valueLedger, { query: { ...query }, signal });
  return { ...result, rows: result.rows.map(decodeLedgerRow) };
}

/** 统计看板（一种降本类型） */
export async function getDashboard(
  kind: CostKind,
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  return decodeDashboard(
    await http.get<Wire<DashboardSummary>>(apiPaths.dashboard, { query: { kind }, signal }),
  );
}

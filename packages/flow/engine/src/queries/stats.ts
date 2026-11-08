/**
 * 监控与统计（docs/decisions/0010 第 4 节）：管理员的看板——这段时间发起、结束了多少，各流程平均走多久，
 * 哪些环节最慢（瓶颈）、超时最多，谁手上压着待办，有多少异常。计数在库里分组算；时长按这段时间结束的行在这里算
 * （只取这段时间的，看板默认 30 天）。按天的趋势用调用方的时区分日子。
 */
import { FlowInstance, FlowJob, FlowWorkItem } from '../core/entities.ts';
import type { EngineCore } from '../core/context.ts';
import type { FlowStats, StatsFilter } from '../views.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** 结束了的状态（不算草稿、进行中、暂停） */
const ENDED = ['completed', 'terminated', 'withdrawn'] as const;

/** 平均小时数，保留一位；没有行时为空 */
const averageHours = (durations: readonly number[]) =>
  durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length / HOUR) * 10) / 10
    : null;

/** 统计：装进引擎核心（core.stats） */
export function createStats(core: EngineCore) {
  const { db, now } = core;

  async function overview(filter: StatsFilter = {}): Promise<FlowStats> {
    const at = now();
    const to = filter.to ?? at;
    const from = filter.from ?? new Date(to.getTime() - 30 * DAY);
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: filter.timeZone ?? 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const key = filter.processKey;

    const [active, started, ended, done, open, incidents] = await Promise.all([
      db
        .queryable(FlowInstance)
        .where((i) => [
          i.status.in(['active', 'suspended']),
          ...(key ? [i.processKey.eq(key)] : []),
        ])
        .groupBy((i) => ({ processKey: i.processKey }))
        .select((g) => ({ processKey: g.key.processKey, count: g.count() }))
        .toList(),
      db
        .queryable(FlowInstance)
        .where((i) => [
          i.status.ne('draft'),
          i.startedAt.ge(from),
          i.startedAt.le(to),
          ...(key ? [i.processKey.eq(key)] : []),
        ])
        .select((i) => ({ processKey: i.processKey, startedAt: i.startedAt }))
        .toList(),
      db
        .queryable(FlowInstance)
        .where((i) => [
          i.status.in([...ENDED]),
          i.endedAt.ge(from),
          i.endedAt.le(to),
          ...(key ? [i.processKey.eq(key)] : []),
        ])
        .select((i) => ({
          processKey: i.processKey,
          status: i.status,
          startedAt: i.startedAt,
          endedAt: i.endedAt,
        }))
        .toList(),
      db
        .queryable(FlowWorkItem)
        .where((w) => [
          w.state.eq('done'),
          w.completedAt.ge(from),
          w.completedAt.le(to),
          ...(key ? [w.instance.processKey.eq(key)] : []),
        ])
        .select((w) => ({
          processKey: w.instance.processKey,
          node: w.node,
          nodeName: w.nodeName,
          createdAt: w.createdAt,
          completedAt: w.completedAt,
          dueAt: w.dueAt,
        }))
        .toList(),
      db
        .queryable(FlowWorkItem)
        .where((w) => [
          w.state.eq('open'),
          w.assignee.isNotNull(),
          ...(key ? [w.instance.processKey.eq(key)] : []),
        ])
        .groupBy((w) => ({ assignee: w.assignee }))
        .select((g) => ({
          user: g.key.assignee,
          open: g.count(),
          overdue: g.count((w) => w.dueAt.lt(at)),
        }))
        .toList(),
      db
        .queryable(FlowJob)
        .where((j) => [j.state.eq('failed')])
        .count(),
    ]);

    // 各流程：进行中、发起、结束、平均时长
    const processes = new Map<
      string,
      { active: number; started: number; finished: number; durations: number[] }
    >();
    const processOf = (key: string) => {
      let entry = processes.get(key);
      if (!entry)
        processes.set(key, (entry = { active: 0, started: 0, finished: 0, durations: [] }));
      return entry;
    };
    for (const row of active) processOf(row.processKey).active = row.count;
    for (const row of started) processOf(row.processKey).started++;
    for (const row of ended) {
      const entry = processOf(row.processKey);
      entry.finished++;
      if (row.endedAt) entry.durations.push(row.endedAt.getTime() - row.startedAt.getTime());
    }

    // 各环节：办了几份、平均停多久、超时几份；慢的在前
    const nodes = new Map<
      string,
      { processKey: string; node: string; nodeName: string; durations: number[]; overdue: number }
    >();
    for (const row of done) {
      const id = `${row.processKey}\u0000${row.node}`;
      let entry = nodes.get(id);
      if (!entry)
        nodes.set(
          id,
          (entry = {
            processKey: row.processKey,
            node: row.node,
            nodeName: row.nodeName,
            durations: [],
            overdue: 0,
          }),
        );
      const completed = row.completedAt ?? at;
      entry.durations.push(completed.getTime() - row.createdAt.getTime());
      if (row.dueAt && completed > row.dueAt) entry.overdue++;
    }

    // 按天：发起与结束
    const daily = new Map<string, { started: number; finished: number }>();
    for (let t = from.getTime(); t <= to.getTime(); t += DAY)
      daily.set(day.format(new Date(t)), { started: 0, finished: 0 });
    daily.set(day.format(to), daily.get(day.format(to)) ?? { started: 0, finished: 0 });
    for (const row of started) {
      const bucket = daily.get(day.format(row.startedAt));
      if (bucket) bucket.started++;
    }
    for (const row of ended) {
      const bucket = row.endedAt && daily.get(day.format(row.endedAt));
      if (bucket) bucket.finished++;
    }

    const workload = open
      .filter((row): row is typeof row & { user: string } => row.user !== null)
      .sort((a, b) => b.open - a.open);
    return {
      from,
      to,
      totals: {
        active: active.reduce((sum, row) => sum + row.count, 0),
        started: started.length,
        finished: ended.length,
        rejected: ended.filter((row) => row.status !== 'completed').length,
        open: workload.reduce((sum, row) => sum + row.open, 0),
        overdue: workload.reduce((sum, row) => sum + row.overdue, 0),
        incidents,
      },
      processes: [...processes].map(([processKey, entry]) => ({
        processKey,
        active: entry.active,
        started: entry.started,
        finished: entry.finished,
        averageHours: averageHours(entry.durations),
      })),
      nodes: [...nodes.values()]
        .map((entry) => ({
          processKey: entry.processKey,
          node: entry.node,
          nodeName: entry.nodeName,
          done: entry.durations.length,
          averageHours: averageHours(entry.durations)!,
          overdue: entry.overdue,
        }))
        .sort((a, b) => b.averageHours - a.averageHours),
      workload,
      daily: [...daily].map(([date, counts]) => ({ date, ...counts })),
    };
  }

  return { overview };
}

/** 统计模块 */
export type Stats = ReturnType<typeof createStats>;

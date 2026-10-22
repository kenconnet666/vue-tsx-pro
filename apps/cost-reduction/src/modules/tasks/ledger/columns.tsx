/** 任务卡的几列：台账与收益认定共用（类别、责任团队、联络人、提出单位、完成形式） */
import type { DataTableColumn } from '@vue-tsx-pro/ui';
import { dictLabel, personName, shortTeam } from '../../../app/master';
import type { CostTask } from '../../../domain/task/types';

/** 共用的列：责任一级团队写简称（悬停看全称） */
export const taskColumns = {
  category: {
    key: 'category',
    header: '类别',
    width: 84,
    value: (task: CostTask) => dictLabel('categories', task.category),
  },
  team: {
    key: 'team',
    header: '责任团队',
    // 放得下最长的简称（起落架液压系统）
    width: 128,
    value: (task: CostTask) => shortTeam(task.team),
    cell: (task: CostTask) => <span title={task.team}>{shortTeam(task.team)}</span>,
  },
  contact: {
    key: 'contact',
    header: '联络人',
    width: 72,
    value: (task: CostTask) => personName(task.contact),
  },
  org: { key: 'org', header: '提出单位', width: 106 },
  form: { key: 'form', header: '完成形式', width: 88 },
} satisfies Record<string, DataTableColumn<CostTask>>;

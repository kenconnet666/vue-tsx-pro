/**
 * 项目详情的页头：面包屑、编码与名称、状态与收益状态、按当前状态给出的下一步与更多操作、一行关键信息
 */
import { CircleX, Ellipsis, FilePen, Pause, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Breadcrumbs,
  H1,
  IconButton,
  LinkButton,
  Menu,
  MenuItem,
  MenuLinkItem,
  Small,
  StatusBadge,
} from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import { dictLabel, personName } from '../../../app/master';
import { paths } from '../../../app/paths';
import { canDo } from '../../../app/session';
import { daysToDue, isFinished, missingClosing, overdueDays } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';
import { taskStatuses, valueStates } from '../../../shared/statuses';
import type { TaskActions } from '../task-actions';

const styles = stylex.create({
  head: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '_md', flexWrap: 'wrap' },
  code: { fontFamily: '_mono', fontSize: '_md', color: '_textMuted' },
  actions: { display: 'flex', alignItems: 'center', gap: '_sm', marginInlineStart: 'auto' },
  // 关键信息：一行排开，标签淡、值正常
  facts: { display: 'flex', flexWrap: 'wrap', columnGap: '_xl', rowGap: '_xs', margin: 0 },
  fact: { display: 'flex', gap: '_xs', alignItems: 'baseline' },
  factLabel: { color: '_textMuted', fontSize: '_sm' },
  factValue: { margin: 0, fontSize: '_sm' },
  late: { color: '_dangerText', fontWeight: '_semibold' },
});

/** 项目详情的页头 */
export const DetailHeader = _component(
  ({ task, actions }: { task: CostTask; actions: TaskActions }) =>
    () => {
      const amount = costKinds[task.kind];
      const late = overdueDays(task);
      const missing = missingClosing(task);
      const facts: [string, VNodeChild][] = [
        ['降本类型', amount.label],
        ['责任一级团队', task.team],
        ['主办', personName(task.owner)],
        ['联络人', `${personName(task.contact)}（${task.contact}）`],
        ['来源', `${dictLabel('channels', task.channel)} · ${task.sourceCode}`],
        [
          '计划完成',
          late > 0 ? (
            <span>
              {task.due} <span {...stylex.attrs(styles.late)}>超时 {late} 天</span>
            </span>
          ) : isFinished(task) ? (
            task.due
          ) : (
            `${task.due}（还剩 ${daysToDue(task)} 天）`
          ),
        ],
      ];

      return (
        <header {...stylex.attrs(styles.head)}>
          <Breadcrumbs
            items={[
              { label: `${amount.label}台账`, href: paths.ledger(task.kind) },
              { label: task.code },
            ]}
          />
          <div {...stylex.attrs(styles.titleRow)}>
            <span {...stylex.attrs(styles.code)}>{task.code}</span>
            <H1 size="xl">{task.name}</H1>
            <StatusBadge statuses={taskStatuses} value={task.status} />
            <StatusBadge statuses={valueStates} value={task.valueState} />
            <div {...stylex.attrs(styles.actions)}>
              {task.status === 'realized' && missing > 0 && (
                <Small tone="muted">关闭三材料缺 {missing} 项，补齐后可以关闭</Small>
              )}
              <LinkButton
                href={paths.editTask(task.code)}
                variant="outline"
                tone="neutral"
                icon={FilePen}
              >
                编辑
              </LinkButton>
              <Menu
                trigger={(trigger) => (
                  <IconButton
                    {...trigger}
                    icon={Ellipsis}
                    variant="outline"
                    aria-label="更多操作"
                  />
                )}
              >
                <MenuLinkItem icon={FilePen} href={paths.editTask(task.code)}>
                  调整计划
                </MenuLinkItem>
                {canDo('task.pause') && (
                  <MenuItem
                    icon={Pause}
                    disabled={isFinished(task) || task.status === 'paused'}
                    onAction={() => void actions.pause(task)}
                  >
                    暂停
                  </MenuItem>
                )}
                {canDo('task.terminate') && (
                  <MenuItem
                    icon={CircleX}
                    tone="danger"
                    disabled={isFinished(task)}
                    onAction={() => void actions.terminate(task)}
                  >
                    终止
                  </MenuItem>
                )}
                {canDo('task.delete') && (
                  <MenuItem
                    icon={Trash2}
                    tone="danger"
                    disabled={task.status !== 'pending'}
                    onAction={() => void actions.remove(task)}
                  >
                    删除
                  </MenuItem>
                )}
              </Menu>
            </div>
          </div>
          <dl {...stylex.attrs(styles.facts)}>
            {facts.map(([label, value]) => (
              <div key={label} {...stylex.attrs(styles.fact)}>
                <dt {...stylex.attrs(styles.factLabel)}>{label}</dt>
                <dd {...stylex.attrs(styles.factValue)}>{value}</dd>
              </div>
            ))}
          </dl>
        </header>
      );
    },
);

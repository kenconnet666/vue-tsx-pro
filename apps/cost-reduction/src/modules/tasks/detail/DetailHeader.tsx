/**
 * 项目详情的页头：面包屑、编码与名称、状态与收益状态、按当前状态给出的下一步与更多操作、一行关键信息
 */
import { CalendarClock, CircleX, Ellipsis, FilePen, Pause, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Breadcrumbs,
  Button,
  Descriptions,
  Flex,
  H1,
  IconButton,
  Menu,
  MenuItem,
  Small,
  StatusBadge,
  Text,
} from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import { dictLabel, personName } from '../../../app/master';
import { paths } from '../../../app/paths';
import { canDo } from '../../../app/session';
import { planChangeBlocked } from '../../../domain/task/plan-change';
import { daysToDue, isFinished, missingClosing, overdueDays } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';
import { taskStatuses, valueStates } from '../../../shared/statuses';
import type { TaskActions } from '../task-actions';

/** 项目详情的页头 */
export const DetailHeader = _component(
  ({
    task,
    actions,
    onEdit,
  }: {
    task: CostTask;
    actions: TaskActions;
    /** 打开编辑的抽屉 */
    onEdit: () => void;
  }) =>
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
              {task.due}{' '}
              <Text tone="danger" weight="semibold" numeric>
                超时 {late} 天
              </Text>
            </span>
          ) : isFinished(task) ? (
            task.due
          ) : (
            `${task.due}（还剩 ${daysToDue(task)} 天）`
          ),
        ],
      ];

      return (
        <Flex direction="column" gap="sm">
          <Breadcrumbs
            items={[
              { label: `${amount.label}台账`, href: paths.ledger(task.kind) },
              { label: task.code },
            ]}
          />
          {/* 标题与状态在起始边，操作在结束边；放不下时操作换到下一行 */}
          <Flex align="center" justify="between" gap="md" wrap>
            <Flex align="center" gap="sm" wrap>
              <H1 size="xxl">{task.name}</H1>
              <Text mono tone="muted">
                {task.code}
              </Text>
              <StatusBadge statuses={taskStatuses} value={task.status} />
              <StatusBadge statuses={valueStates} value={task.valueState} />
            </Flex>
            <Flex align="center" gap="sm" wrap>
              {task.status === 'realized' && missing > 0 && (
                <Small tone="muted">关闭三材料缺 {missing} 项，补齐后可以关闭</Small>
              )}
              {canDo('task.edit') && (
                <Button variant="outline" tone="neutral" icon={FilePen} onClick={onEdit}>
                  编辑
                </Button>
              )}
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
                <MenuItem
                  icon={CalendarClock}
                  disabled={planChangeBlocked(task) != null}
                  description={planChangeBlocked(task) ?? '改计划完成、换主办，PEMO 审批'}
                  onAction={() => void actions.adjustPlan(task)}
                >
                  调整计划
                </MenuItem>
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
            </Flex>
          </Flex>
          {/* 关键信息：一行排开，放不下换行 */}
          <Descriptions
            layout="inline"
            size="sm"
            items={facts.map(([label, value]) => ({ label, value }))}
          />
        </Flex>
      );
    },
);

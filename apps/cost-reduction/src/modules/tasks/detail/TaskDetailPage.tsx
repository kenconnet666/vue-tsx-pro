/**
 * 项目详情（任务卡）：页头（编码、名称、状态、收益状态、下一步与更多操作、关键信息）、八个状态的步骤条
 * （异常状态按已完成的里程碑推断停在哪一步并标红）、左栏（概览；降本明细或实施节点；变更记录）、
 * 右栏（收益；里程碑与交付证据；关闭三材料），右栏滚动时粘住。“下一步”推进状态并写回任务卡
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Steps, useConfig, useQueryState, useRequest } from '@vue-tsx-pro/ui';
import { useRoute } from 'vue-router';
import { getTask } from '../../../api/tasks';
import { paths } from '../../../app/paths';
import { kindOfCode } from '../../../domain/task/code';
import { stepIndexOf } from '../../../domain/task/lifecycle';
import { taskFlow } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { RequestView } from '../../../shared/RequestView';
import { taskStatuses } from '../../../shared/statuses';
import { editorTarget, TaskEditorDrawer } from '../editor/TaskEditorDrawer';
import { useTaskActions } from '../task-actions';
import { DetailHeader } from './DetailHeader';
import { NodesCard, OverviewCard, PartsCard } from './MainCards';
import { BenefitCard, ClosingCard, MilestonesCard } from './SideCards';
import { taskFlowFields } from './task-flow-fields';
import { taskCompletionProblem } from '../../../domain/task/workflow';
import { WorkflowPanel } from '../../../shared/WorkflowPanel';

const styles = stylex.create({
  page: { display: 'flex', flexDirection: 'column', gap: '_md', paddingBlockEnd: '_xl' },
  steps: { paddingBlock: '_sm' },
  // 两栏：左栏放长内容，右栏是收益、里程碑与关闭材料，滚动时粘在顶栏下面
  body: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 72rem)': 'minmax(0, 1fr) 26rem',
    },
    gap: '_md',
    alignItems: 'start',
  },
  main: { display: 'flex', flexDirection: 'column', gap: '_md', minWidth: 0 },
  side: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_md',
    position: { default: null, '@media (min-width: 72rem)': 'sticky' },
    top: 'calc(3rem + _space.md)',
  },
});

/** 八个状态的步骤条；异常状态停在推断的那一步，标红并写上异常状态 */
const StatusSteps = _component(({ task }: { task: CostTask }) => () => {
  const abnormal = !taskFlow.includes(task.status);
  const current = stepIndexOf(task);
  return (
    <Steps
      size="sm"
      current={current}
      aria-label="任务状态"
      sx={styles.steps}
      items={taskFlow.map((status, index) => ({
        title: taskStatuses.label(status),
        status: abnormal && index === current ? 'error' : undefined,
        description: abnormal && index === current ? taskStatuses.label(task.status) : undefined,
      }))}
    />
  );
});

export default _component(() => {
  const route = useRoute();
  const router = useConfig().router;
  const code = () => String(route.params.code);
  const request = useRequest((current: string, signal) => getTask(current, signal), {
    params: code,
  });
  const actions = useTaskActions({
    // 推进、暂停、终止后显示新的任务卡；删掉了回台账
    onChange(task) {
      if (task) request.mutate(task);
      else router?.navigate(paths.ledger(kindOfCode(code())));
    },
  });

  const flow = taskFlowFields(() => request.data!);
  // 编辑的抽屉在地址里（?editor=编号）
  let editor = _fromRef(useQueryState('editor', ''));

  return () => (
    <RequestView request={request} notFound={`没有找到项目 ${code()}`}>
      {(task) => (
        <div {...stylex.attrs(styles.page)}>
          <DetailHeader
            task={task}
            actions={actions}
            onEdit={() => (editor = editorTarget.edit(task.code))}
          />
          <StatusSteps task={task} />
          <div {...stylex.attrs(styles.body)}>
            <div {...stylex.attrs(styles.main)}>
              <OverviewCard task={task} />
              {task.unitDetail && <PartsCard detail={task.unitDetail} />}
              <WorkflowPanel
                businessKey={task.code}
                processKey="task"
                fields={flow.fields}
                defaults={flow.defaults}
                check={(outcome, node, values) =>
                  taskCompletionProblem(task, { node, outcome: outcome.key, variables: values })
                }
                onChange={() => void request.refresh()}
              />
              {task.kind === 'dmc' && <NodesCard task={task} />}
            </div>
            <aside {...stylex.attrs(styles.side)} aria-label="收益与关闭">
              <BenefitCard task={task} />
              <MilestonesCard task={task} />
              <ClosingCard task={task} />
            </aside>
          </div>
          <TaskEditorDrawer target={_bind(editor)} onSaved={() => void request.refresh()} />
        </div>
      )}
    </RequestView>
  );
});

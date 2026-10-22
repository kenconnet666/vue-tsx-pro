/**
 * 任务卡的流程面板：通用的 WorkflowPanel 加上任务池各节点要填的业务字段（建卡选主办、验证窗结论、认定锁 A、
 * 商务回填 B 与差额归因）和提交前的业务检查（与后端同一条规则）。任务详情、收件箱的预览共用
 */
import { _component } from '@vue-tsx-pro/tsx';
import { taskCompletionProblem } from '../../../domain/task/workflow';
import type { CostTask } from '../../../domain/task/types';
import { WorkflowPanel } from '../../../shared/WorkflowPanel';
import { taskFlowFields } from './task-flow-fields';

/** 任务卡的流程面板 */
export const TaskWorkflowPanel = _component(
  ({
    task,
    hideDiagram,
    onChange,
  }: {
    /** 任务卡 */
    task: CostTask;
    /** 不画流程图 */
    hideDiagram?: boolean;
    /** 处理之后：卡片重新取数 */
    onChange?: () => void;
  }) => {
    const flow = taskFlowFields(() => task);
    return () => (
      <WorkflowPanel
        title="任务池流程"
        businessKey={task.code}
        processKey="task"
        fields={flow.fields}
        defaults={flow.defaults}
        check={(outcome, node, values) =>
          taskCompletionProblem(task, { node, outcome: outcome.key, variables: values })
        }
        hideDiagram={hideDiagram}
        onChange={onChange}
      />
    );
  },
);

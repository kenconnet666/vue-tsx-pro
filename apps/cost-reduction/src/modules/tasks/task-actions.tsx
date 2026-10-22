/**
 * 任务卡的操作：推进、调整计划（PEMO 审批）、暂停、终止、删除（可撤销）。台账的“更多”菜单与项目详情共用：
 * 破坏性的先确认，结果用全局提示告诉用户，失败时显示后端给的原因；成功后把新的任务卡交给 onChange
 */
import { Button, useConfirm, useFormDialog } from '@vue-tsx-pro/ui';
import {
  advanceTask,
  deleteTask,
  pauseTask,
  requestPlanChange,
  saveTask,
  terminateTask,
} from '../../api/tasks';
import { notifyError, toaster } from '../../app/feedback';
import { ownerOptions } from '../../app/master';
import { announceWorkflowChange } from '../../app/sync';
import { TODAY } from '../../domain/clock';
import { nextStepOf } from '../../domain/task/lifecycle';
import { planChangeBlocked, planChangeProblem } from '../../domain/task/plan-change';
import type { CostTask } from '../../domain/task/types';
import { taskStatuses } from '../../shared/statuses';

/** 任务卡的操作：useTaskActions 的结果 */
export type TaskActions = ReturnType<typeof useTaskActions>;

/** 任务卡的操作（在 setup 里调用） */
export function useTaskActions(options: {
  /** 任务卡变了（推进、暂停、终止、撤销删除）或删掉了（null）：刷新列表、更新详情 */
  onChange: (task: CostTask | null, code: string) => void;
}) {
  const confirm = useConfirm();
  const prompt = useFormDialog();

  async function run(title: string, action: () => Promise<CostTask>, success: string) {
    try {
      const task = await action();
      options.onChange(task, task.code);
      toaster.show({ title: success, tone: 'success' });
      return task;
    } catch (error) {
      notifyError(title, error);
      return null;
    }
  }

  return {
    /** 推进到当前状态的下一步 */
    advance(task: CostTask) {
      const step = nextStepOf(task);
      if (!step) return Promise.resolve(null);
      return run(
        `${task.code} 没能推进`,
        () => advanceTask(task.code, step.next),
        `已推进到“${taskStatuses.label(step.next)}”`,
      );
    },
    /**
     * 调整计划：改计划完成、换主办，写明原因，提交给 PEMO 审批；同意后才生效（不得自行改日期）。
     * 已有一项在审批中、或任务已经结束时直接说明
     */
    async adjustPlan(task: CostTask) {
      const blocked = planChangeBlocked(task);
      if (blocked) {
        toaster.show({ title: '现在不能调整计划', description: blocked, tone: 'warning' });
        return null;
      }
      let updated: CostTask | null = null;
      await prompt({
        title: `调整计划：${task.code}`,
        description: '提交后由 PEMO 审批，同意后计划完成与主办才会改；审批结果在收件箱与通知里',
        confirmText: '提交审批',
        fields: [
          {
            name: 'due',
            label: '计划完成',
            type: 'date',
            required: true,
            defaultValue: task.due,
            min: TODAY,
          },
          {
            name: 'owner',
            label: '主办',
            type: 'select',
            required: true,
            defaultValue: task.owner,
            options: ownerOptions(),
          },
          {
            name: 'reason',
            label: '调整原因',
            type: 'textarea',
            required: true,
            placeholder: '方案调整、延期的原因与新的安排',
            maxlength: 300,
            validate: (reason, values) =>
              planChangeProblem(task, { due: values.due!, owner: values.owner!, reason }),
          },
        ],
        onSubmit: async (values) => {
          try {
            updated = await requestPlanChange(task.code, {
              due: values.due!,
              owner: values.owner!,
              reason: values.reason!,
            });
          } catch (error) {
            notifyError('没能提交计划调整', error);
            throw error;
          }
        },
      });
      if (!updated) return null;
      options.onChange(updated, task.code);
      announceWorkflowChange();
      toaster.show({ title: '已提交计划调整，等 PEMO 审批', tone: 'success' });
      return updated;
    },
    /** 暂停 */
    pause(task: CostTask) {
      return run(`${task.code} 没能暂停`, () => pauseTask(task.code), `${task.code} 已暂停`);
    },
    /** 终止：确认后执行，事项回流储备库 */
    async terminate(task: CostTask) {
      const ok = await confirm({
        title: `终止 ${task.code}？`,
        description: '终止后不再推进，事项按否决原因进入储备库；这一步会记进变更记录。',
        tone: 'danger',
        confirmText: '终止',
      });
      if (!ok) return null;
      return run(`${task.code} 没能终止`, () => terminateTask(task.code), `${task.code} 已终止`);
    },
    /** 删除：只限待启动；确认后删除，提示里可以撤销（原样放回） */
    async remove(task: CostTask) {
      const ok = await confirm({
        title: `删除 ${task.code}？`,
        description: '只有待启动的项目可以删除；已经开始的请用“终止”，终止要填原因并留痕。',
        tone: 'danger',
        confirmText: '删除',
      });
      if (!ok) return false;
      let removed: CostTask;
      try {
        removed = await deleteTask(task.code);
      } catch (error) {
        notifyError(`${task.code} 没能删除`, error);
        return false;
      }
      options.onChange(null, task.code);
      const id = toaster.show({
        title: `已删除 ${task.code}`,
        tone: 'success',
        action: (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              toaster.dismiss(id);
              void run(`${task.code} 没能恢复`, () => saveTask(removed), `已恢复 ${task.code}`);
            }}
          >
            撤销
          </Button>
        ),
      });
      return true;
    },
  };
}

/**
 * 异常（自动处理失败的作业）的处理：重试，或跳过按选的结果往下走。审批单（InstanceActions）与管理页共用。
 */
import type { Incident } from '@zerodep-dev/flow-ts-engine';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { useFlowCenter } from '../runtime/center';
import { showError, toaster } from './toaster';

/** 在组件的 setup 里取：要用对话框 */
export function useIncidentActions() {
  const center = useFlowCenter();
  const prompt = useFormDialog();

  async function retry(incident: Incident): Promise<void> {
    try {
      if (!(await center.client.retryJob(incident.jobId)))
        throw new Error('这个作业已经不在异常里');
      toaster.success('已重试');
    } catch (error) {
      showError(error);
    }
  }

  async function skip(incident: Incident): Promise<void> {
    const answers = await prompt({
      title: `跳过“${incident.nodeName ?? incident.kind}”`,
      description: '不再自动处理，按选的结果往下走。',
      fields: [
        ...(incident.outcomes.length > 0
          ? [
              {
                name: 'outcome',
                label: '结果',
                type: 'select' as const,
                required: true,
                options: incident.outcomes.map((o) => ({ value: o, label: o })),
              },
            ]
          : []),
        { name: 'reason', label: '原因', type: 'textarea', required: true },
      ],
      confirmText: '跳过',
    });
    if (!answers) return;
    const { outcome, reason } = answers as Record<string, string>;
    try {
      await center.client.run({
        type: 'skipJob',
        job: incident.jobId,
        outcome: outcome || undefined,
        reason,
      });
      toaster.success('已跳过');
    } catch (error) {
      showError(error);
    }
  }

  return { retry, skip };
}

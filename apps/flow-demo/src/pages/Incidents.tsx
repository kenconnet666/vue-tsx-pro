/**
 * 异常作业（管理员）：重试用完还失败的自动动作、定时作业。重试（重新排进作业队列，下一轮执行）或跳过（按选的结果往下走，
 * 写明原因）；“立即执行”不等定时器，马上做到期的作业
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Button,
  Empty,
  Flex,
  H1,
  ItemList,
  ItemListItem,
  Paragraph,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { ActionError } from '@zerodep-dev/vue-tsx-pro-kit';
import { actions, usePageData } from '../client.ts';

export default _component(() => {
  const data = usePageData('/incidents');
  const prompt = useFormDialog();
  let busy = _state(false);
  let message = _state<{ tone: 'success' | 'danger'; text: string } | null>(null);

  async function run(work: () => Promise<unknown>, done: string) {
    busy = true;
    message = null;
    try {
      await work();
      await data.reload();
      message = { tone: 'success', text: done };
    } catch (error) {
      message = {
        tone: 'danger',
        text: error instanceof ActionError ? error.message : String(error),
      };
    } finally {
      busy = false;
    }
  }

  /** 跳过：有出边结果时选一个，写明原因（记进流转记录） */
  async function skip(job: number, node: string, outcomes: readonly string[]) {
    const values = await prompt({
      title: `跳过：${node}`,
      description: '不再执行这个作业，流程按选的结果往下走。',
      fields: [
        ...(outcomes.length
          ? [
              {
                name: 'outcome',
                label: '按哪个结果往下走',
                type: 'select',
                required: true,
                options: outcomes.map((o) => ({ value: o, label: o })),
              } as const,
            ]
          : []),
        { name: 'reason', label: '原因', type: 'textarea', required: true, maxlength: 500 },
      ],
      confirmText: '跳过',
      tone: 'danger',
    });
    if (!values) return;
    const outcome = values['outcome'];
    await run(
      () => actions.skipJob({ job, reason: values['reason'], ...(outcome ? { outcome } : {}) }),
      '已跳过，流程继续往下走',
    );
  }

  return () => {
    const incidents = data.value ?? [];
    return (
      <Flex direction="column" gap="lg">
        <Flex align="center" justify="between" gap="md" wrap>
          <H1>异常作业</H1>
          <Button
            variant="outline"
            tone="neutral"
            disabled={busy}
            onClick={() => void run(() => actions.runJobs({}), '到期的作业已执行')}
          >
            立即执行到期作业
          </Button>
        </Flex>
        <Paragraph tone="muted">
          自动动作失败、重试次数用完后停在这里，流程卡在那一步。修好外部系统后重试；不需要了就跳过，流程按选的结果往下走。
        </Paragraph>
        {message && <Alert tone={message.tone} description={message.text} />}
        {incidents.length === 0 ? (
          <Empty title="没有异常作业" description="失败的自动动作会出现在这里。" />
        ) : (
          <ItemList divided aria-label="异常作业">
            {incidents.map((incident) => (
              <ItemListItem
                key={incident.jobId}
                align="start"
                href={`/instances/${incident.instanceId}`}
                title={incident.instanceTitle ?? `审批单 ${incident.instanceId}`}
                description={
                  <Flex direction="column" gap="xs">
                    <span>
                      {incident.nodeName ?? incident.kind} · 失败 {incident.attempts} 次
                    </span>
                    {incident.error && <Small tone="danger">{incident.error}</Small>}
                  </Flex>
                }
                end={
                  <Flex gap="sm">
                    <Button
                      size="sm"
                      variant="soft"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => actions.retryJob({ job: incident.jobId }),
                          '已重新排进作业队列',
                        )
                      }
                    >
                      重试
                    </Button>
                    {incident.skippable && (
                      <Button
                        size="sm"
                        variant="outline"
                        tone="danger"
                        disabled={busy}
                        onClick={() =>
                          void skip(
                            incident.jobId,
                            incident.nodeName ?? incident.kind,
                            incident.outcomes,
                          )
                        }
                      >
                        跳过
                      </Button>
                    )}
                  </Flex>
                }
              />
            ))}
          </ItemList>
        )}
      </Flex>
    );
  };
});

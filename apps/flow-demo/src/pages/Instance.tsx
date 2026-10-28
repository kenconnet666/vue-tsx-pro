/** 审批单：状态、正在处理的节点、我能做的（认领、按结果处理、撤回）、流转记录 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Button,
  Flex,
  H1,
  H2,
  Paragraph,
  Textarea,
  Timeline,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useRoute } from 'vue-router';
import { actions, usePageData } from '../client.ts';
import { ActionError } from '@zerodep-dev/vue-tsx-pro-kit';

/** 流转记录的文字 */
const EVENTS: Record<string, string> = {
  'instance.started': '发起',
  'workItem.created': '到达',
  'workItem.claimed': '认领',
  'workItem.completed': '处理',
  'instance.finished': '结束',
  'instance.withdrawn': '撤回',
};

export default _component(() => {
  const data = usePageData('/instances/:id');
  const route = useRoute();
  let comment = _state('');
  let problem = _state('');
  let busy = _state(false);

  async function run(work: () => Promise<unknown>) {
    busy = true;
    problem = '';
    try {
      await work();
      comment = '';
      await data.reload();
    } catch (error) {
      problem = error instanceof ActionError ? error.message : String(error);
    } finally {
      busy = false;
    }
  }

  return () => {
    const detail = data.value;
    if (!detail) return <Paragraph>没有这张审批单（{String(route.params['id'])}）。</Paragraph>;
    return (
      <Flex direction="column" gap="lg" align="start">
        <H1>{detail.instance.title ?? `审批单 ${detail.instance.id}`}</H1>
        <Paragraph data-testid="state">
          {detail.instance.status === 'active'
            ? `进行中：${detail.current.map((c) => c.name).join('、')}`
            : `已结束：${detail.instance.result ?? detail.instance.status}`}
        </Paragraph>
        {problem && <Alert tone="danger">{problem}</Alert>}
        {detail.actions.map((item) => (
          <Flex
            key={item.id}
            direction="column"
            gap="sm"
            align="start"
            aria-label={`处理：${item.node}`}
          >
            <strong>{item.node}</strong>
            {item.claimable && (
              <Button
                variant="soft"
                disabled={busy}
                onClick={() => void run(() => actions.claim({ workItem: item.id }))}
              >
                认领
              </Button>
            )}
            <Textarea _value={comment} aria-label="意见" placeholder="意见" />
            <Flex gap="sm">
              {item.outcomes.map((outcome) => (
                <Button
                  key={outcome.key}
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      actions.complete({
                        workItem: item.id,
                        outcome: outcome.key,
                        ...(comment.trim() ? { comment } : {}),
                      }),
                    )
                  }
                >
                  {outcome.label}
                </Button>
              ))}
            </Flex>
          </Flex>
        ))}
        {detail.withdrawable && (
          <Button
            variant="ghost"
            tone="danger"
            disabled={busy}
            onClick={() => void run(() => actions.withdraw({ instance: detail.instance.id }))}
          >
            撤回
          </Button>
        )}
        <H2>流转记录</H2>
        <Timeline
          items={detail.timeline.map((event, index) => ({
            key: String(index),
            title: `${EVENTS[event.type] ?? event.type}${event.node ? ` · ${event.node}` : ''}${event.outcome ? ` · ${event.outcome}` : ''}`,
            actor: event.actor ?? '系统',
            time: new Date(event.at).toLocaleString('zh-CN', { timeZone: 'UTC' }),
            dateTime: event.at,
            ...(event.comment ? { description: event.comment } : {}),
          }))}
        />
      </Flex>
    );
  };
});

/**
 * 审批单：状态（有时限的标出还剩几天、超时）、单据的字段、会签各人的进度、上级与子流程、进度图、流转记录与留言，
 * 最后是吸底的操作栏（认领、按结果处理、撤回）。
 * 审批面板是组合（照文档站“流程设计与审批”一页）：点处理按钮弹出写意见的对话框，“要写意见”的按钮意见必填
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Flex,
  H1,
  Link,
  Paragraph,
  Small,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Timeline,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { Diagram } from '@zerodep-dev/vue-tsx-pro-ui/diagram';
import {
  ActionBar,
  CommentThread,
  DeadlineBadge,
  useFormDialog,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { ActionError } from '@zerodep-dev/vue-tsx-pro-kit';
import { useRoute } from 'vue-router';
import { actions, usePageData } from '../client.ts';
import { processDiagram, renderStep, stepLabel } from '../process-diagram.tsx';

/** 流转记录的文字 */
const EVENTS: Record<string, string> = {
  'instance.started': '发起',
  'workItem.created': '到达',
  'workItem.claimed': '认领',
  'workItem.completed': '处理',
  'instance.finished': '结束',
  'instance.withdrawn': '撤回',
};

/** 实例状态的文字（子流程的列表） */
const STATUS: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  terminated: '已终止',
  withdrawn: '已撤回',
  suspended: '已暂停',
};

/** 单据字段的值：对象写成 JSON，没填的是破折号 */
const valueText = (value: unknown) =>
  value == null || value === ''
    ? '—'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value as string | number | boolean);

/** 处理按钮：结果的标识、名字、要不要写意见、是不是驳回 */
interface OutcomeChoice {
  key: string;
  label: string;
  comment: boolean;
  reject: boolean;
}

export default _component(() => {
  const data = usePageData('/instances/:id');
  const route = useRoute();
  const prompt = useFormDialog();
  let tab = _state('records');
  let problem = _state('');
  let busy = _state(false);

  async function run(work: () => Promise<unknown>) {
    busy = true;
    problem = '';
    try {
      await work();
      await data.reload();
    } catch (error) {
      problem = error instanceof ActionError ? error.message : String(error);
    } finally {
      busy = false;
    }
  }

  /** 按结果处理：先在对话框里写意见 */
  async function handle(workItem: number, step: string, outcome: OutcomeChoice) {
    const values = await prompt({
      title: `${step}：${outcome.label}`,
      fields: [
        {
          name: 'comment',
          label: '意见',
          type: 'textarea',
          required: outcome.comment,
          maxlength: 500,
          ...(outcome.comment ? {} : { placeholder: '可以不写' }),
        },
      ],
      confirmText: outcome.label,
      ...(outcome.reject ? { tone: 'danger' as const } : {}),
    });
    if (!values) return;
    const comment = values['comment']?.trim();
    await run(() =>
      actions.complete({ workItem, outcome: outcome.key, ...(comment ? { comment } : {}) }),
    );
  }

  return () => {
    const detail = data.value;
    if (!detail) return <Paragraph>没有这张审批单（{String(route.params['id'])}）。</Paragraph>;
    const { instance } = detail;
    const active = instance.status === 'active';
    const view = processDiagram(detail.definition, {
      current: detail.current.map((c) => c.node),
      done: detail.done,
    });
    return (
      <Flex direction="column" gap="lg">
        <Flex gap="sm" align="center" wrap>
          <H1>{instance.title ?? `审批单 ${instance.id}`}</H1>
          <Badge tone={active ? 'accent' : instance.result === 'approved' ? 'success' : 'neutral'}>
            {active ? '审批中' : '已结束'}
          </Badge>
        </Flex>
        <Flex gap="sm" align="center" wrap>
          <Paragraph data-testid="state">
            {active
              ? `进行中：${detail.current.map((c) => c.name).join('、')}`
              : `已结束：${instance.result ?? instance.status}`}
          </Paragraph>
          {active && detail.due && <DeadlineBadge due={detail.due} today={detail.today} />}
        </Flex>
        {detail.parent && (
          <Paragraph>
            上级审批单：
            <Link href={`/instances/${detail.parent.id}`}>
              {detail.parent.title ?? `审批单 ${detail.parent.id}`}
            </Link>
          </Paragraph>
        )}
        <Descriptions
          columns="auto"
          items={(detail.definition.variables ?? []).map((variable) => ({
            key: variable.name,
            label: variable.label ?? variable.name,
            value: valueText(instance.variables[variable.name]),
          }))}
        />
        {detail.signs.map((sign) => (
          <Flex key={sign.node} gap="sm" align="center" wrap data-testid="countersign">
            <Small tone="muted">{sign.node}</Small>
            {sign.people.map((person) => (
              <Badge
                key={person.id}
                variant="soft"
                tone={
                  person.outcome == null
                    ? 'neutral'
                    : person.outcome === '同意'
                      ? 'success'
                      : 'danger'
                }
              >
                {person.name} ·{' '}
                {person.outcome ?? (person.state === 'waiting' ? '排队中' : '待处理')}
              </Badge>
            ))}
          </Flex>
        ))}
        {detail.children.length > 0 && (
          <Flex gap="sm" align="center" wrap data-testid="children">
            <Small tone="muted">子流程</Small>
            {detail.children.map((child) => (
              <Link key={child.id} href={`/instances/${child.id}`}>
                {child.title ?? `审批单 ${child.id}`}（{STATUS[child.status] ?? child.status}）
              </Link>
            ))}
          </Flex>
        )}
        <Diagram
          nodes={view.nodes}
          edges={view.edges}
          getNodeLabel={stepLabel}
          edgeText={(flow) => flow.text}
          routing="orthogonal"
          fitView
          height="16rem"
          aria-label="审批进度"
        >
          {renderStep}
        </Diagram>
        {problem && <Alert tone="danger" description={problem} />}
        <Tabs _value={tab}>
          <TabList aria-label="审批单">
            <Tab value="records">流转记录</Tab>
            <Tab value="comments">留言（{detail.comments.length}）</Tab>
          </TabList>
          <TabPanel value="records">
            <Timeline
              items={detail.timeline.map((event, index) => ({
                key: String(index),
                title: [EVENTS[event.type] ?? event.type, event.node, event.outcome]
                  .filter(Boolean)
                  .join(' · '),
                actor: event.actor,
                time: new Date(event.at).toLocaleString('zh-CN', { timeZone: 'UTC' }),
                dateTime: event.at,
                ...(event.comment ? { description: event.comment } : {}),
              }))}
            />
          </TabPanel>
          <TabPanel value="comments">
            <CommentThread
              comments={detail.comments}
              now={detail.now}
              onSend={(draft) =>
                run(() => actions.comment({ instance: instance.id, text: draft.content }))
              }
            />
          </TabPanel>
        </Tabs>
        {(detail.actions.length > 0 || detail.withdrawable) && (
          <ActionBar start={detail.actions.map((item) => item.node).join('、') || undefined}>
            {detail.withdrawable && (
              <Button
                variant="ghost"
                tone="danger"
                disabled={busy}
                onClick={() => void run(() => actions.withdraw({ instance: instance.id }))}
              >
                撤回
              </Button>
            )}
            {detail.actions.map((item) => [
              item.claimable && (
                <Button
                  key={`claim-${item.id}`}
                  variant="soft"
                  tone="neutral"
                  disabled={busy}
                  onClick={() => void run(() => actions.claim({ workItem: item.id }))}
                >
                  认领
                </Button>
              ),
              ...item.outcomes.map((outcome) => (
                <Button
                  key={`${item.id}-${outcome.key}`}
                  variant={outcome.reject ? 'outline' : 'solid'}
                  tone={outcome.reject ? 'danger' : 'accent'}
                  disabled={busy}
                  onClick={() => void handle(item.id, item.node, outcome)}
                >
                  {outcome.label}
                </Button>
              )),
            ])}
          </ActionBar>
        )}
      </Flex>
    );
  };
});

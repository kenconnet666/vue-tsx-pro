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
  DatePicker,
  Descriptions,
  Field,
  Flex,
  Grid,
  H1,
  Link,
  Menu,
  MenuItem,
  NumberField,
  Paragraph,
  Small,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
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
import { processDiagram, renderStep, stepLabel } from '@zerodep-dev/flow-ts-ui';

/** 流转记录的文字 */
const EVENTS: Record<string, string> = {
  'instance.started': '发起',
  'workItem.created': '到达',
  'workItem.claimed': '认领',
  'workItem.completed': '处理',
  'instance.finished': '结束',
  'instance.withdrawn': '撤回',
  'workItem.transferred': '转办',
  'workItem.reassigned': '改派',
  'workItem.reminded': '催办',
  'workItem.overdue': '超时',
  'instance.cc': '抄送',
  'instance.suspended': '暂停',
  'instance.resumed': '恢复',
  'job.failed': '自动动作失败',
  'job.skipped': '跳过自动动作',
  'instance.jumped': '跳转',
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

/** 处理按钮：结果的标识、名字、要不要写意见、是不是驳回、是不是退回到运行时选的节点 */
interface OutcomeChoice {
  key: string;
  label: string;
  comment: boolean;
  reject: boolean;
  choose: boolean;
}

/** 单据里的一个字段（这一步的表单权限算过的） */
interface FormField {
  name: string;
  label: string;
  type: string;
  value: unknown;
  editable: boolean;
  required: boolean;
}

/** 选人、选节点的选项 */
interface Choice {
  value: string;
  label: string;
}

export default _component(() => {
  const data = usePageData('/instances/:id');
  const route = useRoute();
  const prompt = useFormDialog();
  let tab = _state('records');
  let problem = _state('');
  let busy = _state(false);
  // 这一步能改的字段改过的值（没改的用单据上存着的）
  let edits = _state<Record<string, unknown>>({});
  const valueOf = (field: FormField) => (field.name in edits ? edits[field.name] : field.value);

  /** 能改的字段的控件：按变量的类型 */
  function control(field: FormField) {
    const set = (next: unknown) => (edits = { ...edits, [field.name]: next });
    const value = valueOf(field);
    switch (field.type) {
      case 'number':
      case 'decimal':
        return <NumberField _value={value as number | null} onUpdate:_value={set} />;
      case 'date':
        return <DatePicker _value={value as string | null} onUpdate:_value={set} />;
      case 'boolean':
        return <Switch _checked={!!value} onUpdate:_checked={set} />;
      default:
        return <TextField _value={(value as string | null) ?? ''} onUpdate:_value={set} />;
    }
  }

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

  /** 意见字段：要写意见的必填，其余可以不写 */
  const commentField = (required: boolean, label = '意见') =>
    ({
      name: 'comment',
      label,
      type: 'textarea',
      required,
      maxlength: 500,
      ...(required ? {} : { placeholder: '可以不写' }),
    }) as const;

  /** 按结果处理：先在对话框里写意见；退回到运行时选的节点时先选退回到哪 */
  async function handle(
    workItem: number,
    step: string,
    outcome: OutcomeChoice,
    targets: readonly { node: string; name: string }[],
  ) {
    const values = await prompt({
      title: `${step}：${outcome.label}`,
      fields: [
        ...(outcome.choose
          ? [
              {
                name: 'returnTo',
                label: '退回到',
                type: 'select',
                required: true,
                options: targets.map((t) => ({ value: t.node, label: t.name })),
                defaultValue: targets.at(-1)?.node,
              } as const,
            ]
          : []),
        commentField(outcome.comment),
      ],
      confirmText: outcome.label,
      ...(outcome.reject ? { tone: 'danger' as const } : {}),
    });
    if (!values) return;
    const comment = values['comment'];
    const returnTo = values['returnTo'];
    // 这一步能改的字段一并提交（引擎只收能改的）
    const editable = (data.value?.fields ?? []).filter((field) => field.editable);
    const variables = Object.fromEntries(editable.map((field) => [field.name, valueOf(field)]));
    await run(() =>
      actions.complete({
        workItem,
        outcome: outcome.key,
        ...(comment ? { comment } : {}),
        ...(returnTo ? { returnTo } : {}),
        ...(editable.length ? { variables } : {}),
      }),
    );
    edits = {};
  }

  /** 转办：交给另一个人处理，自己不再处理 */
  async function transfer(workItem: number, step: string, people: readonly Choice[]) {
    const values = await prompt({
      title: `${step}：转办`,
      fields: [
        { name: 'to', label: '转给', type: 'select', required: true, options: people },
        commentField(false, '说明'),
      ],
      confirmText: '转办',
    });
    if (!values) return;
    const comment = values.comment;
    await run(() => actions.transfer({ workItem, to: values.to, ...(comment ? { comment } : {}) }));
  }

  /** 催办：提醒还没处理的人 */
  async function remind(instance: number) {
    const values = await prompt({
      title: '催办',
      description: '提醒还开着的环节的处理人尽快处理。',
      fields: [commentField(false, '附言')],
      confirmText: '催办',
    });
    if (!values) return;
    const message = values.comment;
    await run(() => actions.remind({ instance, ...(message ? { message } : {}) }));
  }

  /** 管理员：暂停（写原因）、恢复 */
  async function suspend(instance: number) {
    const values = await prompt({
      title: '暂停',
      description: '暂停期间不能认领、处理，到期的作业往后推。',
      fields: [commentField(false, '原因')],
      confirmText: '暂停',
    });
    if (!values) return;
    const comment = values.comment;
    await run(() => actions.suspend({ instance, ...(comment ? { comment } : {}) }));
  }

  /** 管理员：终止（要写原因） */
  async function terminate(instance: number) {
    const values = await prompt({
      title: '终止',
      description: '终止后流程不再往下走，开着的待办一并取消。',
      fields: [commentField(true, '原因')],
      confirmText: '终止',
      tone: 'danger',
    });
    if (!values) return;
    await run(() => actions.terminate({ instance, comment: values.comment }));
  }

  /** 管理员：跳到指定节点（开着的待办取消） */
  async function jump(instance: number, nodes: readonly Choice[]) {
    const values = await prompt({
      title: '跳转',
      description: '取消开着的待办，从选的节点重新开始。',
      fields: [
        { name: 'node', label: '跳到', type: 'select', required: true, options: nodes },
        commentField(false, '原因'),
      ],
      confirmText: '跳转',
    });
    if (!values) return;
    const comment = values.comment;
    await run(() => actions.jump({ instance, node: values.node, ...(comment ? { comment } : {}) }));
  }

  /** 管理员：把开着的待办改派给别人 */
  async function reassign(items: readonly Choice[], people: readonly Choice[]) {
    const values = await prompt({
      title: '改派',
      fields: [
        {
          name: 'item',
          label: '待办',
          type: 'select',
          required: true,
          options: items,
          defaultValue: items[0]?.value,
        },
        { name: 'to', label: '改派给', type: 'select', required: true, options: people },
        commentField(false, '原因'),
      ],
      confirmText: '改派',
    });
    if (!values) return;
    const comment = values.comment;
    await run(() =>
      actions.reassign({
        workItem: Number(values.item),
        to: values.to,
        ...(comment ? { comment } : {}),
      }),
    );
  }

  /** 抄送：让别人也看到这张单子（不用处理） */
  async function cc(instance: number, people: readonly Choice[]) {
    const values = await prompt({
      title: '抄送',
      fields: [
        {
          name: 'users',
          label: '抄送给',
          type: 'select',
          multiple: true,
          required: true,
          options: people,
        },
        commentField(false, '附言'),
      ],
      confirmText: '抄送',
    });
    if (!values) return;
    const message = values.comment;
    await run(() => actions.cc({ instance, users: values.users, ...(message ? { message } : {}) }));
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
          <Badge
            tone={
              active
                ? 'accent'
                : instance.status === 'suspended'
                  ? 'warning'
                  : instance.result === 'approved'
                    ? 'success'
                    : 'neutral'
            }
          >
            {active ? '审批中' : instance.status === 'suspended' ? '已暂停' : '已结束'}
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
          items={
            detail.fields
              ? detail.fields
                  .filter((field) => !field.editable)
                  .map((field) => ({
                    key: field.name,
                    label: field.label,
                    value: valueText(field.value),
                  }))
              : (detail.definition.variables ?? []).map((variable) => ({
                  key: variable.name,
                  label: variable.label ?? variable.name,
                  value: valueText(instance.variables[variable.name]),
                }))
          }
        />
        {detail.fields?.some((field) => field.editable) && (
          <Grid minItemWidth="14rem" gap="md" data-testid="editable-fields">
            {detail.fields
              .filter((field) => field.editable)
              .map((field) => (
                <Field
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  description="这一步可以改"
                >
                  {control(field)}
                </Field>
              ))}
          </Grid>
        )}
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
                title: [
                  EVENTS[event.type] ?? event.type,
                  event.node,
                  event.outcome,
                  event.target && `给 ${event.target}`,
                ]
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
        {(detail.actions.length > 0 || detail.withdrawable || active || detail.admin) && (
          <ActionBar start={detail.actions.map((item) => item.node).join('、') || undefined}>
            {detail.admin && (instance.status === 'active' || instance.status === 'suspended') && (
              <Menu
                trigger={(props) => (
                  <Button {...props} variant="ghost" tone="neutral" disabled={busy}>
                    管理
                  </Button>
                )}
              >
                {instance.status === 'active' ? (
                  <MenuItem onAction={() => void suspend(instance.id)}>暂停</MenuItem>
                ) : (
                  <MenuItem
                    onAction={() => void run(() => actions.resume({ instance: instance.id }))}
                  >
                    恢复
                  </MenuItem>
                )}
                {active && (
                  <MenuItem onAction={() => void jump(instance.id, detail.admin!.nodes)}>
                    跳转…
                  </MenuItem>
                )}
                {active && detail.admin.openItems.length > 0 && (
                  <MenuItem onAction={() => void reassign(detail.admin!.openItems, detail.people)}>
                    改派…
                  </MenuItem>
                )}
                <MenuItem tone="danger" onAction={() => void terminate(instance.id)}>
                  终止…
                </MenuItem>
              </Menu>
            )}
            {active && (
              <Button
                variant="ghost"
                tone="neutral"
                disabled={busy}
                onClick={() => void cc(instance.id, detail.people)}
              >
                抄送
              </Button>
            )}
            {detail.remindable && (
              <Button
                variant="ghost"
                tone="neutral"
                disabled={busy}
                onClick={() => void remind(instance.id)}
              >
                催办
              </Button>
            )}
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
              item.transferable && (
                <Button
                  key={`transfer-${item.id}`}
                  variant="ghost"
                  tone="neutral"
                  disabled={busy}
                  onClick={() => void transfer(item.id, item.node, detail.people)}
                >
                  转办
                </Button>
              ),
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
                  onClick={() => void handle(item.id, item.node, outcome, item.returnTargets)}
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

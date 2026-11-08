/**
 * 审批单上对整张单的动作：发起人撤回、催办，经手的人留言；管理员暂停或恢复、终止、跳转、改派、处理自动处理失败的异常（重试、跳过）。
 * 显示哪些按引擎给的 detail.actions（规则只在引擎里）；做完数据变了，审批单自己刷新。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { FlowCommand, Incident, InstanceDetail } from '@zerodep-dev/flow-ts-engine';
import { formManifest } from '@zerodep-dev/flow-ts-model';
import { Button, Flex, Menu, MenuItem, useConfirm } from '@zerodep-dev/vue-tsx-pro-ui';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { useFlowCenter } from '../runtime/center';
import { who } from './labels';
import { useIncidentActions } from './incidents';
import { showError, toaster } from './toaster';

/** InstanceActions 的属性 */
export interface InstanceActionsProps {
  detail: InstanceDetail;
  /** 这张单上自动处理失败的作业 */
  incidents: readonly Incident[];
}

export const InstanceActions = _component(({ detail, incidents }: InstanceActionsProps) => {
  const center = useFlowCenter();
  const prompt = useFormDialog();
  const confirm = useConfirm();
  let busy = _state('');

  const incidentActions = useIncidentActions();

  /** 做一件事：成功提示、失败按引擎的错误提示 */
  async function act(done: string, work: () => Promise<unknown>) {
    try {
      await work();
      toaster.success(done);
    } catch (error) {
      showError(error);
    }
  }

  const id = () => detail.instance.id;
  const run = (command: FlowCommand) => center.client.run(command);

  async function withdraw() {
    const answers = await prompt({
      title: '撤回这张单？',
      description: '撤回后流程结束，单据留在“我发起的”里。',
      fields: [{ name: 'comment', label: '原因', type: 'textarea' }],
      confirmText: '撤回',
      tone: 'danger',
    });
    if (!answers) return;
    await act('已撤回', () =>
      run({ type: 'withdraw', instance: id(), comment: answers.comment || undefined }),
    );
  }

  async function comment() {
    const answers = await prompt({
      title: '留言',
      fields: [{ name: 'text', label: '内容', type: 'textarea', required: true }],
      confirmText: '留言',
    });
    if (!answers) return;
    await act('已留言', () => run({ type: 'comment', instance: id(), text: answers.text }));
  }

  async function suspend() {
    const answers = await prompt({
      title: '暂停这张单？',
      description: '暂停期间不能认领、处理，到期的作业往后推；恢复后照常。',
      fields: [{ name: 'comment', label: '原因', type: 'textarea' }],
      confirmText: '暂停',
    });
    if (!answers) return;
    await act('已暂停', () =>
      run({ type: 'suspend', instance: id(), comment: answers.comment || undefined }),
    );
  }

  async function terminate() {
    const answers = await prompt({
      title: '终止这张单？',
      description: '终止后流程结束、开着的待办都取消，不能恢复。',
      fields: [{ name: 'comment', label: '原因', type: 'textarea', required: true }],
      confirmText: '终止',
      tone: 'danger',
    });
    if (!answers) return;
    await act('已终止', () => run({ type: 'terminate', instance: id(), comment: answers.comment }));
  }

  async function jump() {
    const nodes = detail.definition.nodes.filter(
      (n) => (n.type === 'task' || n.type === 'end') && !detail.instance.current.includes(n.id),
    );
    const answers = await prompt({
      title: '跳转到',
      description: '正在处理的节点关掉，从选的节点重新开始。',
      fields: [
        {
          name: 'node',
          label: '节点',
          type: 'select',
          required: true,
          options: nodes.map((n) => ({ value: n.id, label: n.name ?? n.id })),
        },
        { name: 'comment', label: '原因', type: 'textarea' },
      ],
      confirmText: '跳转',
    });
    if (!answers) return;
    await act('已跳转', () =>
      run({
        type: 'jump',
        instance: id(),
        node: answers.node,
        comment: answers.comment || undefined,
      }),
    );
  }

  /** 现在的值写成文字（简单的值；空写“—”） */
  const valueText = (value: unknown) =>
    value === undefined || value === null || value === ''
      ? '—'
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value as string | number);

  /** 管理员改得了的字段（单据的字段清单，没有单据时是流程变量）：简单的值（文字、数字、金额、日期） */
  const editable = () =>
    Object.entries(formManifest(detail.definition))
      .filter(([, field]) => ['text', 'number', 'decimal', 'date'].includes(field.type))
      .map(([name, field]) => ({ name, label: field.label, type: field.type }));

  async function changeData() {
    const variables = editable();
    const current = detail.instance.variables as Record<string, unknown>;
    const answers = await prompt({
      title: '改数据',
      description: '改单据上的值，记进流转记录；后面的条件、处理人按新值算。',
      fields: [
        {
          name: 'name',
          label: '字段',
          type: 'select',
          required: true,
          options: variables.map((v) => ({
            value: v.name,
            label: `${v.label ?? v.name}（现在：${valueText(current[v.name])}）`,
          })),
        },
        { name: 'value', label: '改成', type: 'text', required: true },
        { name: 'comment', label: '原因', type: 'textarea', required: true },
      ],
      confirmText: '改',
    });
    if (!answers) return;
    const variable = variables.find((v) => v.name === answers.name)!;
    await act(`已改${variable.label ?? variable.name}`, () =>
      run({
        type: 'changeData',
        instance: id(),
        variables: {
          [variable.name]: variable.type === 'number' ? Number(answers.value) : answers.value,
        },
        comment: answers.comment,
      }),
    );
  }

  async function reassign() {
    const open = detail.workItems.filter((w) => w.state === 'open');
    const answers = await prompt({
      title: '改派',
      fields: [
        {
          name: 'workItem',
          label: '待办',
          type: 'select',
          required: true,
          defaultValue: open.length === 1 ? String(open[0]!.id) : undefined,
          options: open.map((w) => ({
            value: String(w.id),
            label: `${w.nodeName}（${w.assignee ? who(w.assignee) : '收件箱'}）`,
          })),
        },
        { name: 'to', label: '改派给', type: 'select', required: true, options: center.people() },
        { name: 'comment', label: '原因', type: 'textarea' },
      ],
      confirmText: '改派',
    });
    if (!answers) return;
    await act(`已改派给${who(answers.to)}`, () =>
      run({
        type: 'reassign',
        workItem: Number(answers.workItem),
        to: answers.to,
        comment: answers.comment || undefined,
      }),
    );
  }

  async function resume() {
    if (!(await confirm({ title: '恢复这张单？', confirmText: '恢复' }))) return;
    await act('已恢复', () => run({ type: 'resume', instance: id() }));
  }

  return () => {
    const { actions, instance } = detail;
    // 点了就转圈，直到对话框关掉、命令做完；期间别的按钮不能点
    const button = (name: string, label: string, onClick: () => Promise<void>) => (
      <Button
        key={name}
        size="sm"
        variant="outline"
        tone="neutral"
        loading={busy === name}
        disabled={busy !== '' && busy !== name}
        onClick={() => {
          busy = name;
          void onClick().finally(() => (busy = ''));
        }}
      >
        {label}
      </Button>
    );
    return (
      <Flex gap="xs" wrap align="center">
        {actions.withdraw && button('withdraw', '撤回', withdraw)}
        {actions.remind &&
          button('remind', '催办', () =>
            act('已催办', () => run({ type: 'remind', instance: id() })),
          )}
        {button('comment', '留言', comment)}
        {actions.manage &&
          incidents.flatMap((incident) => [
            button(`retry:${incident.jobId}`, `重试“${incident.nodeName ?? incident.kind}”`, () =>
              incidentActions.retry(incident),
            ),
            ...(incident.skippable
              ? [button(`skip:${incident.jobId}`, '跳过', () => incidentActions.skip(incident))]
              : []),
          ])}
        {actions.manage && (
          <Menu
            trigger={(props) => (
              <Button size="sm" variant="soft" tone="neutral" {...props}>
                管理
              </Button>
            )}
          >
            {instance.status === 'suspended' ? (
              <MenuItem onAction={() => void resume()}>恢复</MenuItem>
            ) : (
              <MenuItem onAction={() => void suspend()}>暂停</MenuItem>
            )}
            <MenuItem onAction={() => void jump()}>跳转</MenuItem>
            <MenuItem onAction={() => void reassign()}>改派</MenuItem>
            {editable().length > 0 && (
              <MenuItem onAction={() => void changeData()}>改数据</MenuItem>
            )}
            <MenuItem tone="danger" onAction={() => void terminate()}>
              终止
            </MenuItem>
          </Menu>
        )}
      </Flex>
    );
  };
});

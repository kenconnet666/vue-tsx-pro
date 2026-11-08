/**
 * 处理一份待办（审批单里“我能做的”）：单据按这一步的权限渲染（useFlowForm），每个结果一个按钮，按钮下写出“提交后到哪、谁处理”；
 * 点结果时只在要填的时候弹对话框——要写意见、退回选退到哪、给下一步选处理人。同意前校验单据，驳回、退回不要求填全。
 * 暂存、认领、转办、委托、加签……这些待办上的动作按引擎给的 operations 渲染：新加一个动作插件，这里不用改。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type {
  InstanceDetail,
  NextStep,
  OperationField,
  OperationView,
  OutcomeView,
  WorkItemDetail,
} from '@zerodep-dev/flow-ts-engine';
import { formManifest } from '@zerodep-dev/flow-ts-model';
import { fromFormValues, useFlowForm } from '@zerodep-dev/flow-ts-ui';
import { Button, Flex, Form, SchemaFields, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  ActionBar,
  useFormDialog,
  type FormDialogField,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { getLocalTimeZone } from '@internationalized/date';
import { PEOPLE } from '../domain/org';
import { useFlowCenter } from '../runtime/center';
import { who } from './labels';
import { showError, toaster } from './toaster';

/** HandleTask 的属性 */
export interface HandleTaskProps {
  detail: InstanceDetail;
  item: WorkItemDetail;
  /** 处理完了（待办没了） */
  onDone: () => void;
}

const styles = css.create({
  outcomes: { display: 'flex', flexWrap: 'wrap', gap: '_sm', alignItems: 'flex-start' },
  outcome: { display: 'flex', flexDirection: 'column', gap: '_xs', maxWidth: '16rem' },
});

/** 选人的选项：全部员工 */
const everyone = PEOPLE.map((p) => ({ value: p.id, label: `${p.name}（${p.title}）` }));

/** 下一步的一句话：节点、谁处理 */
function nextText(steps: readonly NextStep[]): string {
  if (steps.length === 0) return '';
  return steps
    .map((step) => {
      if (step.type === 'end') return `结束：${step.nodeName}`;
      if (step.pick) return `${step.nodeName}（要选处理人）`;
      if (step.inbox) return `${step.nodeName}（收件箱，谁有空谁认领）`;
      if (step.handlers.length > 0) return `${step.nodeName}：${step.handlers.map(who).join('、')}`;
      return step.nodeName;
    })
    .join('；');
}

/** 动作的字段 → 对话框的字段 */
function dialogField(field: OperationField): FormDialogField {
  const base = { name: field.name, label: field.label, required: field.required ?? false };
  switch (field.type) {
    case 'user':
      return { ...base, type: 'select', options: everyone };
    case 'users':
      return { ...base, type: 'select', options: everyone, multiple: true };
    case 'select':
      return { ...base, type: 'select', options: [...(field.options ?? [])] };
    default:
      return { ...base, type: field.type };
  }
}

/** 处理一份待办 */
export const HandleTask = _component(({ detail, item, onDone }: HandleTaskProps) => {
  const center = useFlowCenter();
  const prompt = useFormDialog();
  const manifest = formManifest(detail.definition);
  const node = detail.definition.nodes.find((n) => n.id === item.workItem.node);
  const timeZone = getLocalTimeZone();
  let busy = _state('');
  // 同意经表单的提交（先校验）；pending 是这次按的结果
  let pending: OutcomeView | undefined;

  const form = useFlowForm({
    manifest,
    access: node?.type === 'task' ? node.form : undefined,
    values: { ...detail.instance.variables, ...(item.draft?.values ?? {}) },
    timeZone,
    onSubmit: (values) => finish(pending!, values),
  });

  /** 按了结果之后要填的：意见、退到哪、给下一步选人 */
  async function finish(outcome: OutcomeView, variables: Record<string, unknown>) {
    const fields: FormDialogField[] = [];
    if (outcome.targets.length > 0)
      fields.push({
        name: 'returnTo',
        label: '退回到',
        type: 'select',
        required: true,
        options: outcome.targets.map((t) => ({
          value: t.node,
          label: t.handler ? `${t.nodeName}（${who(t.handler)}）` : t.nodeName,
        })),
      });
    for (const pick of outcome.picks)
      fields.push({
        name: `pick:${pick.node}`,
        label: `${pick.nodeName}由谁处理`,
        type: 'select',
        required: true,
        multiple: pick.max !== 1,
        options: pick.candidates
          ? pick.candidates.map((id) => ({ value: id, label: who(id) }))
          : everyone,
      });
    if (outcome.comment === 'required' || fields.length > 0)
      fields.push({
        name: 'comment',
        label: '意见',
        type: 'textarea',
        required: outcome.comment === 'required',
      });
    const answers = fields.length
      ? await prompt({ title: outcome.label, fields, confirmText: outcome.label })
      : {};
    if (!answers) return;
    const picks = Object.fromEntries(
      outcome.picks.map((pick) => {
        const value = (answers as Record<string, unknown>)[`pick:${pick.node}`];
        return [pick.node, Array.isArray(value) ? value : [value]];
      }),
    );
    const comment = (answers as Record<string, string>)['comment'];
    const returnTo = (answers as Record<string, string>)['returnTo'];
    busy = outcome.key;
    try {
      await center.client.run({
        type: 'complete',
        workItem: item.workItem.id,
        outcome: outcome.key,
        variables,
        ...(comment ? { comment } : {}),
        ...(returnTo ? { returnTo } : {}),
        ...(outcome.picks.length > 0 ? { picks } : {}),
      });
      toaster.success(`已${outcome.label}`);
      onDone();
    } catch (error) {
      showError(error);
    } finally {
      busy = '';
    }
  }

  async function choose(outcome: OutcomeView) {
    const kind = outcome.kind ?? 'approve';
    // 驳回、退回不校验单据（引擎也不要求填全），按现在的值交上去
    if (kind === 'reject' || kind === 'return' || kind === 'terminate')
      return finish(outcome, fromFormValues(manifest, form.values, timeZone));
    pending = outcome;
    await form.submit();
  }

  async function operate(operation: OperationView) {
    const input =
      operation.name === 'saveDraft'
        ? { variables: fromFormValues(manifest, form.values, timeZone) }
        : operation.fields.length > 0
          ? await prompt({
              title: operation.label,
              fields: operation.fields.map(dialogField),
              confirmText: operation.label,
            })
          : {};
    if (!input) return;
    busy = operation.name;
    try {
      await center.client.run({
        type: 'operate',
        workItem: item.workItem.id,
        operation: operation.name,
        input,
      });
      toaster.success(`已${operation.label}`);
      if (operation.name !== 'saveDraft') onDone();
    } catch (error) {
      showError(error);
    } finally {
      busy = '';
    }
  }

  return () => (
    <Flex direction="column" gap="md">
      {/* 只要字段：提交由下面的结果按钮发起（form.submit），不要表单自带的提交、重置按钮 */}
      {Object.keys(manifest).length > 0 && (
        <Form controller={form}>
          <SchemaFields controller={form} columns={2} />
        </Form>
      )}
      <ActionBar
        start={
          item.operations.length > 0 && (
            <Flex gap="xs" wrap>
              {item.operations.map((operation) => (
                <Button
                  key={operation.name}
                  size="sm"
                  variant="ghost"
                  tone={operation.tone === 'danger' ? 'danger' : 'neutral'}
                  loading={busy === operation.name}
                  onClick={() => void operate(operation)}
                >
                  {operation.label}
                </Button>
              ))}
            </Flex>
          )
        }
      >
        <div {...css.attrs(styles.outcomes)}>
          {item.outcomes.map((outcome) => (
            <div key={outcome.key} {...css.attrs(styles.outcome)}>
              <Button
                variant={(outcome.kind ?? 'approve') === 'approve' ? 'solid' : 'outline'}
                tone={outcome.kind === 'reject' ? 'danger' : 'accent'}
                loading={busy === outcome.key}
                disabled={busy !== '' && busy !== outcome.key}
                onClick={() => void choose(outcome)}
              >
                {outcome.label}
              </Button>
              {outcome.next.length > 0 && (
                <Small tone="muted">之后：{nextText(outcome.next)}</Small>
              )}
            </div>
          ))}
        </div>
      </ActionBar>
    </Flex>
  );
});

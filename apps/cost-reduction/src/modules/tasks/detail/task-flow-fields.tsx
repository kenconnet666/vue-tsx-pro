/**
 * 任务池流程里各节点要填的业务字段（流程面板的对话框里）：建卡选主办；验证窗结论填起止与是否达标；
 * 收益认定填锁定的 A（默认最新一版测算）；商务回填 B、合同编号、商务条件与差额归因
 */
import {
  DateRangePicker,
  Field,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Textarea,
  TextField,
  type ProcessOutcome,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { dict, ownerOptions } from '../../../app/master';
import { latestEstimate } from '../../../domain/task/benefit';
import type { CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';
import type { WorkflowValues } from '../../../shared/WorkflowPanel';

/** 任务卡的流程字段：对话框里的内容与各节点的初始值 */
export function taskFlowFields(task: () => CostTask) {
  const money = () => costKinds[task().kind];
  const amountField = (values: WorkflowValues, key: string, label: string) => (
    <Field label={`${label}（${money().unit}）`} required>
      <NumberField
        value={_bind(
          () => (values[key] as Decimal | null | undefined) ?? null,
          (next: Decimal | null) => (values[key] = next),
        )}
        valueType={Decimal}
        format={money().format}
        min={0}
        suffix={money().unit}
      />
    </Field>
  );

  return {
    fields: (outcome: ProcessOutcome, _node: string, values: WorkflowValues) => {
      const need = (field: string) => outcome.fields?.includes(field);
      return (
        <>
          {need('owner') && (
            <Field label="主办" required description="责任团队里的产品团队成员">
              <Select
                items={ownerOptions()}
                value={_bind(
                  () => (values.owner as string | undefined) ?? null,
                  (next: string | null) => (values.owner = next),
                )}
              />
            </Field>
          )}
          {need('verifyWindow') && (
            <Field label="验证窗起止" required>
              <DateRangePicker
                value={_bind(
                  () => (values.verifyWindow as { start: string; end: string } | undefined) ?? null,
                  (next: { start: string; end: string } | null) => (values.verifyWindow = next),
                )}
              />
            </Field>
          )}
          {need('verdict') && (
            <Field label="结论" required>
              <RadioGroup
                orientation="horizontal"
                value={_bind(
                  () => (values.verdict as string | undefined) ?? '',
                  (next: string) => (values.verdict = next),
                )}
              >
                <Radio value="达标">达标</Radio>
                <Radio value="不达标">不达标</Radio>
              </RadioGroup>
            </Field>
          )}
          {need('a') && amountField(values, 'a', '锁定的测算金额 A')}
          {need('b') && amountField(values, 'b', '谈定金额 B')}
          {need('contractNo') && (
            <Field label="合同编号" required>
              <TextField
                value={_bind(
                  () => (values.contractNo as string | undefined) ?? '',
                  (next: string) => (values.contractNo = next),
                )}
              />
            </Field>
          )}
          {need('terms') && (
            <Field label="商务条件" required>
              <Textarea
                rows={2}
                value={_bind(
                  () => (values.terms as string | undefined) ?? '',
                  (next: string) => (values.terms = next),
                )}
              />
            </Field>
          )}
          {need('b') && (
            <Field label="差额 D 的归因" description="B 与 A 不同时必选">
              <Select
                items={dict('gapReasons')}
                value={_bind(
                  () => (values.gapReason as string | undefined) ?? null,
                  (next: string | null) => (values.gapReason = next),
                )}
                clearable
              />
            </Field>
          )}
        </>
      );
    },
    defaults: (node: string): WorkflowValues => {
      const current = task();
      switch (node) {
        case 'create':
          return { owner: current.owner };
        case 'confirm':
          return { a: current.a ?? latestEstimate(current) };
        case 'negotiate':
          return { b: current.a, gapReason: null, terms: '按年度框架协议执行' };
        default:
          return {};
      }
    },
  };
}

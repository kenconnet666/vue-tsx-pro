/**
 * 审批按钮：一个人工节点的处理结果排成一组按钮（通过是主按钮，否决、终止红色，退回、提级普通描边）。
 * 结果要求意见、附件或业务字段时，点了先弹对话框填写（必填的没填不能提交），填好再交给 onComplete；
 * 什么都不要求的直接提交。onComplete 返回 Promise 时按钮显示加载中，失败（reject）时对话框留着
 * （对话框的取消、确认与等待用 Dialog 的 onConfirm）。
 *
 *   <ApprovalActions
 *     node="齐全性检查"
 *     outcomes={workItemOutcomes(flow, item)}
 *     onComplete={(input) => completeWorkItem(item.id, input)}
 *   />
 *
 * 业务字段（派单选产品团队、认定填金额）由 fields 给出对话框里的内容，validate 校验，变量由使用方随 onComplete 一起提交。
 * 部件：Root（按钮组）、Button（每个结果的按钮，可以按结果计算）、Dialog。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { useMessages } from '../config/lang/messages';
import { Field } from '../form/Field';
import { Textarea } from '../input/Textarea';
import { existingUploadFile, Upload, type UploadFile, type UploadHandler } from '../input/Upload';
import { Flex, type FlexProps } from '../layout/Flex';
import { Dialog, type DialogProps } from '../overlay/Dialog';
import { mergePartProps } from '../utils/props';
import type { ProcessOutcome, ProcessOutcomeKind } from './definition';
import { workflowMessages } from './messages';

/** 交给 onComplete 的内容 */
export interface ApprovalInput {
  /** 处理结果 */
  outcome: string;
  /** 意见（去掉首尾空白） */
  comment: string;
  /** 附件：upload 的返回值，没有 upload 时是文件名 */
  attachments: string[];
}

/** 未声明的属性落到按钮组（Flex）上 */
export interface ApprovalActionsProps extends Partial<FlexProps> {
  /** 处理结果（workItemOutcomes 取自流程定义） */
  outcomes: readonly ProcessOutcome[];
  /** 节点名称：对话框的标题里用 */
  node?: string;
  /** 不能处理（流程暂停、不是自己的待办） */
  disabled?: boolean;
  /** 提交：返回 Promise 时等它完成；失败时对话框留着 */
  onComplete: (input: ApprovalInput) => unknown;
  /** 结果要求的业务字段在对话框里的内容（fields 不为空的结果才调用） */
  fields?: (outcome: ProcessOutcome) => VNodeChild;
  /** 业务字段的校验：返回错误说明时不提交 */
  validate?: (outcome: ProcessOutcome) => string | null | undefined;
  /** 上传一个附件，返回附件的标识（地址或文件名）；不写时只记文件名 */
  upload?: UploadHandler;
  /**
   * 已有的附件（被退回后重新处理时上次交的）：打开对话框时列在附件里，不用重新上传，可以移除；
   * 提交时和新传的一起交上去（url 或文件名）
   */
  attachments?: readonly { name: string; url?: string }[];
  /** 按钮的尺寸，默认 md */
  size?: ButtonProps['size'];
  /** 每个结果的按钮的部件属性，可以按结果计算 */
  propsButton?: Partial<ButtonProps> | ((outcome: ProcessOutcome) => Partial<ButtonProps>);
  /** 对话框的部件属性 */
  propsDialog?: Partial<DialogProps>;
}

/** 结果的种类 → 按钮的样子；第一个通过类的结果是主按钮 */
function buttonLook(kind: ProcessOutcomeKind, primary: boolean): Partial<ButtonProps> {
  switch (kind) {
    case 'approve':
      return primary ? { variant: 'solid' } : { variant: 'soft' };
    case 'reject':
    case 'terminate':
      return { variant: 'outline', tone: 'danger' };
    case 'return':
    case 'escalate':
      return { variant: 'outline', tone: 'neutral' };
  }
}

const styles = css.create({ error: { color: '_dangerText', fontSize: '_sm' } });

/** 审批按钮 */
export const ApprovalActions = _component(
  ({
    outcomes,
    node,
    disabled = false,
    onComplete,
    fields,
    validate,
    upload,
    attachments,
    size,
    propsButton,
    propsDialog,
    ...rest
  }: ApprovalActionsProps) => {
    const messages = useMessages('workflow', workflowMessages);
    let active = _state.raw<ProcessOutcome | null>(null);
    let running = _state<string | null>(null);
    let comment = _state('');
    let files = _state.raw<UploadFile[]>([]);
    // 报错落在对应的字段上；业务字段的校验结果单独显示
    let errors = _state({ comment: '', attachments: '', fields: '' });

    const needsDialog = (outcome: ProcessOutcome) =>
      outcome.comment != null || outcome.attachments != null || (outcome.fields?.length ?? 0) > 0;

    async function submit(outcome: ProcessOutcome, input: ApprovalInput) {
      running = outcome.key;
      try {
        await onComplete(input);
      } finally {
        running = null;
      }
    }

    function open(outcome: ProcessOutcome) {
      if (!needsDialog(outcome)) {
        void submit(outcome, { outcome: outcome.key, comment: '', attachments: [] }).catch(
          () => {},
        );
        return;
      }
      comment = '';
      files = (attachments ?? []).map((file) => existingUploadFile(file));
      errors = { comment: '', attachments: '', fields: '' };
      active = outcome;
    }

    /** 对话框的确认：必填的没填返回 false（对话框留着）；提交失败时对话框也留着，由使用方提示原因 */
    async function confirm() {
      const outcome = active;
      if (!outcome) return false;
      const text = comment.trim();
      const attachments = files
        .filter((item) => item.status === 'done' || (!upload && item.status === 'selected'))
        .map((item) => (typeof item.response === 'string' ? item.response : item.name));
      errors = {
        comment: outcome.comment === 'required' && !text ? messages.commentRequired : '',
        attachments:
          outcome.attachments === 'required' && attachments.length === 0
            ? messages.attachmentsRequired
            : '',
        fields: validate?.(outcome) || '',
      };
      if (errors.comment || errors.attachments || errors.fields) return false;
      await submit(outcome, { outcome: outcome.key, comment: text, attachments });
    }

    return () => {
      const firstApprove = outcomes.find((item) => (item.kind ?? 'approve') === 'approve');
      const current = active;
      return (
        <>
          <Flex
            {...mergePartProps<FlexProps>(
              {
                gap: 'sm',
                align: 'center',
                wrap: true,
                role: 'group',
                'aria-label': messages.approvalActions,
              },
              rest,
            )}
          >
            {outcomes.map((outcome) => {
              const own = typeof propsButton === 'function' ? propsButton(outcome) : propsButton;
              return (
                <Button
                  key={outcome.key}
                  {...mergePartProps<ButtonProps>(
                    {
                      size,
                      ...buttonLook(outcome.kind ?? 'approve', outcome === firstApprove),
                    },
                    own,
                    {
                      disabled: disabled || (running != null && running !== outcome.key),
                      loading: running === outcome.key && !current,
                      onClick: () => open(outcome),
                    },
                  )}
                  data-outcome={outcome.key}
                >
                  {outcome.label}
                </Button>
              );
            })}
          </Flex>
          <Dialog
            size="sm"
            {...propsDialog}
            _open={_bind(
              () => current != null,
              (next: boolean) => {
                if (!next) active = null;
              },
            )}
            title={current ? messages.approvalTitle(current.label, node ?? '') : ''}
            confirmText={current?.label}
            onConfirm={confirm}
            propsConfirm={current ? buttonLook(current.kind ?? 'approve', true) : undefined}
          >
            {current && (
              <Flex direction="column" gap="md">
                {current.fields?.length ? fields?.(current) : null}
                {current.comment != null && (
                  <Field
                    label={messages.comment}
                    required={current.comment === 'required'}
                    error={errors.comment || undefined}
                  >
                    <Textarea _value={_bind(comment)} rows={3} autofocus />
                  </Field>
                )}
                {current.attachments != null && (
                  <Field
                    label={messages.attachments}
                    required={current.attachments === 'required'}
                    error={errors.attachments || undefined}
                  >
                    <Upload _value={_bind(files)} upload={upload} multiple />
                  </Field>
                )}
                {errors.fields && (
                  <div {...css.attrs(styles.error)} role="alert">
                    {errors.fields}
                  </div>
                )}
              </Flex>
            )}
          </Dialog>
        </>
      );
    };
  },
);

/**
 * 分步表单：一份 useForm 的表单分成几步填（开户、准入申请、配置向导），上方是步骤条，下方是这一步的字段与“上一步 / 下一步 / 提交”。
 * 同 Ant Design ProComponents 的 StepsForm。
 *
 *   <StepsForm
 *     form={form}
 *     current={_bind(step)}
 *     steps={[
 *       { title: '企业信息', fields: ['company', 'contact'], content: () => <>…form.Field…</> },
 *       { title: '账号', fields: ['password', 'confirm'], content: () => <>…</> },
 *     ]}
 *   />
 *
 * - “下一步”只校验这一步的字段（form.validate(fields)），通过才往后走，没通过的错误立即显示；走过的步骤可以点回去。
 * - 最后一步是“提交”（表单的原生提交）：整份校验没通过时跳到第一个有错的步骤，那一步在步骤条上标成出错。
 * - 换了一步焦点移到这一步的内容上（读屏念出第几步、标题），键盘接着往下填。
 *
 * 部件：Root（Form）、Steps、Panel（这一步的内容，div）、Actions（Flex）、Previous、Next、Submit（Button）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, useId, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { useMessages } from '../config/lang/messages';
import { Form, type FormProps } from '../form/Form';
import type { FormControllerBase } from '../form/useForm';
import { Flex, type FlexProps } from '../layout/Flex';
import { Steps, type StepItem, type StepsProps } from '../navigation/Steps';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 一步 */
export interface FormStep {
  /** 步骤条上的标题 */
  title: VNodeChild;
  /** 步骤条上的说明 */
  description?: VNodeChild;
  /** 这一步的字段路径（含子路径）：“下一步”只校验它们，出错时这一步标成出错 */
  fields: readonly string[];
  /** 这一步的内容：form.Field 们 */
  content: () => VNodeChild;
}

/** 未声明的属性落到 Form（form 元素）上；标签布局、只读、不可用同 Form */
export interface StepsFormProps extends Omit<FormProps, 'controller' | 'children'> {
  /** useForm 的控制器 */
  form: FormControllerBase;
  /** 各步 */
  steps: readonly FormStep[];
  /** 当前第几步，从 0 开始：父级可以写 current={_bind(x)} */
  current?: number;
  /** 提交按钮的文字，默认取文案（提交） */
  submitText?: VNodeChild;
  /** 步骤条（Steps）的部件属性 */
  propsSteps?: Partial<StepsProps>;
  /** 这一步内容外层的部件属性 */
  propsPanel?: PartProps<'div'>;
  /** 按钮行的部件属性 */
  propsActions?: Partial<FlexProps>;
  /** 上一步按钮的部件属性 */
  propsPrevious?: Partial<ButtonProps>;
  /** 下一步按钮的部件属性 */
  propsNext?: Partial<ButtonProps>;
  /** 提交按钮的部件属性 */
  propsSubmit?: Partial<ButtonProps>;
}

/** StepsForm 的样式：root、panel */
export const stepsFormStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_lg' },
  // 换步后焦点在这里：不画焦点环（内容本身不是控件），读屏念出它的名称
  panel: { display: 'flex', flexDirection: 'column', gap: '_md', outline: 'none' },
});

/** 字段 path 在这一步里：就是它，或是它的子路径（`address.city` 属于 `address`） */
const inStep = (step: FormStep, path: string) =>
  step.fields.some((field) => path === field || path.startsWith(`${field}.`));

/** 分步表单：步骤条 + 这一步的字段 + 上一步、下一步、提交 */
export const StepsForm = _component(
  ({
    form,
    steps,
    current = _bindable(0),
    submitText,
    propsSteps,
    propsPanel,
    propsActions,
    propsPrevious,
    propsNext,
    propsSubmit,
    ...rest
  }: StepsFormProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const id = useId();
    let panel = _state.raw<HTMLElement | null>(null);

    /** 这一步有显示着的错误 */
    const hasError = (step: FormStep) =>
      Object.keys(form.errors).some((path) => inStep(step, path) && form.visibleError(path));

    /** 换到第 index 步，焦点移到这一步的内容上 */
    function go(index: number) {
      current = index;
      void nextTick(() => panel?.focus());
    }

    async function next() {
      const step = steps[current];
      if (step && (await form.validate(step.fields))) go(current + 1);
    }

    // 整份提交没通过：跳到第一个有错的步骤
    _effect(() => {
      if (form.submitCount === 0 || form.submitting) return;
      const first = steps.findIndex(hasError);
      if (first >= 0 && first !== current && !hasError(steps[current]!)) go(first);
    });

    const items = (): StepItem[] =>
      steps.map((step, index) => ({
        title: step.title,
        description: step.description,
        status: hasError(step) ? 'error' : undefined,
        // 只能点回走过的步骤
        disabled: index > current,
      }));

    return () => {
      const step = steps[current];
      const last = current >= steps.length - 1;
      return (
        <Form {...rest} controller={form}>
          <div {...css.attrs(stepsFormStyles.root)}>
            <Steps
              {...mergePartProps<StepsProps>({ items: items() }, propsSteps, {
                items: items(),
                navigable: true,
              })}
              current={_bind(
                () => current,
                (index: number) => go(index),
              )}
            />
            <div
              {...mergeAttrs<'div'>({ sx: stepsFormStyles.panel }, propsPanel, {
                ref: _toRef(panel),
                id: `${id}-panel`,
                tabindex: -1,
                role: 'group',
                'aria-label': messages.stepsFormStep(current + 1, steps.length),
              })}
            >
              {step?.content()}
            </div>
            <Flex {...mergePartProps<FlexProps>({ justify: 'end', gap: 'sm' }, propsActions)}>
              {current > 0 && (
                <Button
                  {...mergePartProps<ButtonProps>(
                    { variant: 'ghost', tone: 'neutral' },
                    propsPrevious,
                    { onClick: () => go(current - 1) },
                  )}
                >
                  {messages.stepsFormPrevious}
                </Button>
              )}
              {last ? (
                <Button
                  {...mergePartProps<ButtonProps>({}, propsSubmit, {
                    type: 'submit',
                    loading: form.submitting,
                  })}
                >
                  {submitText ?? messages.stepsFormSubmit}
                </Button>
              ) : (
                <Button
                  {...mergePartProps<ButtonProps>({}, propsNext, {
                    loading: form.validating(),
                    onClick: () => void next(),
                  })}
                >
                  {messages.stepsFormNext}
                </Button>
              )}
            </Flex>
          </div>
        </Form>
      );
    };
  },
);

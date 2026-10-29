/**
 * 表单的上下文与校验：Form 提供，Field、FormItem 用 `useFormItem` 登记自己（名字、规则、取值），
 * 提交时按顺序校验，出错的项显示消息。单独一个模块（不带组件），Form、FormItem、Field 都要导入。
 *
 *   const item = useFormItem({ name: () => name, rules: () => rules, value: () => value, label: () => label });
 *   item.error             // 当前的错误消息（没有时 undefined）
 *   await item.validate('blur')
 */
import { createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { onBeforeUnmount, shallowRef, watch, type VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';

/** 标题的位置 */
export interface FormLabelPositions {
  /** 左边，固定宽度（默认） */
  left: unknown;
  /** 上面，控件占满一行 */
  top: unknown;
}

/** 什么时候校验 */
export interface FormValidateTriggers {
  /** 失去焦点时（输入框的默认） */
  blur: unknown;
  /** 值变了就校验 */
  change: unknown;
  /** 只在提交时 */
  submit: unknown;
}

/** 一条校验规则；按顺序检查，第一条不通过的给出消息 */
export interface FormRule {
  /** 必填：空字符串、空数组、null、undefined、false 算没填 */
  required?: boolean;
  /** 字符串要匹配的格式 */
  pattern?: RegExp;
  /** 自定义：返回 false 或消息表示不通过，可以是异步的（查重名） */
  validator?: (value: unknown) => boolean | string | Promise<boolean | string>;
  /** 不通过时的消息；不给时必填用语言包的“请填写…” */
  message?: string;
  /**
   * 什么时候检查这一条；不给时按 Form 的 validateTrigger
   */
  trigger?: keyof FormValidateTriggers;
}

/** 登记到表单里的一项 */
export interface FormItemHandle {
  /** 字段名：提交时作为值的键 */
  readonly name: string | undefined;
  /** 当前的值 */
  readonly value: unknown;
  /** 当前的错误消息 */
  readonly error: string | undefined;
  /** 校验；trigger 为 submit 时检查所有规则，否则只检查这个时机的 */
  validate(trigger?: keyof FormValidateTriggers): Promise<string | undefined>;
  /** 清掉错误消息 */
  resetValidation(): void;
  /** 滚到这一项（出错时） */
  scrollIntoView(): Promise<void>;
}

/** 表单提供给各项的 */
export interface FormState {
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly labelWidth: string | undefined;
  readonly labelPosition: keyof FormLabelPositions;
  readonly inputAlign: 'left' | 'right';
  readonly validateTrigger: keyof FormValidateTriggers;
  register(item: FormItemHandle): () => void;
  /** 提交：校验所有项，通过时调用 onSubmit */
  submit(): void;
}

/** 表单的上下文 */
export const FormContext = createContext<FormState>('Form');

/** 不在 Form 里也能单独用的项：读不到上下文时为 null */
export const useForm = (): FormState | null => FormContext.inject(null);

/** 值是不是“没填” */
export function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** 用一条规则检查值：通过时 undefined，不通过时消息 */
async function check(
  rule: FormRule,
  value: unknown,
  label: string,
  requiredText: (label: string) => string,
) {
  if (rule.required && isEmptyValue(value)) return rule.message ?? requiredText(label);
  // 没填的非必填项不查格式
  if (isEmptyValue(value)) return undefined;
  if (rule.pattern && !rule.pattern.test(String(value as string))) return rule.message ?? '';
  if (rule.validator) {
    const result = await rule.validator(value);
    if (result === false) return rule.message ?? '';
    if (typeof result === 'string' && result) return result;
  }
  return undefined;
}

/** useFormItem 的参数：都是 getter，跟着组件的 props 变 */
export interface FormItemOptions {
  name: () => string | undefined;
  rules: () => readonly FormRule[] | undefined;
  value: () => unknown;
  /** 标题：必填消息里用 */
  label: () => VNodeChild;
  /** 滚到这一项要量的元素 */
  element?: () => unknown;
}

/** 一个表单项的校验状态；在 Form 里时登记进去，提交时一起校验 */
export function useFormItem(options: FormItemOptions) {
  const form = useForm();
  const config = useConfig();
  const host = useHost();
  const error = shallowRef<string>();
  // 异步校验可能交错：只认最后一次
  let version = 0;
  const handle: FormItemHandle = {
    get name() {
      return options.name();
    },
    get value() {
      return options.value();
    },
    get error() {
      return error.value;
    },
    async validate(trigger = 'submit') {
      const current = ++version;
      const fallback = form?.validateTrigger ?? 'blur';
      const label = options.label();
      for (const rule of options.rules() ?? []) {
        if (trigger !== 'submit' && (rule.trigger ?? fallback) !== trigger) continue;
        const message = await check(
          rule,
          options.value(),
          typeof label === 'string' ? label : '',
          config.lang.fieldRequired,
        );
        if (current !== version) return error.value;
        if (message !== undefined) return (error.value = message);
      }
      return (error.value = undefined);
    },
    resetValidation() {
      version++;
      error.value = undefined;
    },
    async scrollIntoView() {
      const rect = await host.measure(options.element?.());
      // 顶部留一点空，不贴着导航栏
      if (rect) host.scrollTo(host.scrollTop() + rect.top - 16, { smooth: true });
    },
  };
  // 值变了：已经报错的项整个重查（改对了消息就消失），否则只查 change 时机的规则
  watch(options.value, () => void handle.validate(error.value === undefined ? 'change' : 'submit'));
  const unregister = form?.register(handle);
  if (unregister) onBeforeUnmount(unregister);
  return {
    get error() {
      return error.value;
    },
    get required() {
      return options.rules()?.some((rule) => rule.required) ?? false;
    },
    form,
    validate: (trigger?: keyof FormValidateTriggers) => handle.validate(trigger),
    resetValidation: () => handle.resetValidation(),
  };
}

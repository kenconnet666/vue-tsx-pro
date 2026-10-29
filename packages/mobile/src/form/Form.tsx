/**
 * 表单：收集里面各项（Field、FormItem）的值，点 `type="submit"` 的按钮（或在输入框里按键盘的确认键）时
 * 按顺序校验，都通过时 onSubmit 收到 { 字段名: 值 }，否则滚到第一个出错的项、onFailed 收到错误列表。
 *
 *   <Form onSubmit={(values) => save(values)}>
 *     <CellGroup inset>
 *       <Field name="phone" label="手机号" _value={phone} type="tel" rules={[{ required: true }, { pattern: /^1\d{10}$/, message: '手机号格式不对' }]} />
 *       <Field name="code" label="验证码" _value={code} rules={[{ required: true }]} />
 *     </CellGroup>
 *     <Button type="submit" fullWidth>登录</Button>
 *   </Form>
 *
 * 不渲染原生 form（小程序里没有）：提交按钮由这里认出来，H5 与小程序一样。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  FormContext,
  type FormItemHandle,
  type FormLabelPositions,
  type FormValidateTriggers,
} from './context';

/** 一个出错的项 */
export interface FormError {
  /** 字段名 */
  name: string | undefined;
  /** 消息 */
  message: string;
}

/** 未声明的属性落到根元素（div）上 */
export interface FormProps extends Omit<PartProps<'div'>, 'onSubmit'> {
  /** 全部项禁用 */
  disabled?: boolean;
  /** 全部项只读 */
  readonly?: boolean;
  /** 标题的宽度（CSS 长度） */
  labelWidth?: string;
  /**
   * 标题的位置
   * @default 'left'
   */
  labelPosition?: keyof FormLabelPositions;
  /**
   * 输入框里文字的对齐
   * @default 'left'
   */
  inputAlign?: 'left' | 'right';
  /**
   * 规则没写 trigger 时什么时候校验
   * @default 'blur'
   */
  validateTrigger?: keyof FormValidateTriggers;
  /**
   * 校验不通过时滚到第一个出错的项
   * @default true
   */
  scrollToError?: boolean;
  /** 校验通过：各项的值，以字段名为键 */
  onSubmit?: (values: Record<string, unknown>) => void;
  /** 校验不通过 */
  onFailed?: (details: { values: Record<string, unknown>; errors: FormError[] }) => void;
  /** 表单项与提交按钮 */
  children?: VNodeChild;
}

/** 节点是不是提交按钮（H5 的元素与小程序的节点都有 getAttribute） */
const isSubmit = (node: unknown) => {
  const element = node as { getAttribute?: (name: string) => string | null } | null;
  return (
    element?.getAttribute?.('type') === 'submit' && element.getAttribute('aria-busy') !== 'true'
  );
};

/** 表单（div） */
export const Form = _component(
  ({
    disabled = false,
    readonly = false,
    labelWidth,
    labelPosition = 'left',
    inputAlign = 'left',
    validateTrigger = 'blur',
    scrollToError = true,
    onSubmit,
    onFailed,
    children,
    ...rest
  }: FormProps) => {
    const items: FormItemHandle[] = [];
    const values = () => {
      const result: Record<string, unknown> = {};
      for (const item of items) if (item.name !== undefined) result[item.name] = item.value;
      return result;
    };
    const submit = async () => {
      const errors: FormError[] = [];
      let first: FormItemHandle | undefined;
      // 按登记的顺序（即页面上的顺序）一起校验
      const messages = await Promise.all(items.map((item) => item.validate('submit')));
      messages.forEach((message, index) => {
        if (message === undefined) return;
        first ??= items[index];
        errors.push({ name: items[index]!.name, message });
      });
      if (!errors.length) return onSubmit?.(values());
      if (scrollToError) void first?.scrollIntoView();
      onFailed?.({ values: values(), errors });
    };
    FormContext.provide({
      get disabled() {
        return disabled;
      },
      get readonly() {
        return readonly;
      },
      get labelWidth() {
        return labelWidth;
      },
      get labelPosition() {
        return labelPosition;
      },
      get inputAlign() {
        return inputAlign;
      },
      get validateTrigger() {
        return validateTrigger;
      },
      register(item) {
        items.push(item);
        return () => items.splice(items.indexOf(item), 1);
      },
      submit: () => void submit(),
    });
    // 点了提交按钮：从点到的元素往上找，到表单为止
    const onClick = (event: Event) => {
      for (
        let node = event.target as { parentNode?: unknown; parent?: unknown } | null;
        node && node !== event.currentTarget;
        node = (node.parentNode ?? node.parent) as typeof node
      )
        if (isSubmit(node)) return void submit();
    };
    return () => <div {...mergeAttrs<'div'>({}, rest, { onClick })}>{children}</div>;
  },
);

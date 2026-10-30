/**
 * 表单项：左边（或上面）标题，右边任意控件，下面是说明或错误消息。输入框用 Field；开关、单选、步进器这类控件放进 FormItem。
 *
 *   <FormItem label="消息通知" name="notify" value={notify}>
 *     <Switch _checked={notify} />
 *   </FormItem>
 *   <FormItem label="配送方式" name="delivery" value={delivery} rules={[{ required: true, message: '请选择配送方式' }]}>
 *     <RadioGroup _value={delivery} direction="horizontal">…</RadioGroup>
 *   </FormItem>
 *
 * 有 name 时登记到 Form：提交时值以 name 为键，按 rules 校验；单独用时 error 由使用方给。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { dividerImage, dividerLayout } from '../theme/divider';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { useForm, useFormItem, type FormLabelPositions, type FormRule } from './context';

/** 表单项的布局（Field 共用） */
export interface FormItemLayout {
  /** 标题 */
  label?: VNodeChild;
  /** 标题前加红色星号；有必填规则时自动加 */
  required?: boolean;
  /** 控件下面的说明（没有错误时显示） */
  help?: VNodeChild;
  /** 错误消息：给了就显示（优先于校验的结果） */
  error?: string;
  /** 标题的位置；不给时随 Form */
  labelPosition?: keyof FormLabelPositions;
  /** 标题的宽度（CSS 长度）；不给时随 Form，默认 6.2em */
  labelWidth?: string;
  /** 标题与控件垂直居中（默认顶端对齐，说明多行时标题仍在第一行） */
  center?: boolean;
  /** 标题的部件属性 */
  propsLabel?: PartProps<'div'>;
  /** 控件与消息那一栏的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 错误消息（或说明）的部件属性 */
  propsMessage?: PartProps<'div'>;
}

/** 未声明的属性落到根元素（div）上 */
export interface FormItemProps extends FormItemLayout, PartProps<'div', 'title'> {
  /** 字段名：在 Form 里时提交的值以它为键 */
  name?: string;
  /** 校验规则 */
  rules?: FormRule[];
  /** 当前的值：校验与提交时读它（控件自己的绑定照常写在控件上） */
  value?: unknown;
  /** 控件 */
  children?: VNodeChild;
}

/** FormItem 的样式：root、top、center、label、required、body、control、help、error */
export const formItemStyles = css.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_md',
    width: '100%',
    minHeight: '_control',
    paddingBlock: '0.7em',
    paddingInline: '_lg',
    fontSize: '_md',
    lineHeight: '1.5',
    color: '_text',
    backgroundColor: '_surface',
    // 细线同 Cell：从左边内边距处画到右边，最后一项不画
    backgroundImage: {
      default: dividerImage,
      ':last-child': 'none',
    },
    ...dividerLayout,
  },
  top: { flexDirection: 'column', alignItems: 'stretch', gap: '0.4em' },
  center: { alignItems: 'center' },
  label: {
    flex: 'none',
    overflowWrap: 'anywhere',
    color: { default: '_text', '[data-disabled]': '_textDisabled' },
  },
  required: { color: '_dangerText', marginInlineEnd: '0.15em' },
  body: { flex: '1 1 auto', minWidth: 0 },
  control: { display: 'flex', alignItems: 'center', gap: '_sm', minHeight: '1.5em' },
  help: { marginBlockStart: '0.25em', fontSize: '_xs', color: '_textMuted' },
  error: { color: '_dangerText' },
});

/** 表单项的外层：标题 + 控件 + 消息；Field 也用它画 */
export function renderFormItem(
  layout: FormItemLayout & { disabled?: boolean; required: boolean },
  attrs: Record<string, unknown> | undefined,
  control: VNodeChild,
  ref?: (element: unknown) => void,
) {
  const top = layout.labelPosition === 'top';
  const message = layout.error ?? layout.help;
  return (
    <div
      {...mergeAttrs<'div'>(
        {
          sx: [
            formItemStyles.root,
            top && formItemStyles.top,
            layout.center && !top && formItemStyles.center,
          ],
        },
        attrs,
        dataAttrs({ 'data-error': layout.error !== undefined, 'data-disabled': layout.disabled }),
      )}
      ref={ref}
    >
      {hasContent(layout.label) && (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: formItemStyles.label,
              style: top ? undefined : { width: layout.labelWidth ?? '6.2em' },
            },
            layout.propsLabel,
            dataAttrs({ 'data-disabled': layout.disabled }),
          )}
        >
          {layout.required && (
            <span {...mergeAttrs<'span'>({ sx: formItemStyles.required })} aria-hidden="true">
              *
            </span>
          )}
          {layout.label}
        </div>
      )}
      <div {...mergeAttrs<'div'>({ sx: formItemStyles.body }, layout.propsBody)}>
        <div {...mergeAttrs<'div'>({ sx: formItemStyles.control })}>{control}</div>
        {hasContent(message) && (
          <div
            {...mergeAttrs<'div'>(
              { sx: [formItemStyles.help, layout.error !== undefined && formItemStyles.error] },
              layout.propsMessage,
              { role: layout.error !== undefined ? 'alert' : undefined },
            )}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

/** 表单项（div > 标题 + 控件 + 消息） */
export const FormItem = _component(
  ({
    name,
    rules,
    value,
    label,
    required,
    help,
    error,
    labelPosition,
    labelWidth,
    center = false,
    children,
    propsLabel,
    propsBody,
    propsMessage,
    ...rest
  }: FormItemProps) => {
    const form = useForm();
    let element: unknown = null;
    const item = useFormItem({
      name: () => name,
      rules: () => rules,
      value: () => value,
      label: () => label,
      element: () => element,
    });
    return () =>
      renderFormItem(
        {
          label,
          required: required ?? item.required,
          help,
          error: error ?? item.error,
          labelPosition: labelPosition ?? form?.labelPosition,
          labelWidth: labelWidth ?? form?.labelWidth,
          center,
          disabled: form?.disabled,
          propsLabel,
          propsBody,
          propsMessage,
        },
        rest,
        children,
        (node) => (element = node),
      );
  },
);

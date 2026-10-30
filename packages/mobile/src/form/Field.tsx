/**
 * 输入框：表单里的一行，左边标题，右边输入框（或多行输入），可清除、显示字数、带前后缀；在 Form 里时参与校验与提交。
 *
 *   <Field label="收货人" _value={name} placeholder="请输入姓名" clearable />
 *   <Field label="手机号" _value={phone} type="tel" maxlength={11} rules={[{ required: true }]} name="phone" />
 *   <Field label="备注" _value={note} multiline autosize maxlength={200} showWordLimit />
 *   <Field label="短信验证码" _value={code} suffix={<Button size="sm">发送</Button>} />
 *
 * 数字用 type="number"（可带小数）或 "digit"（整数）：H5 是文本框加 inputmode（不出现上下箭头），小程序是对应的键盘。
 * 拼音输入法组字的过程中不更新值，组完一次写回。
 */
import { CircleX } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, watch, type VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useConfig } from '../config/context';
import { isMiniProgram, useHost } from '../utils/host';
import { dataAttrs, hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { useFormItem, type FormRule } from './context';
import { renderFormItem, type FormItemLayout } from './FormItem';

/** 输入的类型 */
export interface FieldTypes {
  /** 文字（默认） */
  text: unknown;
  /** 密码：输入的字遮住 */
  password: unknown;
  /** 数字，可带小数：数字键盘 */
  number: unknown;
  /** 整数：纯数字键盘 */
  digit: unknown;
  /** 电话号码：拨号键盘 */
  tel: unknown;
  /** 昵称：微信小程序里键盘上方给出微信昵称（type="nickname"），其余同文字 */
  nickname: unknown;
}

/** 输入框的属性与事件由组件管理 */
export type FieldInputManaged =
  'value' | 'type' | 'disabled' | 'readonly' | 'maxlength' | 'placeholder';

/** 未声明的属性落到根元素（div）上 */
export interface FieldProps extends FormItemLayout, PartProps<'div', 'title' | 'prefix'> {
  /** 输入的内容；双向绑定写 `_value={x}` */
  _value?: string;
  /** 占位文字 */
  placeholder?: string;
  /**
   * 类型
   * @default 'text'
   */
  type?: keyof FieldTypes;
  /** 多行输入 */
  multiline?: boolean;
  /**
   * 多行输入的行数（autosize 时是最少的行数）
   * @default 2
   */
  rows?: number;
  /** 多行输入的高度随内容变 */
  autosize?: boolean;
  /** 最多输入多少个字 */
  maxlength?: number;
  /** 在下面显示字数（要有 maxlength） */
  showWordLimit?: boolean;
  /** 有内容时显示清除按钮 */
  clearable?: boolean;
  /** 禁用；在 Form 里时随 Form */
  disabled?: boolean;
  /** 只读；在 Form 里时随 Form */
  readonly?: boolean;
  /** 输入框里文字的对齐；不给时随 Form */
  inputAlign?: 'left' | 'right';
  /** 输入框前的图标 */
  icon?: IconData;
  /** 输入框前的内容（区号、单位） */
  prefix?: VNodeChild;
  /** 输入框后的内容（按钮、单位） */
  suffix?: VNodeChild;
  /** 字段名：在 Form 里时提交的值以它为键 */
  name?: string;
  /** 校验规则 */
  rules?: FormRule[];
  /** 获得焦点 */
  onFocus?: (event: Event) => void;
  /** 失去焦点 */
  onBlur?: (event: Event) => void;
  /** 点了清除按钮 */
  onClear?: () => void;
  /** 输入框（input / textarea）的部件属性 */
  propsInput?: PartProps<'input', FieldInputManaged>;
  /** 清除按钮的部件属性 */
  propsClear?: PartProps<'button'>;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
}

/** Field 的样式：input、right、textarea、multiline、icon、affix、clear、count */
export const fieldStyles = css.create({
  input: {
    boxSizing: 'border-box',
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    height: '1.5em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_text', '[disabled]': '_textDisabled' },
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    outlineStyle: 'none',
  },
  right: { textAlign: 'end' },
  textarea: { height: 'auto', resize: 'none', overflowY: 'auto' },
  multiline: { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0 },
  icon: { flex: 'none', fontSize: '1.15em', color: '_textMuted' },
  affix: { flex: 'none', display: 'inline-flex', alignItems: 'center', color: '_textMuted' },
  clear: {
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5em',
    height: '1.5em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_textPlaceholder', ':active': '_textMuted' },
    fontSize: '1.05em',
    cursor: 'pointer',
  },
  count: {
    alignSelf: 'flex-end',
    marginBlockStart: '0.25em',
    fontSize: '_xs',
    color: '_textMuted',
  },
});

/** H5 的输入框属性：数字用文本框加 inputmode（type=number 有上下箭头、会吞掉非数字） */
const INPUT_ATTRS = {
  text: { type: 'text' },
  password: { type: 'password' },
  number: { type: 'text', inputmode: 'decimal' },
  digit: { type: 'text', inputmode: 'numeric' },
  tel: { type: 'tel' },
  // autocomplete 的 nickname 是标准的自动填充值；小程序运行时按它换成昵称输入框
  nickname: { type: 'text', autocomplete: 'nickname' },
} as const;

/** 输入框（div > 标题 + 输入框 + 消息） */
export const Field = _component(
  ({
    _value: value = _bindable(''),
    placeholder,
    type = 'text',
    multiline = false,
    rows = 2,
    autosize = false,
    maxlength,
    showWordLimit = false,
    clearable = false,
    disabled,
    readonly,
    inputAlign,
    icon,
    prefix,
    suffix,
    name,
    rules,
    label,
    required,
    help,
    error,
    labelPosition,
    labelWidth,
    center = false,
    onFocus,
    onBlur,
    onClear,
    propsInput,
    propsClear,
    propsIcon,
    propsLabel,
    propsBody,
    propsMessage,
    ...rest
  }: FieldProps) => {
    const config = useConfig();
    const host = useHost();
    let element: unknown = null;
    let input: (HTMLInputElement & HTMLTextAreaElement) | null = null;
    let focused = _state(false);
    // 拼音输入法组字中：不写回值
    let composing = false;
    const item = useFormItem({
      name: () => name,
      rules: () => rules,
      value: () => value,
      label: () => label,
      element: () => element,
    });
    const isDisabled = () => disabled ?? item.form?.disabled ?? false;
    const isReadonly = () => readonly ?? item.form?.readonly ?? false;

    // H5 的多行自动高度：按内容的 scrollHeight 撑开（小程序的 textarea 有 auto-height）
    const resize = () => {
      if (!autosize || isMiniProgram(host) || !input) return;
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    };
    watch(
      () => value,
      () => void nextTick(resize),
    );

    const update = (next: string) => {
      // 按 UTF-16 的长度截，同浏览器的 maxlength
      value = maxlength !== undefined ? next.slice(0, maxlength) : next;
      // 截掉超出的部分后输入框里还是用户敲的：同步回去
      if (input && input.value !== value) input.value = value;
    };
    const clear = () => {
      value = '';
      onClear?.();
      input?.focus();
    };

    return () => {
      const off = isDisabled();
      const showClear = clearable && !off && !isReadonly() && value !== '' && focused;
      const align = inputAlign ?? item.form?.inputAlign;
      const attrs = mergeAttrs<'input'>(
        {
          sx: [
            fieldStyles.input,
            multiline && fieldStyles.textarea,
            align === 'right' && fieldStyles.right,
          ],
          // 多行的高度：autosize 时是最小高度（小程序 auto-height 时 height 不起作用）
          style: multiline ? { [autosize ? 'minHeight' : 'height']: `${rows * 1.5}em` } : undefined,
        },
        propsInput,
        {
          value,
          placeholder,
          disabled: off,
          readonly: isReadonly(),
          maxlength,
          ...(multiline ? {} : INPUT_ATTRS[type]),
          onInput: (event: Event) => {
            if (!composing) update((event.target as HTMLInputElement).value);
          },
          onCompositionstart: () => (composing = true),
          onCompositionend: (event: Event) => {
            composing = false;
            update((event.target as HTMLInputElement).value);
          },
          onFocus: (event: Event) => {
            focused = true;
            onFocus?.(event);
          },
          onBlur: (event: Event) => {
            // 晚一点藏清除按钮：小程序里点它时输入框先失焦，立刻藏掉就点不到了
            setTimeout(() => (focused = false), 150);
            onBlur?.(event);
            void item.validate('blur');
          },
          onKeydown: (event: KeyboardEvent) => {
            // 单行输入框里按确认键（回车）：在表单里就提交
            if (event.key === 'Enter' && !multiline && item.form) item.form.submit();
          },
          ...dataAttrs({ 'data-autosize': multiline && autosize }),
        },
      );
      const ref = (node: unknown) => (input = node as typeof input);
      const box = multiline ? (
        // 输入框与多行输入的属性相同，类型上按 textarea 收
        <textarea {...(attrs as PartProps<'textarea'>)} rows={rows} ref={ref} />
      ) : (
        <input {...attrs} ref={ref} />
      );
      const control = [
        icon && <Icon {...mergePartProps<IconProps>({ icon, sx: fieldStyles.icon }, propsIcon)} />,
        hasContent(prefix) && (
          <span {...mergeAttrs<'span'>({ sx: fieldStyles.affix })}>{prefix}</span>
        ),
        multiline ? (
          <div {...mergeAttrs<'div'>({ sx: fieldStyles.multiline })}>
            {box}
            {showWordLimit && maxlength !== undefined && (
              <span {...mergeAttrs<'span'>({ sx: fieldStyles.count })}>
                {config.lang.wordLimit(value.length, maxlength)}
              </span>
            )}
          </div>
        ) : (
          box
        ),
        showClear && (
          <button
            {...mergeAttrs<'button'>({ sx: fieldStyles.clear }, propsClear, {
              type: 'button',
              'aria-label': config.lang.clear,
              // H5：按下时不让输入框失焦，键盘不收起
              onMousedown: (event: Event) => event.preventDefault(),
              onClick: clear,
            })}
          >
            <Icon icon={CircleX} />
          </button>
        ),
        hasContent(suffix) && (
          <span {...mergeAttrs<'span'>({ sx: fieldStyles.affix })}>{suffix}</span>
        ),
        !multiline && showWordLimit && maxlength !== undefined && (
          <span {...mergeAttrs<'span'>({ sx: fieldStyles.affix })}>
            {config.lang.wordLimit(value.length, maxlength)}
          </span>
        ),
      ];
      return renderFormItem(
        {
          label,
          required: required ?? item.required,
          help,
          error: error ?? item.error,
          labelPosition: labelPosition ?? item.form?.labelPosition,
          labelWidth: labelWidth ?? item.form?.labelWidth,
          center,
          disabled: off,
          propsLabel,
          propsBody,
          propsMessage,
        },
        rest,
        control,
        (node) => (element = node),
      );
    };
  },
);

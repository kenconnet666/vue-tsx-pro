/**
 * 表单字段：标签 + 控件 + 说明 + 错误信息，并把它们关联起来（参考 Ark UI Field、React Aria 的 Label / Description / FieldError）。
 *
 *   <Field label="邮箱" description="用于找回密码" error={errors.email} required>
 *     <TextField value={_bind(form.email)} type="email" />
 *   </Field>
 *
 * Field 经上下文告诉里面的控件：控件的 id（标签的 for 指向它）、标签的 id（不是原生输入的控件用 aria-labelledby）、
 * 说明与错误的 id（aria-describedby），以及 invalid / required / disabled / readonly。
 * 控件上显式写的状态优先于 Field 的。控件用 useFieldControl 读取这些信息，单独使用（不在 Field 里）时照常工作。
 * 在 Form 里写了 name 时，错误信息取自表单控制器（useForm），焦点离开字段时报告失焦（何时显示错误见 useForm）。
 *
 * 标签可以放在起始边（`labelPlacement="start"`）：标签一列、控件一列，标签与控件的第一行文字按基线对齐，
 * 多行文本框、勾选组也对得齐。通常在 Form、FormSection 上统一设置（见 field-layout），整组的只读、不可用同样从那里来。
 *
 * 部件：Root（div）、Label（Label）、Control（div，标签在起始边时包住控件、说明与错误）、
 * Description（Text）、Error（Text，带警示图标）。
 */
import { Asterisk } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import { focusControl } from '../utils/dom/focus';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { statusIcons } from '../utils/style/tone-styles';
import {
  FieldLayoutContext,
  type FieldLabelAligns,
  type FieldLabelPlacements,
} from './field-layout';
import { FormContext } from './Form';
import type { FieldConstraints } from './form-constraints';

const NO_CONSTRAINTS: FieldConstraints = Object.freeze({});

/** Field 交给控件的信息 */
export interface FieldState {
  /** 控件（主元素）的 id，标签的 for 指向它 */
  readonly controlId: string;
  /** 标签的 id：控件不是原生输入元素（滑块、单选组）时用 aria-labelledby 指向它 */
  readonly labelId: string | undefined;
  /** 说明与错误信息的 id，空格分隔，给 aria-describedby */
  readonly describedBy: string | undefined;
  /** 校验未通过 */
  readonly invalid: boolean;
  /** 必填 */
  readonly required: boolean;
  /** 不可用 */
  readonly disabled: boolean;
  /** 只读 */
  readonly readonly: boolean;
  /** 从表单 schema 推出的约束（在 Form 里写了 name 时）；控件据此加 maxlength、min / max 等 */
  readonly constraints: FieldConstraints;
}

/** Field 的上下文：自定义控件用 useFieldControl 接入，一般不直接读它；null 表示子树不属于任何 Field */
export const FieldContext = createContext<FieldState | null>('Field');

/** 控件自己的状态（不写时取 Field 的） */
export interface FieldControlOptions {
  /** 控件上显式写的 id */
  id?: string;
  /** 校验未通过 */
  invalid?: boolean;
  /** 必填；在 Form 里写了 name 时默认按表单的 schema（如 z.string().min(1)） */
  required?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
}

/** useFieldControl 的选项 */
export interface FieldControlUse {
  /** 输入交给里面的另一个控件（DatePicker 里的 DateField）：子树仍属于 Field，由那个控件接 */
  delegate?: boolean;
}

/** 控件合并 Field 之后的状态与关联属性 */
export interface FieldControl {
  /** 控件的 id：显式写的优先，其次是 Field 给的 */
  id: string | undefined;
  /** 不是原生输入元素的控件用它作 aria-labelledby */
  labelledBy: string | undefined;
  /** aria-describedby */
  describedBy: string | undefined;
  /** 校验未通过 */
  invalid: boolean;
  /** 必填 */
  required: boolean;
  /** 不可用 */
  disabled: boolean;
  /** 只读 */
  readonly: boolean;
  /** 从表单 schema 推出的约束；不在 Field 里、或推不出时为空对象。控件上显式写的属性优先 */
  constraints: FieldConstraints;
}

/**
 * 所在的表单重置时（form.reset()、type="reset" 的按钮）调用：控件丢掉自己还没写回的输入（日期分段打了一半）。
 * 值本身由表单改回去；只是半截输入时值一直是 null，重置前后没有变化，控件不知道要清。在 setup 里调用
 */
export function useFormReset(onReset: () => void): void {
  const form = FormContext.inject(null);
  if (form) watch(() => form.resetCount, onReset);
}

/**
 * 控件读取所在 Field 的信息（在 setup 里调用，返回的函数在渲染时调用）：
 * 控件上显式写的状态优先；不在 Field 里时用控件自己的，不可用与只读再看所在的 Form、FormSection。
 * 控件里再嵌的控件（Select 的搜索框、区间的两个框、时间面板的列表）不是 Field 的控件，
 * 拿到 Field 的 id、说明与必填会重复 id、让表单提交被空的搜索框拦住：调用后子树与 Field 隔开，
 * 除非写了 delegate
 */
export function useFieldControl(
  read: () => FieldControlOptions,
  { delegate = false }: FieldControlUse = {},
): () => FieldControl {
  const field = FieldContext.inject(null);
  if (!delegate) FieldContext.provide(null);
  const layout = field ? null : FieldLayoutContext.inject(null);
  return () => {
    const own = read();
    return {
      id: own.id ?? field?.controlId,
      labelledBy: field?.labelId,
      describedBy: field?.describedBy,
      invalid: own.invalid ?? field?.invalid ?? false,
      required: own.required ?? field?.required ?? false,
      disabled: own.disabled ?? field?.disabled ?? layout?.disabled ?? false,
      readonly: own.readonly ?? field?.readonly ?? layout?.readonly ?? false,
      constraints: field?.constraints ?? NO_CONSTRAINTS,
    };
  };
}

/** 未声明的属性落到 label 上 */
export interface LabelProps extends PartProps<'label'> {
  /** 必填：文字后加一个星号图标（对读屏隐藏，必填由控件的 required 告诉读屏） */
  required?: boolean;
  /** 不可用：变淡 */
  disabled?: boolean;
  /** 必填标记的部件属性 */
  propsRequired?: Partial<IconProps>;
  children?: VNodeChild;
}

/** Field 的样式：root、disabled、required */
export const labelStyles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '_xs',
    fontSize: '_sm',
    fontWeight: '_medium',
    lineHeight: '_tight',
    color: '_text',
  },
  disabled: { opacity: '_disabled' },
  required: { alignSelf: 'flex-start', width: '0.7em', height: '0.7em', color: '_dangerText' },
});

/**
 * for 指向的不是原生能被标签关联的元素（单选组、滑块组、日期分段这类 role="group"）时，点标签浏览器什么也不做：
 * 改为聚焦它里面第一个能聚焦的控件（同点原生输入框的标签）
 */
function focusGroupControl(event: MouseEvent) {
  const label = event.currentTarget as HTMLLabelElement;
  if (event.defaultPrevented || label.control || !label.htmlFor) return;
  const target = label.ownerDocument.getElementById(label.htmlFor);
  if (target) focusControl(target);
}

/** 表单标签（label）：for 指向控件；Field 里自动关联，单独使用时自己写 for */
export const Label = _component(
  ({ required = false, disabled = false, propsRequired, children, ...rest }: LabelProps) =>
    () => (
      <label
        {...mergeAttrs<'label'>(
          { sx: [labelStyles.root, disabled && labelStyles.disabled] },
          rest,
          { onClick: focusGroupControl },
        )}
        data-disabled={disabled || undefined}
      >
        {children}
        {required && (
          <Icon
            {...mergePartProps<IconProps>(
              { icon: Asterisk, sx: labelStyles.required },
              propsRequired,
            )}
          />
        )}
      </label>
    ),
);

/** 未声明的属性落到外层 div 上 */
export interface FieldProps extends PartProps<'div'> {
  /** 在 Form 里对应的字段路径（如 `email`、`address.city`）：错误取自表单控制器 */
  name?: string;
  /** 标签 */
  label?: VNodeChild;
  /** 控件下方的说明 */
  description?: VNodeChild;
  /** 错误信息：给了（且 invalid 不是 false）就显示，并把控件标为出错；在 Form 里写了 name 时默认取表单的错误 */
  error?: VNodeChild;
  /** 校验未通过；不写时有 error 就算出错 */
  invalid?: boolean;
  /** 必填 */
  required?: boolean;
  /** 不可用；不写时取所在 Form、FormSection 的 */
  disabled?: boolean;
  /** 只读；不写时取所在 Form、FormSection 的 */
  readonly?: boolean;
  /** 标签放在哪；不写时取所在 Form、FormSection 的，都没写时在上方 */
  labelPlacement?: keyof FieldLabelPlacements;
  /** 标签在起始边时标签列的宽度：数字是 px，也可以写 CSS 长度；默认 `'8em'` */
  labelWidth?: number | string;
  /** 标签在起始边时文字的对齐，默认 end（贴着控件） */
  labelAlign?: keyof FieldLabelAligns;
  /** 标签的部件属性 */
  propsLabel?: Partial<LabelProps>;
  /** 控件列（标签在起始边时包住控件、说明与错误的 div）的部件属性 */
  propsControl?: PartProps<'div'>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 错误信息的部件属性 */
  propsError?: Partial<TextProps>;
  /** 控件 */
  children?: VNodeChild;
}

/** 标签在起始边时默认的标签列宽度：放得下七八个汉字 */
const DEFAULT_LABEL_WIDTH = '8em';

/** Field 的样式：root、start、label…、control、hint、error、errorIcon */
export const fieldStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  // 标签一列、控件一列；第一行按基线对齐：标签与输入框里的文字、勾选项的文字在同一条线上
  start: {
    display: 'grid',
    columnGap: '_md',
    rowGap: '_xs',
    alignItems: 'baseline',
  },
  labelStart: { justifySelf: 'start', textAlign: 'start' },
  labelEnd: { justifySelf: 'end', textAlign: 'end' },
  // 没有标签时控件仍放在第二列，与上下的字段对齐
  controlWithoutLabel: { gridColumnStart: '2' },
  control: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  hint: { fontSize: '_sm', lineHeight: '_normal' },
  error: { display: 'inline-flex', alignItems: 'flex-start', gap: '_xs' },
  errorIcon: { flexShrink: 0, marginBlock: '0.25em' },
});

/** Field 的动态样式：标签列的宽度 */
export const fieldColumnStyles = stylex.create({
  columns: (labelWidth: string) => ({ gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }),
});

/** 表单字段：标签、控件、说明、错误信息，自动关联 id 与状态 */
export const Field = _component(
  ({
    name,
    label,
    description,
    error,
    invalid,
    required,
    disabled,
    readonly,
    labelPlacement,
    labelWidth,
    labelAlign,
    propsLabel,
    propsControl,
    propsDescription,
    propsError,
    children,
    ...rest
  }: FieldProps) => {
    const id = useId();
    const ids = {
      control: `${id}-control`,
      label: `${id}-label`,
      description: `${id}-description`,
      error: `${id}-error`,
    };
    const form = FormContext.inject(null);
    const layout = FieldLayoutContext.inject(null);
    // error={cond && '…'} 条件不成立时是 false：当作没写，用表单的错误
    const message = () =>
      hasContent(error) ? error : name != null ? form?.visibleError(name) : undefined;
    const showError = () => hasContent(message()) && invalid !== false;
    const constraints = () => (name != null && form ? form.constraints(name) : NO_CONSTRAINTS);
    const isRequired = () => required ?? constraints().required ?? false;
    const isDisabled = () => disabled ?? layout?.disabled ?? false;
    const isReadonly = () => readonly ?? layout?.readonly ?? false;

    FieldContext.provide({
      controlId: ids.control,
      get labelId() {
        return hasContent(label) ? ids.label : undefined;
      },
      get describedBy() {
        const parts = [hasContent(description) && ids.description, showError() && ids.error];
        return parts.filter(Boolean).join(' ') || undefined;
      },
      get invalid() {
        return invalid ?? hasContent(message());
      },
      get required() {
        return isRequired();
      },
      get constraints() {
        return constraints();
      },
      get disabled() {
        return isDisabled();
      },
      get readonly() {
        return isReadonly();
      },
    });

    // 焦点离开整个字段（不是在字段内部移动）时报告失焦
    function onFocusout(event: FocusEvent) {
      const next = event.relatedTarget;
      const field = event.currentTarget as HTMLElement;
      if (name != null && !(next instanceof Node && field.contains(next))) form?.blur(name);
    }

    return () => {
      const placement = labelPlacement ?? layout?.labelPlacement ?? 'top';
      const start = placement === 'start';
      const width = labelWidth ?? layout?.labelWidth ?? DEFAULT_LABEL_WIDTH;
      const align = labelAlign ?? layout?.labelAlign ?? 'end';
      const hints = [
        hasContent(description) && (
          <Text
            {...mergePartProps<TextProps>(
              { tone: 'muted', sx: fieldStyles.hint },
              propsDescription,
              {
                id: ids.description,
              },
            )}
          >
            {description}
          </Text>
        ),
        showError() && (
          <Text
            {...mergePartProps<TextProps>(
              { tone: 'danger', sx: [fieldStyles.hint, fieldStyles.error] },
              propsError,
              { id: ids.error },
            )}
          >
            <Icon icon={statusIcons.danger} sx={fieldStyles.errorIcon} />
            {message()}
          </Text>
        ),
      ];
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: start
                ? [
                    fieldStyles.start,
                    fieldColumnStyles.columns(typeof width === 'number' ? `${width}px` : width),
                  ]
                : fieldStyles.root,
            },
            rest,
            { onFocusout },
          )}
          data-invalid={(invalid ?? message() != null) || undefined}
          data-disabled={isDisabled() || undefined}
          data-label-placement={placement}
        >
          {hasContent(label) && (
            <Label
              {...mergePartProps<LabelProps>(
                {
                  required: isRequired(),
                  disabled: isDisabled(),
                  sx: start && (align === 'end' ? fieldStyles.labelEnd : fieldStyles.labelStart),
                },
                propsLabel,
                { id: ids.label, for: ids.control },
              )}
            >
              {label}
            </Label>
          )}
          {start ? (
            <div
              {...mergeAttrs<'div'>(
                { sx: [fieldStyles.control, label == null && fieldStyles.controlWithoutLabel] },
                propsControl,
              )}
            >
              {children}
              {hints}
            </div>
          ) : (
            [children, hints]
          )}
        </div>
      );
    };
  },
);

/**
 * 命令式的小表单对话框：一个操作前要填一两个字段（退回的原因、改派给谁、驳回的说明），不值得为它单独写一个对话框组件。
 *
 *   const prompt = useFormDialog();              // setup 里
 *   const values = await prompt({
 *     title: '退回收件箱',
 *     fields: [{ name: 'reason', label: '原因', type: 'textarea', required: true }],
 *     confirmText: '退回',
 *     onSubmit: (values) => releaseWorkItem(id, values.reason),   // 可选：失败时对话框留着
 *   });
 *   if (values) refresh();                       // 取消、Esc 时是 null
 *
 * 字段是 text（默认）、textarea、select（options）、date（ISO 日期，可限 min / max）；required 的没填、validate 返回说明时，错误落在字段下面、不提交。
 * 值都是字符串（去掉首尾空白）。onSubmit 返回 Promise 时确认按钮显示加载中，失败（reject）时对话框留着，由调用方提示原因。
 * 对话框渲染在组件树之外，沿用调用处的主题、语言（同 useConfirm）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { useId, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { DatePicker } from '../date/DatePicker';
import { Field } from '../form/Field';
import { Select } from '../input/Select';
import { Textarea } from '../input/Textarea';
import { TextField } from '../input/TextField';
import { Flex } from '../layout/Flex';
import type { StatusTone } from '../utils/style/tone-styles';
import { useDetachedDialog } from '../overlay/detached';
import { Dialog, type DialogProps } from '../overlay/Dialog';

/** 对话框里的一个字段 */
export interface FormDialogField {
  /** 字段名：结果里的 key */
  name: string;
  /** 标签 */
  label: string;
  /**
   * 控件：单行文字、多行文字、下拉选择、日期（值是 ISO 日期 'YYYY-MM-DD'）
   * @default 'text'
   */
  type?: 'text' | 'textarea' | 'select' | 'date';
  /** 必填 */
  required?: boolean;
  /** 下拉的选项（type 为 select）；description 是选项的第二行 */
  options?: readonly { value: string; label: string; description?: string }[];
  /** 初始值 */
  defaultValue?: string;
  /** 占位文字 */
  placeholder?: string;
  /** 标签下面的说明 */
  description?: VNodeChild;
  /** 最多几个字（text、textarea） */
  maxlength?: number;
  /** 最早可选的日期（type 为 date，ISO 日期） */
  min?: string;
  /** 最晚可选的日期（type 为 date，ISO 日期） */
  max?: string;
  /** 校验：返回错误说明时不提交；values 是全部字段的值 */
  validate?: (value: string, values: Readonly<Record<string, string>>) => string | null | undefined;
}

/** prompt() 的选项 */
export interface FormDialogOptions {
  /** 标题 */
  title: VNodeChild;
  /** 标题下面的说明 */
  description?: VNodeChild;
  /** 字段 */
  fields: readonly FormDialogField[];
  /** 确认按钮的文字，默认取语言包（确定） */
  confirmText?: VNodeChild;
  /** 确认按钮的色调，默认 accent；驳回、终止用 danger */
  tone?: StatusTone;
  /**
   * 对话框的尺寸
   * @default 'sm'
   */
  size?: DialogProps['size'];
  /** 提交：返回 Promise 时等它完成，失败时对话框留着 */
  onSubmit?: (values: Record<string, string>) => unknown;
}

/** 对话框的内容：字段、错误、提交 */
const FormDialogBody = _component(
  ({
    options,
    _open: open = _bindable(true),
    onDone,
    onClose,
  }: {
    options: FormDialogOptions;
    _open?: boolean;
    /** 提交成功：带上值 */
    onDone: (values: Record<string, string>) => void;
    /** 对话框关上了（不论提交还是取消） */
    onClose: () => void;
  }) => {
    const lang = useLang();
    // 初始值只取一次：对话框打开后由用户填
    let values = _state<Record<string, string>>(
      Object.fromEntries(
        _untrack(options.fields).map((field) => [field.name, field.defaultValue ?? '']),
      ),
    );
    let errors = _state<Record<string, string>>({});
    // 确认按钮是这个表单的提交按钮：在输入框里按 Enter 也是确认（浏览器的隐式提交会点它）
    const formId = useId();

    /** 对话框的确认：校验没过返回 false（对话框留着）；onSubmit 失败时对话框也留着 */
    async function confirm() {
      const trimmed = Object.fromEntries(
        Object.entries(values).map(([name, value]) => [name, value.trim()]),
      );
      errors = Object.fromEntries(
        options.fields
          .map((field): [string, string] => {
            const value = trimmed[field.name] ?? '';
            const message =
              field.required && !value ? lang.formRequired : field.validate?.(value, trimmed);
            return [field.name, message ?? ''];
          })
          .filter(([, message]) => message),
      );
      if (Object.keys(errors).length > 0) return false;
      await options.onSubmit?.(trimmed);
      onDone(trimmed);
    }

    const control = (field: FormDialogField, autofocus: boolean) => {
      switch (field.type) {
        case 'textarea':
          return (
            <Textarea
              _value={values[field.name] ?? ''}
              onUpdate:_value={(next: string) => (values[field.name] = next)}
              rows={3}
              placeholder={field.placeholder}
              maxlength={field.maxlength}
              autofocus={autofocus}
            />
          );
        case 'date':
          return (
            <DatePicker
              _value={values[field.name] || null}
              onUpdate:_value={(next: string | null) => (values[field.name] = next ?? '')}
              min={field.min}
              max={field.max}
            />
          );
        case 'select':
          return (
            <Select
              items={field.options ?? []}
              _value={values[field.name] || null}
              onUpdate:_value={(next: string | null) => (values[field.name] = next ?? '')}
              placeholder={field.placeholder}
            />
          );
        default:
          return (
            <TextField
              _value={values[field.name] ?? ''}
              onUpdate:_value={(next: string) => (values[field.name] = next)}
              placeholder={field.placeholder}
              maxlength={field.maxlength}
              autofocus={autofocus}
            />
          );
      }
    };

    return () => (
      <Dialog
        size={options.size ?? 'sm'}
        _open={open}
        onClose={() => onClose()}
        title={options.title}
        description={options.description}
        tone={options.tone}
        confirmText={options.confirmText}
        onConfirm={confirm}
        propsConfirm={{ type: 'submit', form: formId }}
      >
        <form id={formId} onSubmit={(event: Event) => event.preventDefault()}>
          <Flex direction="column" gap="md">
            {options.fields.map((field, index) => (
              <Field
                key={field.name}
                label={field.label}
                description={field.description}
                required={field.required}
                error={errors[field.name] || undefined}
              >
                {control(field, index === 0)}
              </Field>
            ))}
          </Flex>
        </form>
      </Dialog>
    );
  },
);

/**
 * 命令式的小表单对话框：在组件 setup 里调用，返回 prompt(options)。
 * 提交（onSubmit 完成）时得到填好的值，取消、Esc 时得到 null
 */
export function useFormDialog(): (
  options: FormDialogOptions,
) => Promise<Record<string, string> | null> {
  const mount = useDetachedDialog();
  return (options) =>
    new Promise((resolve) => {
      let result: Record<string, string> | null = null;
      mount((host) => (
        <FormDialogBody
          options={options}
          _open={host.open}
          onDone={(values) => (result = values)}
          onClose={() => {
            resolve(result);
            host.closed();
          }}
        />
      ));
    });
}

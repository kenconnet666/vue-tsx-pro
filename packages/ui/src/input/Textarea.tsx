/**
 * 多行文本框：外壳与 TextField 相同（control），高度随内容增长，在 rows 与 maxRows 之间。
 *
 *   <Field label="备注"><Textarea value={_bind(note)} rows={3} maxRows={8} /></Field>
 *
 * 自动增高：内容变化后（含父级改值）把高度设为 scrollHeight，上下限用 lh 单位（行高的倍数）由 CSS 夹住。
 * 没用 field-sizing: content：Firefox 还不支持，样式的类型表里也没有。中文输入法照常（v-model）。
 *
 * 未声明的属性落到 textarea（主元素）上，外壳用 propsRoot。部件：Root（外壳）、Textarea。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, useId } from 'vue';
import { CharacterCount, type CharacterCountProps } from './CharacterCount';
import { useFieldControl } from '../form/Field';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { PresetIconButtonProps } from '../base/CloseButton';
import {
  controlClear,
  controlStyles,
  controlSx,
  useControlAppearance,
  type ControlOptions,
} from './control';

/** 值与状态由组件管理 */
export type TextareaManaged =
  'value' | 'rows' | 'disabled' | 'readonly' | 'required' | 'aria-invalid' | 'aria-describedby';

/** 未声明的属性落到 textarea（主元素）上；外壳用 propsRoot */
export interface TextareaProps extends PartProps<'textarea', TextareaManaged>, ControlOptions {
  /** 输入值：父级写 value={_bind(x)} 双向绑定 */
  value?: string;
  /** 最少显示几行，默认 3 */
  rows?: number;
  /** 最多增高到几行，之后出现滚动条；默认不限 */
  maxRows?: number;
  /** 不随内容增高，固定为 rows 行（可以拖动右下角改变高度） */
  fixed?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 显示字数计数（右下角）；上限取 maxlength（含 zod 推出的约束），超出时用危险色 */
  showCount?: boolean;
  /** 有内容时在右上角显示清空按钮 */
  clearable?: boolean;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 字数计数的部件属性 */
  propsCount?: Partial<CharacterCountProps>;
}

/** Textarea 的样式：textarea、fixed、count、clear */
export const textareaStyles = css.create({
  textarea: { resize: 'none', overflowY: 'auto' },
  fixed: { resize: 'vertical' },
  // 计数贴在右下角
  count: { alignSelf: 'flex-end', paddingBlockEnd: '_xs' },
  // 清空按钮贴在第一行（多行时不随内容居中）
  clear: { alignSelf: 'flex-start', marginBlockStart: '_xs' },
});

// 行数是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Textarea 的样式：min、max */
export const textareaRowStyles = css.create({
  min: (rows: number) => ({ minHeight: `${rows}lh` }),
  max: (rows: number) => ({ maxHeight: `${rows}lh` }),
});

/** 多行文本框：高度随内容增长 */
export const Textarea = _component(
  ({
    value = _bindable(''),
    rows = 3,
    maxRows,
    fixed = false,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    showCount = false,
    clearable = false,
    id,
    propsRoot,
    propsCount,
    propsClear,
    ...rest
  }: TextareaProps) => {
    const countId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let textarea = _state.raw<HTMLTextAreaElement | null>(null);

    // 内容变化（含父级改值）后按内容高度重设
    _effect(() => {
      if (fixed || !textarea) return;
      void value;
      const element = textarea;
      void nextTick(() => {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      });
    });

    return () => {
      const state = control();
      const limit = rest.maxlength ?? state.constraints.maxLength;
      const describedBy = [state.describedBy, showCount && countId].filter(Boolean).join(' ');
      return (
        <div
          {...mergeAttrs<'div'>({ sx: controlSx(appearance(), state, true) }, propsRoot)}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          <textarea
            {...mergeAttrs<'textarea'>(
              {
                sx: [
                  controlStyles.input,
                  textareaStyles.textarea,
                  fixed && textareaStyles.fixed,
                  textareaRowStyles.min(rows),
                  maxRows != null && !fixed && textareaRowStyles.max(maxRows),
                ],
                minlength: state.constraints.minLength,
                maxlength: state.constraints.maxLength,
              },
              rest,
              {
                ref: _toRef(textarea),
                id: state.id,
                rows,
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-invalid': state.invalid || undefined,
                'aria-describedby': describedBy || undefined,
              },
            )}
            value={_bind(value)}
          />
          {clearable &&
            value &&
            !state.disabled &&
            !state.readonly &&
            controlClear({ sx: textareaStyles.clear, ...propsClear }, () => {
              value = '';
              textarea?.focus();
            })}
          {showCount && (
            <CharacterCount
              {...mergePartProps<CharacterCountProps>(
                {
                  sx: textareaStyles.count,
                  count: value.length,
                  max: limit == null ? undefined : Number(limit),
                },
                propsCount,
                { id: countId },
              )}
            />
          )}
        </div>
      );
    };
  },
);

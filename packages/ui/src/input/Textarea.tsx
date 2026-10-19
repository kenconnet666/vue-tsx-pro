/**
 * 多行文本框：外壳与 TextField 相同（control-styles），高度随内容增长，在 rows 与 maxRows 之间。
 *
 *   <Field label="备注"><Textarea value={_bind(note)} rows={3} maxRows={8} /></Field>
 *
 * 自动增高：内容变化后（含父级改值）把高度设为 scrollHeight，上下限用 lh 单位（行高的倍数）由 CSS 夹住。
 * 没用 field-sizing: content：Firefox 还不支持，StyleX 的类型里也没有。中文输入法照常（v-model）。
 *
 * 未声明的属性落到 textarea（主元素）上，外壳用 propsRoot。部件：Root（外壳）、Textarea。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { nextTick } from 'vue';
import { useFieldControl } from '../form/Field';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import {
  controlStyles,
  controlSx,
  useControlAppearance,
  type ControlOptions,
} from './control-styles';

/** 值与状态由组件管理 */
type Managed =
  'value' | 'rows' | 'disabled' | 'readonly' | 'required' | 'aria-invalid' | 'aria-describedby';

/** 未声明的属性落到 textarea（主元素）上；外壳用 propsRoot */
export interface TextareaProps extends PartProps<'textarea', Managed>, ControlOptions {
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
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
}

const styles = stylex.create({
  textarea: { resize: 'none', overflowY: 'auto' },
  fixed: { resize: 'vertical' },
});

// 行数是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
const rowStyles = stylex.create({
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
    disabled,
    readonly,
    required,
    invalid,
    id,
    propsRoot,
    ...rest
  }: TextareaProps) => {
    const appearance = useControlAppearance(() => ({ variant, size }));
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
      return (
        <div
          {...elementProps(
            mergeProps<'div'>({ sx: controlSx(appearance(), state, true) }, propsRoot),
          )}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          <textarea
            {...elementProps(
              mergeProps<'textarea'>(
                {
                  sx: [
                    controlStyles.input,
                    styles.textarea,
                    fixed && styles.fixed,
                    rowStyles.min(rows),
                    maxRows != null && !fixed && rowStyles.max(maxRows),
                  ],
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
                  'aria-describedby': state.describedBy,
                },
              ),
            )}
            value={_bind(value)}
          />
        </div>
      );
    };
  },
);

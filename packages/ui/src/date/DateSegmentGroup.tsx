/**
 * 一组日期分段（年 / 月 / 日、时 : 分）：每段是 role="spinbutton" 的可编辑元素，分隔符对读屏隐藏。
 * 状态由调用方的 useDateSegments 给；DateField、TimeField 放在输入框外壳里用，DateRangePicker 在一个外壳里放两组。
 *
 * - 每段 contenteditable 加 inputmode="numeric"：手机上弹出数字键盘，输入法打的全角数字也收得到；
 *   文字由组件渲染，beforeinput 一律拦下交给 useDateSegments（输入法组合结束后重新渲染这一段）；
 * - 每段在 Tab 顺序里（同 React Aria），←→ 也能换段；输入满了自动跳到下一段，焦点跟过去；
 * - 读屏名称是“字段名 + 段名”（aria-labelledby 指向外部标签与这一段），没填的段取值念“未填写”。
 *
 * 部件：Root（div role="group"，主元素）、Segment（每段）、Literal（分隔符）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { nextTick, useId } from 'vue';
import { isRtl } from '../utils/dom/direction';
import { labelledByField } from '../form/Field';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  handleSegmentKeydown,
  type DateSegment,
  type DateSegmentsState,
  type DateSegmentType,
} from './date-segments';
import { useLang } from '../config/context';

/** 角色与状态由组件管理 */
export type DateSegmentGroupManaged = 'role';

/** 每段由组件管理的属性 */
export type DateSegmentManaged =
  | 'role'
  | 'id'
  | 'aria-label'
  | 'aria-labelledby'
  | 'tabindex'
  | 'contenteditable'
  | 'inputmode'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuetext'
  | 'aria-required'
  | 'aria-invalid'
  | 'aria-readonly'
  | 'aria-disabled';

/** 未声明的属性落到这一组（role="group"）上 */
export interface DateSegmentGroupProps extends PartProps<'div', DateSegmentGroupManaged> {
  /** 分段状态（useDateSegments） */
  segments: DateSegmentsState;
  /** 不可用：段不能聚焦 */
  disabled?: boolean;
  /** 只读：能聚焦、不能改 */
  readonly?: boolean;
  /** 必填（每段 aria-required） */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 外部标签的 id：每段的读屏名称是“标签 + 段名” */
  labelledBy?: string;
  /** 说明与错误的 id（aria-describedby），给每一段 */
  describedBy?: string;
  /** 每段的部件属性：固定的对象，或按这一段返回 */
  propsSegment?:
    | PartProps<'span', DateSegmentManaged>
    | ((segment: DateSegment) => PartProps<'span', DateSegmentManaged>);
  /** 分隔符的部件属性 */
  propsLiteral?: PartProps<'span', 'aria-hidden'>;
}

/** DateSegmentGroup 的样式：root、segment、placeholder、literal */
export const dateSegmentStyles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    paddingBlock: '_xs',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  segment: {
    boxSizing: 'content-box',
    paddingInline: '0.1em',
    borderRadius: '_xs',
    // 光标与选区由组件画（整段高亮），不显示浏览器的插入符
    caretColor: 'transparent',
    outlineStyle: 'none',
    textAlign: 'end',
    backgroundColor: { default: 'transparent', ':focus': '_accent' },
    color: { default: 'inherit', ':focus': '_accentContrast' },
    cursor: 'text',
  },
  // 占位文字是真正的文字（不是原生 placeholder），要满足 4.5:1：用 textMuted
  placeholder: { color: { default: '_textMuted', ':focus': '_accentContrast' } },
  literal: { color: '_textMuted', whiteSpace: 'pre' },
  disabled: { cursor: 'not-allowed' },
});

/** 一组日期分段 */
export const DateSegmentGroup = _component(
  ({
    segments,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    labelledBy,
    describedBy,
    propsSegment,
    propsLiteral,
    ...rest
  }: DateSegmentGroupProps) => {
    const lang = useLang();
    const id = useId();
    const elements = new Map<DateSegmentType, HTMLElement>();
    let root = _state.raw<HTMLElement | null>(null);
    // 输入法组合会直接改掉段里的文字（beforeinput 拦不住）：结束后换个 key 重新渲染这一段
    let composed = _state(0);

    // 输入满了跳段、Backspace 删空退回上一段：焦点跟着 focusedSegment 走（只在焦点本来就在这组里时）
    _effect(() => {
      const type = segments.focusedSegment;
      const target = type && elements.get(type);
      if (!target || !root?.contains(document.activeElement) || document.activeElement === target)
        return;
      target.focus();
    });

    const editable = () => !disabled && !readonly;

    function onBeforeinput(event: InputEvent) {
      // 输入法组合中的文字取消不了，等 compositionend
      if (event.inputType === 'insertCompositionText') return;
      event.preventDefault();
      if (!editable()) return;
      if (event.inputType.startsWith('delete')) segments.backspace();
      else if (event.data) segments.type(event.data);
    }

    function onCompositionend(event: CompositionEvent) {
      const focused = segments.focusedSegment;
      if (editable() && event.data) segments.type(event.data);
      composed += 1;
      // 重新渲染后元素换了：焦点留在原来那段（或已经跳到的下一段）
      void nextTick(() => elements.get(segments.focusedSegment ?? focused!)?.focus());
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault();
        return;
      }
      if (!root || disabled) return;
      // 只读时只能换段
      if (readonly && !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      if (handleSegmentKeydown(segments, event, isRtl(root))) event.preventDefault();
    }

    function onFocusout(event: FocusEvent) {
      if (!root?.contains(event.relatedTarget as Node | null)) segments.setFocused(null);
    }

    return () => {
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: dateSegmentStyles.root,
              'aria-labelledby': labelledByField(rest, labelledBy),
              'aria-describedby': describedBy,
            },
            rest,
            // 整组标为不可用：标签（for 指向这一组）随之按不可用处理，不只是各段
            {
              ref: _toRef(root),
              role: 'group',
              'aria-disabled': disabled || undefined,
              onFocusout,
            },
          )}
          data-invalid={invalid || undefined}
          data-disabled={disabled || undefined}
        >
          {segments.segments.map((segment, index) => {
            if (segment.type === 'literal') {
              return (
                <span
                  key={`literal-${index}`}
                  {...mergeAttrs<'span'>({ sx: dateSegmentStyles.literal }, propsLiteral)}
                  aria-hidden="true"
                >
                  {segment.text}
                </span>
              );
            }
            const type = segment.type;
            const segmentId = `${id}-${type}`;
            const own = typeof propsSegment === 'function' ? propsSegment(segment) : propsSegment;
            return (
              <span
                key={`${type}-${composed}`}
                {...mergeAttrs<'span'>(
                  {
                    sx: [
                      dateSegmentStyles.segment,
                      segment.placeholder && dateSegmentStyles.placeholder,
                      disabled && dateSegmentStyles.disabled,
                    ],
                    'aria-describedby': describedBy,
                    spellcheck: false,
                    autocapitalize: 'off',
                    autocorrect: 'off',
                    enterkeyhint: 'next',
                  },
                  own,
                  {
                    // 每段的名称各不相同（年、月、日），由组件管理
                    id: segmentId,
                    'aria-label': segment.label,
                    'aria-labelledby': labelledBy ? `${labelledBy} ${segmentId}` : undefined,
                    ref: (element: unknown) => {
                      if (element instanceof HTMLElement) elements.set(type, element);
                    },
                    role: 'spinbutton',
                    tabindex: disabled ? -1 : 0,
                    contenteditable: editable() ? 'true' : undefined,
                    inputmode: type === 'dayPeriod' ? 'text' : 'numeric',
                    'aria-valuenow': segment.value ?? undefined,
                    'aria-valuemin': segment.min,
                    'aria-valuemax': segment.max,
                    'aria-valuetext': segment.placeholder ? lang.dateFieldEmpty : segment.text,
                    'aria-required': required || undefined,
                    'aria-invalid': invalid || undefined,
                    'aria-readonly': readonly || undefined,
                    'aria-disabled': disabled || undefined,
                    onFocus: () => segments.setFocused(type),
                    onBeforeinput,
                    onCompositionend,
                    onKeydown,
                    // 粘贴的文字不进段里（会打乱渲染）；需要时用输入
                    onPaste: (event: ClipboardEvent) => event.preventDefault(),
                  },
                )}
                data-type={type}
                data-placeholder={segment.placeholder || undefined}
              >
                {segment.text}
              </span>
            );
          })}
        </div>
      );
    };
  },
);

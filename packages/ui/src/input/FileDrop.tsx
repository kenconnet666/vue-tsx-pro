/**
 * 选择文件的区域（label > input[type=file]）：点击（或聚焦后按 Enter / 空格）打开文件对话框，也可以把文件拖进来。
 * 只负责选文件：选到的文件经 onFiles 交出去，不在 accept 里的经 onReject 交出去（拖放不受 accept 限制，这里补上）。
 * 列表、进度、重试见 Upload（建在它上面）。
 *
 *   <FileDrop accept="image/*" multiple onFiles={(files) => add(files)} />
 *
 * 原生 input 只是视觉上隐藏，焦点、键盘、读屏都是浏览器的；区域的文字是它的名称。拖着文件经过时写 data-dragging。
 * 在 Field 里时关联标签、说明与错误。部件：Root（label）、Input（input）、Icon、Hint（提示文字）、Description（说明）。
 */
import { Upload as UploadIcon } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { useFieldControl } from '../form/Field';
import { t } from '../config/theme/tokens';

/** 文件是否符合 accept（`image/*`、`.pdf`、`application/json` 这样的逗号分隔列表）；accept 为空时都符合 */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  const rules = (accept ?? '')
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** 文件、不可用、必填由组件管理；未声明的属性落到 input 上，外层 label 用 propsRoot */
export interface FileDropProps extends PartProps<
  'input',
  'type' | 'disabled' | 'required' | 'aria-invalid' | 'aria-describedby'
> {
  /** 接受的文件类型（同原生 accept） */
  accept?: string;
  /** 可以选多个 */
  multiple?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 必填 */
  required?: boolean;
  /** 只读：不能选文件（同不可用，文件输入框没有原生的只读） */
  readonly?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 选到了文件（已按 accept 过滤） */
  onFiles?: (files: File[]) => void;
  /** 拖进来的文件里不在 accept 里的 */
  onReject?: (files: File[]) => void;
  /** 提示文字下面的说明（大小、类型限制） */
  description?: VNodeChild;
  /** 外层 label 的部件属性 */
  propsRoot?: PartProps<'label'>;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 提示文字的部件属性 */
  propsHint?: PartProps<'span'>;
  /** 提示文字下面的说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 区域里的内容；默认是图标、提示文字（取语言包）与 description */
  children?: VNodeChild;
}

/** FileDrop 的样式：root、dragging、disabled、invalid、icon、hint、description */
export const fileDropStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_xs',
    width: '_full',
    minHeight: '8em',
    padding: '_lg',
    borderWidth: '_sm',
    borderStyle: 'dashed',
    borderColor: { default: '_borderStrong', ':hover': '_accent' },
    borderRadius: '_md',
    backgroundColor: '_surface',
    color: '_text',
    textAlign: 'center',
    cursor: 'pointer',
    transition: `border-color ${t.durations.sm} ${t.easings.standard}, background-color ${t.durations.sm} ${t.easings.standard}`,
  },
  dragging: { borderColor: '_accent', backgroundColor: '_accentSoft' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  invalid: { borderColor: '_danger' },
  icon: { width: '1.5em', height: '1.5em', color: '_textMuted' },
  hint: { fontWeight: '_medium' },
  description: { fontSize: '_sm', color: '_textMuted' },
});

/** 选择文件的区域：点击打开文件对话框，或把文件拖进来 */
export const FileDrop = _component(
  ({
    accept,
    multiple = false,
    disabled,
    required,
    readonly,
    invalid,
    onFiles,
    onReject,
    description,
    id,
    propsRoot,
    propsIcon,
    propsHint,
    propsDescription,
    children,
    ...rest
  }: FileDropProps) => {
    const lang = useLang();
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const locked = () => control().disabled || control().readonly;
    let dragging = _state(false);
    // dragenter / dragleave 在子元素之间也会触发：计数，回到 0 才算离开
    let depth = 0;

    function deliver(list: FileList | null | undefined) {
      const files = [...(list ?? [])];
      const accepted = files.filter((file) => matchesAccept(file, accept));
      const rejected = files.filter((file) => !accepted.includes(file));
      const taken = multiple ? accepted : accepted.slice(0, 1);
      if (taken.length > 0) onFiles?.(taken);
      if (rejected.length > 0) onReject?.(rejected);
    }

    function onChange(event: Event) {
      const input = event.target as HTMLInputElement;
      deliver(input.files);
      // 清空：再选同一个文件也会触发 change
      input.value = '';
    }

    const accepting = (event: DragEvent) =>
      !locked() && (event.dataTransfer?.types.includes('Files') ?? false);

    const dragHandlers = {
      onDragenter: (event: DragEvent) => {
        if (!accepting(event)) return;
        event.preventDefault();
        depth++;
        dragging = true;
      },
      onDragover: (event: DragEvent) => {
        if (!accepting(event)) return;
        // 不阻止默认行为就不会触发 drop
        event.preventDefault();
        event.dataTransfer!.dropEffect = 'copy';
      },
      onDragleave: () => {
        depth = Math.max(0, depth - 1);
        if (depth === 0) dragging = false;
      },
      onDrop: (event: DragEvent) => {
        if (!accepting(event)) return;
        event.preventDefault();
        depth = 0;
        dragging = false;
        deliver(event.dataTransfer?.files);
      },
    };

    return () => {
      const field = control();
      return (
        <label
          {...mergeAttrs<'label'>(
            {
              sx: [
                fileDropStyles.root,
                // 原生 input 视觉上隐藏，焦点环画在整个区域上
                focusRingStyles.hasVisible,
                dragging && fileDropStyles.dragging,
                field.invalid && fileDropStyles.invalid,
                (field.disabled || field.readonly) && fileDropStyles.disabled,
              ],
            },
            propsRoot,
            dragHandlers,
          )}
          data-dragging={dragging || undefined}
          data-disabled={field.disabled || undefined}
          data-readonly={field.readonly || undefined}
        >
          <input
            {...mergeAttrs<'input'>({ sx: visuallyHiddenStyles.hidden }, rest, {
              type: 'file',
              id: field.id,
              accept,
              multiple,
              disabled: field.disabled || field.readonly,
              required: field.required,
              'aria-invalid': field.invalid || undefined,
              'aria-describedby': field.describedBy,
              onChange,
            })}
          />
          {children ?? (
            <>
              <Icon
                {...mergePartProps<IconProps>(
                  { icon: UploadIcon, sx: fileDropStyles.icon },
                  propsIcon,
                )}
              />
              <span {...mergeAttrs<'span'>({ sx: fileDropStyles.hint }, propsHint)}>
                {lang.fileDrop}
              </span>
              {hasContent(description) && (
                <span {...mergeAttrs<'span'>({ sx: fileDropStyles.description }, propsDescription)}>
                  {description}
                </span>
              )}
            </>
          )}
        </label>
      );
    };
  },
);

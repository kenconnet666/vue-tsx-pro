/**
 * 人员与组织选择器（表单字段）：触发框里是已选的标签，点开对话框里的 PeoplePickerPanel 挑选，按“确定”才写回，“取消”放弃这次的改动。
 *
 *   <Field label="抄送"><PeoplePicker source={source} _value={cc} types={['user', 'department']} recentKey="cc" /></Field>
 *   <PeoplePicker source={source} _value={owner} max={1} placeholder="选择经办人" />      只选一个：值仍是数组，最多一项
 *
 * 触发框同 Select 的外壳：多选时已选的标签排在触发按钮前面（可移除），按钮里只留给读屏的文字；一个时直接显示名字。
 * 键盘：触发按钮上 Enter / 空格 / ↓ 打开，Backspace 移除最后一个；对话框里的键盘见 PeoplePickerPanel。
 * 部件：Root（外壳）、Tags、Trigger（button，主元素）、Value、Dialog、Panel。
 */
import { UsersRound } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { buttonBaseStyles } from '../base/button-core';
import { Icon } from '../base/Icon';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFieldControl } from '../form/Field';
import { Dialog, type DialogProps } from '../overlay/Dialog';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  clickOnShell,
  controlParts,
  focusOnShell,
  useControlAppearance,
  type ControlOptions,
} from './control';
import { peopleKey, type PeopleEntry, type PeopleSource, type PeopleType } from './people';
import { PeoplePickerPanel, type PeoplePickerPanelProps } from './PeoplePickerPanel';
import { selectStyles, type SelectManaged } from './Select';
import { SelectedTags, type SelectedTagsProps } from './SelectedTags';

/** 未声明的属性落到触发按钮（主元素）上，外壳用 propsRoot */
export interface PeoplePickerProps extends PartProps<'button', SelectManaged>, ControlOptions {
  /** 数据来源 */
  source: PeopleSource;
  /** 选中的：父级写 _value={list} 双向绑定 */
  _value?: readonly PeopleEntry[];
  /** 能选哪几种，默认只有人员 */
  types?: readonly PeopleType[];
  /** 最多选几个；1 时只选一个 */
  max?: number;
  /** 记“最近选过的”用的键（存在浏览器里） */
  recentKey?: string;
  /** 没有选时的占位，也是对话框的标题；默认“选择人员” */
  placeholder?: string;
  /** 多选时最多显示几个标签，其余收进“+N”；'responsive' 时排成一行按宽度放 */
  maxTagCount?: number | 'responsive';
  /** 不可用；也可由 Field 提供 */
  disabled?: boolean;
  /** 只读：不能打开、不能移除；也可由 Field 提供 */
  readonly?: boolean;
  /** 必填；也可由 Field 提供 */
  required?: boolean;
  /** 校验未通过；也可由 Field 提供 */
  invalid?: boolean;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 标签那一排的部件属性 */
  propsTags?: Partial<SelectedTagsProps>;
  /** 对话框的部件属性 */
  propsDialog?: Partial<DialogProps>;
  /** 面板的部件属性 */
  propsPanel?: Partial<PeoplePickerPanelProps>;
}

/** 人员与组织选择器 */
export const PeoplePicker = _component(
  ({
    source,
    _value: value = _bindable<readonly PeopleEntry[]>([]),
    types,
    max,
    recentKey,
    placeholder,
    maxTagCount,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    id,
    propsRoot,
    propsTags,
    propsDialog,
    propsPanel,
    ...rest
  }: PeoplePickerProps) => {
    const lang = useLang();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let open = _state(false);
    // 对话框里改的是草稿：确定才写回
    let draft = _state<readonly PeopleEntry[]>([]);
    let trigger = _state.raw<HTMLElement | null>(null);

    const locked = () => control().disabled || control().readonly;

    function show() {
      if (locked()) return;
      draft = [...value];
      open = true;
    }

    function remove(key: string) {
      value = value.filter((entry) => peopleKey(entry) !== key);
    }

    function onKeydown(event: KeyboardEvent) {
      if (locked()) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        show();
      } else if (event.key === 'Backspace' && value.length > 0) {
        event.preventDefault();
        value = value.slice(0, -1);
      }
    }

    return () => {
      const state = control();
      const s = controlParts(appearance(), state);
      const title = placeholder ?? lang.peoplePlaceholder;
      const tagged = max !== 1 && value.length > 0;
      const shown =
        value.length === 0 ? (
          <span {...css.attrs(selectStyles.placeholder)}>{title}</span>
        ) : tagged ? (
          <span {...css.attrs(visuallyHiddenStyles.hidden)}>
            {lang.selectSummary(value.map((entry) => entry.name))}
          </span>
        ) : (
          value[0]!.name
        );
      return (
        <>
          <div
            {...mergeAttrs<'div'>({ ...s.root, sx: [s.root.sx, selectStyles.root] }, propsRoot, {
              onPointerdown: state.disabled ? undefined : focusOnShell(() => trigger),
              onClick: locked() ? undefined : clickOnShell(() => trigger, show),
            })}
            data-invalid={state.invalid || undefined}
            data-disabled={state.disabled || undefined}
          >
            {tagged && (
              <SelectedTags
                {...mergePartProps<SelectedTagsProps>(
                  {
                    tags: value.map((entry) => ({ value: peopleKey(entry), label: entry.name })),
                    maxTagCount,
                    onRemove: locked() ? undefined : remove,
                  },
                  propsTags,
                )}
              />
            )}
            <button
              {...mergeAttrs<'button'>(
                {
                  sx: [
                    buttonBaseStyles.root,
                    selectStyles.trigger,
                    tagged && selectStyles.triggerBehindTags,
                  ],
                },
                rest,
                {
                  ref: (element: unknown) => (trigger = element as HTMLElement | null),
                  id: state.id,
                  type: 'button',
                  disabled: state.disabled,
                  'aria-haspopup': 'dialog',
                  'aria-expanded': open,
                  'aria-invalid': state.invalid || undefined,
                  'aria-required': state.required || undefined,
                  'aria-readonly': state.readonly || undefined,
                  'aria-describedby': state.describedBy,
                  onClick: () => {
                    trigger?.focus();
                    show();
                  },
                  onKeydown,
                },
              )}
            >
              <span {...css.attrs(selectStyles.value)}>{shown}</span>
            </button>
            <Icon {...s.icon} icon={UsersRound} />
          </div>
          <Dialog
            {...mergePartProps<DialogProps>(
              {
                size: 'lg',
                title,
                onConfirm: () => {
                  value = draft;
                },
              },
              propsDialog,
            )}
            _open={open}
          >
            <PeoplePickerPanel
              {...mergePartProps<PeoplePickerPanelProps>(
                // 打开对话框时焦点在搜索框里，直接就能输入
                { source, types, max, recentKey, propsSearch: { autofocus: true } },
                propsPanel,
              )}
              _value={draft}
            />
          </Dialog>
        </>
      );
    };
  },
);

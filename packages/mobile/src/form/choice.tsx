/**
 * 复选框与单选框共用的外观：前面一个圆（或方）框，选中时填上主色、画对勾，后面是文字。
 * Checkbox、Radio 只在角色、状态与分组的逻辑上不同（内部模块，不从包导出）。
 */
import { Check, Minus } from '@lucide/icons';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 选框的形状 */
export interface ChoiceShapes {
  /** 圆（默认） */
  round: unknown;
  /** 圆角方块 */
  square: unknown;
}

/** 选项的排列 */
export interface ChoiceDirections {
  /** 竖着一行一个（默认） */
  vertical: unknown;
  /** 横着排，放不下时换行 */
  horizontal: unknown;
}

/** 选框、分组的样式：root、box、square、checked、label、group、horizontal */
export const choiceStyles = css.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_text', '[data-disabled]': '_textDisabled' },
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: '1.5',
    textAlign: 'start',
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
    userSelect: 'none',
  },
  box: {
    boxSizing: 'border-box',
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.3em',
    height: '1.3em',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderStrong',
    borderRadius: '_full',
    backgroundColor: { default: '_surface', '[data-disabled]': '_fill' },
    color: '_accentContrast',
    fontSize: '1em',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '_sm',
  },
  square: { borderRadius: '_sm' },
  checked: {
    borderColor: { default: '_accent', '[data-disabled]': '_borderStrong' },
    backgroundColor: { default: '_accent', '[data-disabled]': '_fillActive' },
  },
  label: { overflowWrap: 'anywhere' },
  group: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '_sm' },
  horizontal: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: '_lg' },
});

/** 一个选框的状态 */
export interface ChoiceState {
  role: 'checkbox' | 'radio';
  checked: boolean;
  /** 半选（复选框的全选在部分选中时） */
  indeterminate?: boolean;
  disabled: boolean;
  shape: keyof ChoiceShapes;
  onToggle: () => void;
}

/** 画一个选框：button[role] > 框 + 文字 */
export function renderChoice(
  state: ChoiceState,
  attrs: Record<string, unknown> | undefined,
  label: VNodeChild,
  parts: { propsBox?: PartProps<'span'>; propsLabel?: PartProps<'span'> },
) {
  const marked = state.checked || state.indeterminate;
  return (
    <button
      {...mergeAttrs<'button'>({ sx: choiceStyles.root }, attrs, {
        type: 'button',
        role: state.role,
        'aria-checked': state.indeterminate ? 'mixed' : state.checked ? 'true' : 'false',
        disabled: state.disabled,
        onClick: state.onToggle,
        ...dataAttrs({ 'data-disabled': state.disabled, 'data-checked': marked }),
      })}
    >
      <span
        {...mergeAttrs<'span'>(
          {
            sx: [
              choiceStyles.box,
              state.shape === 'square' && choiceStyles.square,
              marked && choiceStyles.checked,
            ],
          },
          parts.propsBox,
          dataAttrs({ 'data-disabled': state.disabled }),
        )}
      >
        {marked && <Icon icon={state.indeterminate ? Minus : Check} strokeWidth={3} />}
      </span>
      {hasContent(label) && (
        <span {...mergeAttrs<'span'>({ sx: choiceStyles.label }, parts.propsLabel)}>{label}</span>
      )}
    </button>
  );
}

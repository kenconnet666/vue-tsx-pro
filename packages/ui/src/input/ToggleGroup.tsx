/**
 * 切换按钮组，复合组件：ToggleGroup（role="group"）> ToggleItem（带 aria-pressed 的 button）。
 * 单选像分段控件（视图切换、对齐方式），多选像格式按钮（加粗、斜体）。整组一个 Tab 位置，组内方向键移动（漫游焦点）。
 * 参考 Radix ToggleGroup、Ark UI SegmentGroup。
 *
 *   <ToggleGroup value={_bind(view)} aria-label="视图" required>
 *     <ToggleItem value="list" icon={List} aria-label="列表" />
 *     <ToggleItem value="grid" icon={LayoutGrid} aria-label="网格" />
 *   </ToggleGroup>
 *   <ToggleGroup type="multiple" value={_bind(marks)} aria-label="格式">…</ToggleGroup>
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import {
  buttonContent,
  buttonSx,
  useButtonAppearance,
  type ButtonOptions,
} from '../base/button-core';
import type { IconData, IconProps } from '../base/Icon';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { useRipple } from '../utils/dom/ripple';
import { rovingFocus } from '../utils/dom/roving-focus';
import { toggleSelection, type SelectionModes } from '../utils/data/selection';
import { useFieldControl } from './Field';
import type { TextSize } from '../utils/style/typography';
import type { StyleTable } from '../utils/style/styles';

/** ToggleGroup 交给组内 ToggleGroupItem 的状态 */
export interface ToggleGroupState {
  /** 按下（选中）的项的值 */
  readonly selected: readonly string[];
  /** 字号档位；不写时继承 */
  readonly size: TextSize | undefined;
  /** 整组不可用 */
  readonly disabled: boolean;
  /** 波纹；不写时沿用配置 */
  readonly ripple: boolean | undefined;
  /** 切换一项（单选、多选的规则由组决定） */
  toggle(value: string): void;
}

/** ToggleGroup 的上下文：自定义的项可以 inject 它接入组 */
export const ToggleGroupContext = createContext<ToggleGroupState>('ToggleGroup');

/** 方向 */
export interface ToggleGroupOrientations {
  /** 横排（默认），左右键移动 */
  horizontal: unknown;
  /** 竖排，上下键移动 */
  vertical: unknown;
}

/** 角色由组件管理（role="group" 不允许 aria-orientation，方向只写在 data-orientation 上） */
export type ToggleGroupManaged = 'role';

/** 两种选择方式共有的选项；未声明的属性落到 role="group" 的 div 上，aria-label 是这组的名称 */
interface ToggleGroupBaseProps extends PartProps<'div', ToggleGroupManaged> {
  /** 至少保留一项选中（分段控件通常要求） */
  required?: boolean;
  /** 整组不可用 */
  disabled?: boolean;
  /** 方向，默认 horizontal */
  orientation?: keyof ToggleGroupOrientations;
  /** 字号档位，按钮随之缩放 */
  size?: TextSize;
  /** 按下时的波纹；不写时沿用全局配置 */
  ripple?: boolean;
  children?: VNodeChild;
}

/** 单选：value 是选中项的值，没有选中时为 undefined */
interface SingleProps extends ToggleGroupBaseProps {
  /** 选择方式，默认 single */
  type?: Extract<keyof SelectionModes, 'single'>;
  /** 选中项：父级写 value={_bind(x)} */
  value?: string;
}

/** 多选：value 是选中项的值的数组 */
interface MultipleProps extends ToggleGroupBaseProps {
  /** 选择方式 */
  type: Extract<keyof SelectionModes, 'multiple'>;
  /** 选中项：父级写 value={_bind(list)} */
  value?: string[];
}

/** 单选或多选 */
export type ToggleGroupProps = SingleProps | MultipleProps;

/** ToggleGroup 的样式：root、vertical */
export const toggleGroupStyles: StyleTable<'root' | 'vertical'> = stylex.create({
  root: {
    display: 'inline-flex',
    gap: '_xs',
    padding: '_xs',
    borderRadius: '_md',
    backgroundColor: '_fill',
  },
  vertical: { flexDirection: 'column' },
});

/** 切换按钮组：单选或多选，整组一个 Tab 位置 */
export const ToggleGroup = _component(
  ({
    type = 'single',
    value = _bindable<string | string[] | undefined>(undefined),
    required = false,
    disabled,
    orientation = 'horizontal',
    size,
    ripple,
    children,
    id,
    ...rest
  }: ToggleGroupProps) => {
    // 在 Field 里时：标签作为组的名称、关联说明与错误、沿用不可用
    const control = useFieldControl(() => ({ id, disabled }));
    let root = _state.raw<HTMLElement | null>(null);
    _effect(() =>
      root ? rovingFocus(root, { items: 'button', orientation, loop: true }) : undefined,
    );
    const selected = _derived<readonly string[]>(
      Array.isArray(value) ? value : value != null ? [value] : [],
    );

    ToggleGroupContext.provide({
      get selected() {
        return selected;
      },
      get size() {
        return size;
      },
      get disabled() {
        return control().disabled;
      },
      get ripple() {
        return ripple;
      },
      toggle(item) {
        const next = toggleSelection(selected, item, { mode: type, required });
        if (next === selected) return;
        value = type === 'multiple' ? [...next] : next[0];
      },
    });

    return () => {
      const field = control();
      return (
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  toggleGroupStyles.root,
                  orientation === 'vertical' && toggleGroupStyles.vertical,
                ],
              },
              rest,
              {
                ref: _toRef(root),
                id: field.id,
                role: 'group',
                'aria-labelledby':
                  rest['aria-labelledby'] ??
                  (rest['aria-label'] == null ? field.labelledBy : undefined),
                'aria-describedby': field.describedBy,
              },
            ),
          )}
          data-orientation={orientation}
          data-disabled={field.disabled || undefined}
        >
          {children}
        </div>
      );
    };
  },
);

/** 选中、不可用由组件管理 */
export type ToggleGroupItemManaged = 'aria-pressed' | 'disabled' | 'type';

/** 未声明的属性落到 button 上；只有图标时写 aria-label */
export interface ToggleItemProps
  extends PartProps<'button', ToggleGroupItemManaged>, Pick<ButtonOptions, 'radius'> {
  /** 这一项的值 */
  value: string;
  /** 图标 */
  icon?: IconData;
  /** 不可用 */
  disabled?: boolean;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 内容层的部件属性 */
  propsContent?: PartProps<'span'>;
  children?: VNodeChild;
}

/** 切换按钮组里的一项（button，aria-pressed 表示是否选中） */
export const ToggleItem = _component(
  ({
    value,
    icon,
    disabled = false,
    radius,
    propsIcon,
    propsContent,
    children,
    ...rest
  }: ToggleItemProps) => {
    const group = ToggleGroupContext.inject();
    const rippleHandlers = useRipple(() => group.ripple);
    // 选中的是浅色底，其余是幽灵按钮；尺寸跟随组
    const appearance = useButtonAppearance(
      () => ({ variant: undefined, tone: 'neutral', size: group.size, radius: radius ?? 'sm' }),
      'ghost',
    );

    return () => {
      const pressed = group.selected.includes(value);
      const off = disabled || group.disabled;
      const base = appearance();
      return (
        <button
          {...elementProps(
            mergeProps<'button'>(
              {
                sx: buttonSx(
                  {
                    ...base,
                    variant: pressed ? 'surface' : 'ghost',
                    tone: pressed ? 'accent' : 'neutral',
                  },
                  { disabled: off, square: children == null },
                ),
              },
              rest,
              {
                type: 'button',
                'aria-pressed': pressed,
                disabled: off,
                // 使用方的 onClick 先执行，preventDefault 可以拦下切换（mergeProps 的规则）
                onClick: () => group.toggle(value),
                ...rippleHandlers,
              },
            ),
          )}
          data-state={pressed ? 'on' : 'off'}
          data-disabled={off || undefined}
        >
          {buttonContent({ icon, propsIcon, propsContent, children }, { loading: false })}
        </button>
      );
    };
  },
);

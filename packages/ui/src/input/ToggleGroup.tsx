/**
 * 切换按钮组，复合组件：ToggleGroup（role="group"）> ToggleItem（带 aria-pressed 的 button）。
 * 单选像分段控件（视图切换、对齐方式），多选像格式按钮（加粗、斜体）。整组一个 Tab 位置，组内方向键移动（漫游焦点）。
 * 参考 Radix ToggleGroup、Ark UI SegmentGroup。
 *
 *   <ToggleGroup value={_bind(view)} aria-label="视图" required>
 *     <ToggleItem value="list" icon={List} aria-label="列表" />
 *     <ToggleItem value="grid" icon={LayoutGrid} aria-label="网格" />
 *   </ToggleGroup>
 *   <ToggleGroup selectionMode="multiple" value={_bind(marks)} aria-label="格式">…</ToggleGroup>
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import {
  buttonContent,
  buttonSx,
  useButtonAppearance,
  useButtonBehavior,
  type ButtonOptions,
} from '../base/button-core';
import type { IconData, IconProps } from '../base/Icon';
import { useActiveIndicator } from '../utils/motion/active-indicator';
import { defaultLabelledBy, mergeAttrs, type PartProps } from '../utils/props';
import { rovingFocus } from '../utils/dom/roving-focus';
import { ToolbarContext } from '../navigation/Toolbar';
import { selectedValues, toggleSelection, type SelectionProps } from '../utils/data/selection';
import { useFieldControl } from '../form/Field';
import type { TextSize } from '../utils/style/typography';

/** ToggleGroup 交给组内 ToggleGroupItem 的状态 */
export interface ToggleGroupState {
  /** 按下（选中）的项的值 */
  readonly selected: readonly string[];
  /** 字号档位；不写时继承 */
  readonly size: TextSize | undefined;
  /** 整组不可用 */
  readonly disabled: boolean;
  /** 整组只读：按钮照常显示与聚焦，点了不切换 */
  readonly readonly: boolean;
  /** 波纹；不写时沿用配置 */
  readonly ripple: boolean | undefined;
  /** 单选：选中底色由组里的滑块（Indicator）画，项本身不画底色 */
  readonly sliding: boolean;
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
  /** 必须有选中项：最后一项不能取消（分段控件通常要求）；在必填的 Field 里默认开启 */
  required?: boolean;
  /** 整组不可用 */
  disabled?: boolean;
  /** 整组只读：选中项照常显示、按钮能聚焦，点了不切换（查看详情、审批时） */
  readonly?: boolean;
  /** 方向，默认 horizontal */
  orientation?: keyof ToggleGroupOrientations;
  /** 字号档位，按钮随之缩放 */
  size?: TextSize;
  /** 按下时的波纹；不写时沿用全局配置 */
  ripple?: boolean;
  /** 单选时选中项下面的滑块（切换时滑过去）的部件属性 */
  propsIndicator?: PartProps<'span'>;
  children?: VNodeChild;
}

/** 单选或多选 */
export type ToggleGroupProps = ToggleGroupBaseProps & SelectionProps;

/** ToggleGroup 的样式：root、vertical、indicator */
export const toggleGroupStyles = stylex.create({
  root: {
    // 滑块按项的 offsetLeft / offsetTop 定位；isolation 让 zIndex: -1 的滑块压在项下、组的底色之上
    position: 'relative',
    isolation: 'isolate',
    display: 'inline-flex',
    // 放在竖排的弹性容器里（Field 的控件列）时不被拉满整行
    width: 'fit-content',
    gap: '_xs',
    padding: '_xs',
    borderRadius: '_md',
    backgroundColor: '_fill',
  },
  vertical: { flexDirection: 'column' },
  // 只读、没选中的项：不像能点（悬停也不出底色）
  readonlyItem: { cursor: 'default', backgroundColor: 'transparent' },
  // 同按钮的 surface 外观；位置与宽高由脚本写（useActiveIndicator）
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
    boxSizing: 'border-box',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_accentBorder',
    borderRadius: '_sm',
    backgroundColor: '_accentSoft',
    pointerEvents: 'none',
  },
});

/** 切换按钮组：单选或多选，整组一个 Tab 位置 */
export const ToggleGroup = _component(
  ({
    selectionMode = 'single',
    value = _bindable<string | string[] | null>(null),
    required,
    disabled,
    readonly,
    orientation = 'horizontal',
    size,
    ripple,
    propsIndicator,
    children,
    id,
    ...rest
  }: ToggleGroupProps) => {
    // 在 Field 里时：标签作为组的名称、关联说明与错误、沿用不可用与只读
    const control = useFieldControl(() => ({ id, disabled, readonly, required }));
    let root = _state.raw<HTMLElement | null>(null);
    // 在工具栏里时焦点交给工具栏：整栏一个 Tab 位置，方向键跨过组内外的按钮（WAI-ARIA Toolbar 模式）
    const inToolbar = ToolbarContext.inject(null) != null;
    _effect(() =>
      root && !inToolbar
        ? rovingFocus(root, { items: 'button', orientation, loop: true })
        : undefined,
    );
    const selected = _derived(selectedValues(value));
    let indicator = _state.raw<HTMLElement | null>(null);
    useActiveIndicator(() => ({
      container: root,
      indicator,
      active: '[aria-pressed="true"]',
      axis: 'both',
      value: selected[0],
    }));

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
      get readonly() {
        return control().readonly;
      },
      get ripple() {
        return ripple;
      },
      get sliding() {
        return selectionMode === 'single';
      },
      toggle(item) {
        if (control().readonly) return;
        const next = toggleSelection(selected, item, {
          mode: selectionMode,
          required: control().required,
        });
        if (next === selected) return;
        value = selectionMode === 'multiple' ? [...next] : (next[0] ?? null);
      },
    });

    return () => {
      const field = control();
      return (
        <div
          {...mergeAttrs<'div'>(
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
              'aria-labelledby': defaultLabelledBy(rest, field.labelledBy),
              'aria-describedby': field.describedBy,
            },
          )}
          data-orientation={orientation}
          data-disabled={field.disabled || undefined}
          data-readonly={field.readonly || undefined}
        >
          {selectionMode === 'single' && selected.length > 0 && (
            <span
              {...mergeAttrs<'span'>({ sx: toggleGroupStyles.indicator }, propsIndicator, {
                ref: _toRef(indicator),
                'aria-hidden': true,
              })}
            />
          )}
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
    // 与 Button 同一套行为：不可用、拦截点击、波纹、状态 data 属性；只读时不出波纹
    const behavior = useButtonBehavior(
      () => ({
        disabled: disabled || group.disabled,
        loading: false,
        ripple: group.readonly ? false : group.ripple,
      }),
      () => () => group.toggle(value),
    );
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
          {...mergeAttrs<'button'>(
            {
              sx: [
                buttonSx(
                  {
                    ...base,
                    // 单选时选中底色由组的滑块画
                    variant: pressed && !group.sliding ? 'surface' : 'ghost',
                    tone: pressed ? 'accent' : 'neutral',
                  },
                  { disabled: off, square: children == null },
                ),
                group.readonly && !pressed && toggleGroupStyles.readonlyItem,
              ],
            },
            rest,
            {
              type: 'button',
              'aria-pressed': pressed,
              // 使用方的 onClick 先执行，preventDefault 可以拦下切换（mergeProps 的规则）
              ...behavior(),
            },
          )}
          data-state={pressed ? 'on' : 'off'}
        >
          {buttonContent({ icon, propsIcon, propsContent, children }, { loading: false })}
        </button>
      );
    };
  },
);

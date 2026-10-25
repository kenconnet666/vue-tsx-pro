/**
 * 输入框外壳：配方、外观选项、前置图标与交互小工具。TextField、Textarea、NumberField、Select、Combobox、
 * TagsInput 与日期输入框共用。
 * 外壳是包着原生 input 的 div：边框、悬停、焦点环（:focus-within）、出错、不可用、只读都画在外壳上，
 * input 本身透明无边框，所以图标、清除按钮、步进按钮可以放进框里。尺寸用 em，随 size 缩放（COMPONENTS.md §3）。
 */
import * as css from '@vue-tsx-pro/tsx/styles';
import type { SxStyles } from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useDefaults } from '../config/defaults';
import { useRecipe, type PartLayer } from '../config/styles';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  AttachedContext,
  attachedStyles,
  type AttachedOrientations,
} from '../utils/style/attached';
import { focusRingStyles, radiusStyles, type Radius } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

/** 输入框的样式 */
export interface ControlVariants {
  /** 表面色加描边（默认） */
  surface: unknown;
  /** 浅色底，没有描边：表单很密、或放在有底色的区域里 */
  soft: unknown;
}

/** 输入框的外观选项；可以用 createUi / Provider 的 defaults.Input 统一改默认值 */
export interface ControlOptions {
  /** 样式，默认 surface */
  variant?: keyof ControlVariants;
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 圆角，与按钮同一套档位，默认 md；搜索框常用 full（胶囊形） */
  radius?: Radius;
}

/** 框里最前面的图标（搜索、日历、地球……）：各种输入框共有 */
export interface ControlIconOptions {
  /** 前置图标 */
  icon?: IconData;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
}

/** 外壳的状态：出错、不可用、只读 */
export interface ControlState {
  /** 校验未通过：红色描边与焦点环 */
  invalid?: boolean;
  /** 不可用：变淡 */
  disabled?: boolean;
  /** 只读：底色变浅，不显示悬停 */
  readonly?: boolean;
}

/**
 * 输入框外壳的配方：部件 root（外壳 div）、input（原生 input / textarea）、icon（前后的图标）、
 * affix（前后缀文字）、button（框里的小按钮：清除、显示密码、步进）。
 * 档位是样式（variant）、在 ControlGroup 里的方向（attached）与外壳的状态；圆角、相连、字号用共用的样式表，
 * 由 controlParts 叠在配方之后
 */
export const inputRecipe = css.recipe({
  name: 'Input',
  parts: ['root', 'input', 'icon', 'affix', 'button'],
  base: {
    root: {
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '_sm',
      minWidth: 0,
      minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
      paddingInline: '_md',
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: { default: '_border', ':hover': '_borderStrong' },
      borderRadius: '_md',
      backgroundColor: '_surface',
      color: '_text',
      lineHeight: '_normal',
      cursor: 'text',
      transition: `border-color ${t.durations.sm} ${t.easings.standard}`,
    },
    // 原生 input / textarea：透明、无边框，占满剩余宽度，字体继承外壳。
    // 参与基线对齐、高度撑满外壳：外壳（flex）的基线取输入框文字的基线，而不是排在前面的图标的底边，
    // 左标签（按基线对齐）才与输入的文字在同一条线上；原生输入框自己把文字竖直居中
    input: {
      alignSelf: 'baseline',
      boxSizing: 'border-box',
      flexGrow: 1,
      minWidth: 0,
      minHeight: `calc(max(${t.sizes.control}, ${t.sizes.minTarget}) - 2 * ${t.borderWidths.xs})`,
      margin: 0,
      paddingBlock: '_xs',
      paddingInline: 0,
      borderWidth: 0,
      outlineStyle: 'none',
      backgroundColor: 'transparent',
      color: 'inherit',
      font: 'inherit',
      cursor: 'inherit',
      '::placeholder': { color: '_textPlaceholder', opacity: 1 },
    },
    // 前后的图标：次要颜色
    icon: { flexShrink: 0, color: '_textMuted' },
    // 前后缀文字（如 https://、元）：次要颜色，不换行
    affix: { flexShrink: 0, color: '_textMuted', whiteSpace: 'nowrap' },
    // 框里的小按钮：比独立的图标按钮紧凑，仍不小于 24px 的点击区域
    button: {
      flexShrink: 0,
      width: `max(1.5em, ${t.sizes.minTarget})`,
      minHeight: `max(1.5em, ${t.sizes.minTarget})`,
      marginInline: `calc(-1 * ${t.space.xs})`,
      color: '_textMuted',
    },
  },
  // 档位的先后就是覆盖的先后：只读、出错依次盖过样式的描边与底色
  variants: {
    variant: {
      surface: {},
      soft: {
        root: {
          borderColor: { default: 'transparent', ':hover': 'transparent' },
          backgroundColor: '_fill',
        },
      },
    },
    // 在横排的 ControlGroup 里：输入框分掉剩余宽度（选择框按内容宽，见 selectStyles.root）
    attached: { horizontal: { root: { flexGrow: 1 } }, vertical: {} },
    readonly: {
      true: {
        root: {
          borderColor: { default: '_borderMuted', ':hover': '_borderMuted' },
          backgroundColor: '_fill',
        },
      },
    },
    invalid: {
      true: {
        root: {
          borderColor: { default: '_danger', ':hover': '_danger' },
          outlineColor: '_danger',
        },
      },
    },
    disabled: { true: { root: { opacity: '_disabled', cursor: 'not-allowed' } } },
    // 多行（Textarea）：内容从顶部开始，上下也留内边距
    multiline: { true: { root: { alignItems: 'stretch', paddingBlock: '_xs' } } },
  },
});

/** 输入框外壳的部件（createUi / Provider 的 styles.Input 按它定制） */
export type InputPart = (typeof inputRecipe.parts)[number];

/**
 * 外壳各部件交给 mergeAttrs / mergeProps 的默认层：样式与部件标记（data-scope="input"）。
 * 要加样式时写 `{ ...s.root, sx: [s.root.sx, 别的] }`
 */
export type ControlParts = {
  readonly [Part in InputPart]: Omit<PartLayer, 'sx'> & { readonly sx: SxStyles };
};

/** 外壳里的图标（前置、后置）：次要颜色、不被挤压；没有图标时不渲染 */
export function controlIcon(
  parts: ControlParts,
  icon: IconData | undefined,
  props?: Partial<IconProps>,
): VNodeChild {
  return icon ? <Icon {...mergePartProps<IconProps>({ ...parts.icon, icon }, props)} /> : null;
}

/** 外壳里的清空按钮：圆形、名称取语言包（清空）；有值、可编辑时才渲染由调用方决定 */
export function controlClear(
  parts: ControlParts,
  props: Partial<PresetIconButtonProps> | undefined,
  onClick: () => void,
): VNodeChild {
  return (
    <ClearButton
      {...mergePartProps<PresetIconButtonProps>({ ...parts.button, radius: 'full' }, props, {
        onClick,
      })}
    />
  );
}

/**
 * 外壳里的前缀、后缀文字（币种、单位）：用指向输入框的 label，读屏把单位念进名称（“年度预算 万元”），
 * 不可用时也算作不可用控件的文字（不要求对比度）；没有内容时不渲染
 */
export function controlAffix(
  parts: ControlParts,
  content: VNodeChild,
  inputId: string,
  props?: PartProps<'label'>,
): VNodeChild {
  return content == null ? null : (
    <label {...mergeAttrs<'label'>(parts.affix, props, { for: inputId })}>{content}</label>
  );
}

/** 合并后的外观（默认值已填上）；在 ControlGroup 里时带上相连的方向 */
export type ControlAppearance = Required<Pick<ControlOptions, 'variant' | 'radius'>> &
  Pick<ControlOptions, 'size'> & {
    attached?: keyof AttachedOrientations;
    /** 外壳的配方，带上 createUi / Provider 里 styles.Input 的定制 */
    recipe: ReturnType<typeof useRecipe<InputPart, unknown>>;
  };

/**
 * 输入框的外观：显式写的 prop > createUi / Provider 的 defaults.Input > 默认（surface）。
 * 在 setup 里调用，返回的函数在渲染时调用
 */
export function useControlAppearance(read: () => ControlOptions): () => ControlAppearance {
  const group = AttachedContext.inject(null);
  const recipe = useRecipe(inputRecipe);
  const appearance = useDefaults('Input', read, { variant: 'surface', radius: 'md' });
  return () => ({ ...appearance(), attached: group?.orientation, recipe });
}

/**
 * 外观与状态 → 外壳各部件的默认层；multiline 给 Textarea。
 * 外壳在配方之后叠上圆角、相连、字号；焦点环排在配方之前，出错档位的红色焦点环才盖得过它
 */
export function controlParts(
  { variant, size, radius, attached, recipe }: ControlAppearance,
  { invalid, disabled, readonly }: ControlState,
  multiline = false,
): ControlParts {
  const parts = recipe({ variant, attached, readonly, invalid, disabled, multiline });
  return {
    ...parts,
    root: {
      ...parts.root,
      sx: [
        focusRingStyles.within,
        parts.root.sx,
        radiusStyles[radius],
        attached && attachedStyles[attached],
        size && fontSizeStyles[size],
      ],
    },
  };
}

/** 点在外壳的空白处（内边距、图标、标签上）：不是主元素本身，也不是框里的按钮 */
function isShellBlank(target: Element, element: HTMLElement): boolean {
  return target !== element && !element.contains(target) && !target.closest('button');
}

/**
 * 外壳的 onPointerdown：点在外壳的空白处时把焦点交给主元素（input、触发按钮），不让浏览器把焦点放到别处；
 * 点在主元素或框里的按钮上时照常
 */
export function focusOnShell(main: () => HTMLElement | null): (event: PointerEvent) => void {
  return (event) => {
    const element = main();
    if (!element || !isShellBlank(event.target as Element, element)) return;
    event.preventDefault();
    element.focus();
  };
}

/**
 * 外壳的 onClick：点在外壳的空白处时调用 action（Select、TreeSelect 据此切换打开，与点触发按钮一样）。
 * 不在 pointerdown 里打开：原生 popover="auto" 在 pointerup 时把“按下时还没打开”的浮层当作点在外面关掉
 */
export function clickOnShell(
  main: () => HTMLElement | null,
  action: (event: MouseEvent) => void,
): (event: MouseEvent) => void {
  return (event) => {
    const element = main();
    if (element && isShellBlank(event.target as Element, element)) action(event);
  };
}

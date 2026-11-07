/**
 * 勾选类控件（Checkbox、Radio、Switch）共用的样式与结构：
 *
 *   label（Root，整块可点）> span（Control，叠放层）> input（原生，appearance: none 画成方框 / 圆 / 轨道）
 *                                               + 标记（图标或滑块，叠在 input 上，不接收指针）
 *                        > span（Label，文字）
 *
 * 用原生 input：键盘（空格切换、单选组的方向键）、表单提交与重置、label 点击、读屏语义都是浏览器的；
 * 组件只画外观。勾选状态的样式由组件按自己的状态加（样式里不写兄弟选择器）。尺寸用 em。
 * 部件与样式见 choiceRecipe（createUi / Provider 的 styles.Choice 按它定制）。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick } from 'vue';
import { useDefaults } from '../config/defaults';
import { useRecipe, type PartLayer, type RecipeLayers } from '../config/styles';
import { variantOf } from '../utils/style/styles';
import { toneFillStyles, type StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, relativeFontSizes, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

/** 勾选类控件的外观选项；可以用 createUi / Provider 的 defaults.Choice 统一改默认值 */
export interface ChoiceOptions {
  /** 字号档位（方框、圆、开关随之缩放）；不写时继承上下文字号 */
  size?: TextSize;
  /**
   * 选中时的色调（与 Button、Badge 等同一套）
   * @default 'accent'
   */
  tone?: StatusTone;
}

/**
 * 勾选类控件的配方：部件 root（外层 label，整块可点）、control（叠放层）、input（原生 input）、
 * indicator（标记：对勾、圆点、开关滑块）、label（文字）、description（文字下方的说明）、end（结束边的内容：价格、标记）、
 * group（复选组、单选组）。档位是外层的只读、不可用、卡片外观与组的排列方向；勾选、出错见 choiceInputStyles、choiceCardStyles
 */
export const choiceRecipe = css.recipe({
  name: 'Choice',
  parts: ['root', 'control', 'input', 'indicator', 'label', 'description', 'end', 'group'],
  base: {
    // 控件与文字一行，整块可点；点击区域不小于 24px（WCAG 2.5.8）
    root: {
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: '_sm',
      minHeight: '_sizes.minTarget',
      lineHeight: '_normal',
      color: '_text',
      cursor: 'pointer',
      userSelect: 'none',
    },
    // input 与标记放在同一个网格格子里；与第一行文字垂直居中（行高 1.5em）
    control: {
      display: 'inline-grid',
      placeItems: 'center',
      flexShrink: 0,
      minHeight: '1.5em',
    },
    // 去掉浏览器外观，由各组件给出形状；焦点环用 focusRingStyles.tight（排在它后面）。
    // 字体继承外层：浏览器给 input 的是自己的字号（13.333px），方框、轨道的 em 会按它算，和文字、滑块对不上
    input: {
      gridArea: '1 / 1',
      appearance: 'none',
      boxSizing: 'border-box',
      margin: 0,
      font: 'inherit',
      borderWidth: '_sm',
      borderStyle: 'solid',
      borderColor: '_borderStrong',
      backgroundColor: '_surface',
      cursor: 'inherit',
      transition: `background-color ${t.durations.sm} ${t.easings.standard}, border-color ${t.durations.sm} ${t.easings.standard}`,
    },
    // 叠在 input 上，点击穿透到 input
    indicator: { gridArea: '1 / 1', pointerEvents: 'none' },
    // 有说明时文字在上、说明在下
    label: { minWidth: 0, display: 'grid' },
    // 次要颜色、小一号
    description: { color: '_textMuted', fontSize: relativeFontSizes.xs },
    end: {
      display: 'flex',
      alignItems: 'center',
      gap: '_xs',
      flexShrink: 0,
      marginInlineStart: 'auto',
    },
  },
  variants: {
    // 只读：外观照常（看得清选了什么），只是不像能点
    readonly: { true: { root: { cursor: 'default' } } },
    disabled: { true: { root: { opacity: '_disabled', cursor: 'not-allowed' } } },
    orientation: {
      vertical: { group: { display: 'flex', flexDirection: 'column', gap: '_xs' } },
      horizontal: {
        group: { display: 'flex', flexWrap: 'wrap', columnGap: '_lg', rowGap: '_xs' },
      },
    },
    // 卡片外观：整块是一张带边框的卡片（套餐、配送方式、模板）；组排成栅格（排在 orientation 后面，盖过它的 flex）。
    // 选中时的边框与底色见 choiceCardStyles
    card: {
      true: {
        root: {
          display: 'flex',
          width: '_full',
          gap: '_sm',
          paddingBlock: '_md',
          paddingInline: '_md',
          borderWidth: '_xs',
          borderStyle: 'solid',
          borderColor: { default: '_border', _hover: '_borderStrong' },
          borderRadius: '_md',
          backgroundColor: '_surface',
          transition: `background-color ${t.durations.sm} ${t.easings.standard}, border-color ${t.durations.sm} ${t.easings.standard}`,
        },
        label: { flexGrow: 1 },
        group: { display: 'grid', gap: '_sm' },
      },
    },
    // 色调经变量传给方框、圆点、轨道（toneFillStyles）；字号不写时继承
    tone: variantOf(toneFillStyles, 'root'),
    size: variantOf(fontSizeStyles, 'root'),
  },
  defaults: { tone: 'accent' },
});

/** 勾选类控件的部件（createUi / Provider 的 styles.Choice 按它定制） */
export type ChoicePart = (typeof choiceRecipe.parts)[number];

/**
 * 原生 input 的勾选、出错样式：排在各组件的形状（方框、圆、轨道）之后，所以不放进配方——
 * 开关的轨道把描边设成透明，出错的红色描边要盖过它
 * @internal 组件之间共用，不进入口
 */
export const choiceInputStyles = css.create({
  /** 已勾选（或部分勾选）：色调的实底色，见 choiceParts */
  checked: { borderColor: 'var(--tone-fill)', backgroundColor: 'var(--tone-fill)' },
  invalid: { borderColor: '_danger', outlineColor: '_danger' },
});

/**
 * 卡片外观的状态样式：选中时边框与浅底换成色调色；横排的组按宽度分列
 * @internal 组件之间共用，不进入口
 */
export const choiceCardStyles = css.create({
  checked: {
    borderColor: 'var(--tone-fill)',
    backgroundColor: `color-mix(in oklab, var(--tone-fill) 8%, ${t.colors.surface})`,
  },
});

/**
 * 卡片外观横排时按宽度分列：每张不窄于 minItemWidth
 * @internal 组件之间共用，不进入口
 */
export const choiceCardDynamicStyles = css.create({
  columns: (minItemWidth: string) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${minItemWidth}, 100%), 1fr))`,
  }),
});

/** 合并后的外观：tone 总有值，size 不写时继承字号 */
export type ChoiceAppearance = Pick<ChoiceOptions, 'size'> &
  Required<Pick<ChoiceOptions, 'tone'>> & {
    /** 勾选类控件的配方，带上 createUi / Provider 里 styles.Choice 的定制 */
    recipe: RecipeLayers<ChoicePart>;
  };

/** 勾选类控件的外观：显式写的 > defaults.Choice > 默认。在 setup 里调用，返回的函数在渲染时调用 */
export function useChoiceAppearance(read: () => ChoiceOptions): () => ChoiceAppearance {
  const recipe = useRecipe(choiceRecipe);
  const appearance = useDefaults('Choice', read, { tone: 'accent' });
  return () => ({ ...appearance(), recipe });
}

/** 各部件交给 mergeAttrs / mergeProps 的默认层：样式与部件标记（data-scope="choice"） */
export type ChoiceParts = {
  readonly [Part in ChoicePart]: Omit<PartLayer, 'sx'> & { readonly sx: SxStyles };
};

/** 外观与状态 → 各部件的默认层（配方里有色调、字号与状态） */
export function choiceParts(
  { size, tone, recipe }: ChoiceAppearance,
  { disabled, readonly, card = false }: { disabled: boolean; readonly: boolean; card?: boolean },
): ChoiceParts {
  return recipe({ readonly, disabled, card, tone, size });
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * 只读的原生勾选框要拦住的事件：点击（空格键也是点击）不改勾选，单选组的方向键不换选中项。
 * 原生 checkbox 没有 readonly 属性；这样焦点照常能到，读屏经 aria-readonly 念“只读”，值也照常随表单提交
 */
export const readonlyChoiceHandlers = {
  onClick: (event: Event) => event.preventDefault(),
  onKeydown: (event: KeyboardEvent) => {
    if (ARROW_KEYS.has(event.key)) event.preventDefault();
  },
};

/**
 * 受控的勾选：改值之后，父级没接受（或改成了别的值）时把原生 input 的 checked 改回去。
 * 浏览器在点击时已经改了 checked（单选还取消了同组原来选中的那个），而 Vue 比较的是 prop：
 * 父级的值没变就不会去动 DOM，界面和值就对不上了（切换要等接口的开关、只能选几项的复选框）
 */
export function syncChecked(
  inputs: readonly HTMLInputElement[],
  isChecked: (input: HTMLInputElement) => boolean,
): void {
  void nextTick(() => {
    for (const input of inputs) {
      const checked = isChecked(input);
      if (input.checked !== checked) input.checked = checked;
    }
  });
}

/** 复选组、单选组的排列方向 */
export interface ChoiceOrientations {
  /** 竖排（默认） */
  vertical: unknown;
  /** 横排，放不下时换行 */
  horizontal: unknown;
}

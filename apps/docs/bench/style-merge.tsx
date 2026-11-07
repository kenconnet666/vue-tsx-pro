/**
 * 样式合并基准（scripts/docs/style-merge.mjs 驱动）：同样外观的 N 个按钮，比较几种写法在挂载、重渲染、换档位、
 * 换主题、加定制层时的开销。每种写法用同一份声明（原生组的 CSS 由引擎对同样的片段算出来再改成固定类）。
 *
 *   ?mode=real     组件库的 Button：配方 + useDefaults + mergeAttrs + 引擎
 *   ?mode=lite     只走引擎的样式路径：同样的片段与配方交给 css.attrs，没有组件库的属性合并与按钮行为
 *   ?mode=native   原生 CSS：固定类，按 @layer 排层（基础 < 档位 < 字号 < 定制），使用方的类不分层、盖过全部
 *   ?mode=bare     不挂样式：Vue 本身的下限
 *
 * 场景由 window.__bench.run(名字) 触发：改状态、等 Vue 更新（script）、再强制布局（layout，含样式重算），分别计时。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css, styleText, type SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button, createUi, darkTheme, lightTheme, Provider } from '@zerodep-dev/vue-tsx-pro-ui';
import { createApp, nextTick } from 'vue';
import {
  buttonBaseStyles,
  buttonRecipe,
  buttonStyles,
  type ButtonVariants,
} from '../../../packages/ui/src/base/button-core';
import { rippleHostStyles } from '../../../packages/ui/src/utils/dom/ripple';
import { focusRingStyles, radiusStyles } from '../../../packages/ui/src/utils/style/styles';
import type { StatusTone } from '../../../packages/ui/src/utils/style/tone-styles';
import { interactionTransitions } from '../../../packages/ui/src/utils/style/transitions';
import { fontSizeStyles } from '../../../packages/ui/src/utils/style/typography';

type Mode = 'real' | 'lite' | 'native' | 'bare';
type Variant = keyof ButtonVariants;
type Size = 'sm' | 'md' | 'lg';

const params = new URLSearchParams(location.search);
const mode = (params.get('mode') ?? 'real') as Mode;
const COUNT = Number(params.get('count') ?? 2000);

const VARIANTS: Variant[] = ['solid', 'soft', 'surface', 'outline', 'ghost', 'link'];
const TONES: StatusTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];
const SIZES: Size[] = ['sm', 'md', 'lg'];
/** 使用方的覆盖有几种（每个按钮取其中一种） */
const SX_KINDS = 12;

/** 第 i 个按钮的档位：6 样式 × 6 色调 × 3 字号 = 108 种组合，shift 让样式整体错开一位 */
const comboOf = (i: number, shift: number) => ({
  variant: VARIANTS[(i + shift) % 6]!,
  tone: TONES[Math.floor(i / 6) % 6]!,
  size: SIZES[Math.floor(i / 36) % 3]!,
});
/** 使用方覆盖的种类：custom 与 108 种组合同周期（新增 108 种组合），explode 错开周期（组合数相乘） */
const sxKindOf = (i: number, explode: boolean) =>
  explode ? Math.floor(i / 108) % SX_KINDS : i % SX_KINDS;

/* ───────── 定制层：引擎组是 Provider 的 components 与 sx，原生组是作用域类与使用方的类 ───────── */

const customButton = { root: { letterSpacing: '0.02em', paddingInline: '_xl' } } as const;
const sxStyles = css.create(
  Object.fromEntries(
    Array.from({ length: SX_KINDS }, (_, k) => [`s${k}`, { marginInlineEnd: k + 1 }]),
  ) as Record<`s${number}`, { marginInlineEnd: number }>,
);
const sxOf = (k: number) => (sxStyles as Record<string, SxStyles>)[`s${k}`];

/* ───────── 引擎的样式路径（lite）：与 buttonSx 相同的片段与顺序 ───────── */

function liteSx(variant: Variant, tone: StatusTone, size: Size, custom: boolean, sx: SxStyles) {
  const recipe = custom
    ? buttonRecipe({ variant, tone }, { base: customButton })
    : buttonRecipe({ variant, tone });
  return css.attrs(
    buttonBaseStyles.root,
    interactionTransitions.colors,
    buttonStyles.root,
    focusRingStyles.visible,
    rippleHostStyles.host,
    recipe.root,
    radiusStyles.md,
    fontSizeStyles[size],
    sx,
  );
}

/* ───────── 原生 CSS：同样的片段由引擎算出规则，类名换成固定的，按层包起来 ───────── */

/** 一组样式的规则原文，组合类换成 name */
function rulesOf(name: string, ...styles: SxStyles[]) {
  const composite = css.attrs(...styles).class!;
  return styleText()
    .split('\n')
    .filter((line) => line.includes(`.${composite}`))
    .map((line) => line.replaceAll(`.${composite}`, `.${name}`))
    .join('');
}

function nativeCss() {
  const variants = VARIANTS.flatMap((variant) =>
    TONES.map((tone) => rulesOf(`nb-${variant}-${tone}`, buttonRecipe({ variant, tone }).root)),
  );
  const sizes = SIZES.map((size) => rulesOf(`nb-fs-${size}`, fontSizeStyles[size]));
  const custom = rulesOf('nb-custom', { letterSpacing: '0.02em', paddingInline: '_xl' }).replaceAll(
    '.nb-custom',
    '.nb-scope .nb-root',
  );
  const user = Array.from({ length: SX_KINDS }, (_, k) => rulesOf(`nb-sx-${k}`, sxOf(k))).join('');
  return (
    '@layer nb.base,nb.variant,nb.size,nb.custom;' +
    `@layer nb.base{${rulesOf(
      'nb-root',
      buttonBaseStyles.root,
      interactionTransitions.colors,
      buttonStyles.root,
      focusRingStyles.visible,
      rippleHostStyles.host,
      radiusStyles.md,
    )}${rulesOf('nb-content', buttonStyles.content)}}` +
    `@layer nb.variant{${variants.join('')}}` +
    `@layer nb.size{${sizes.join('')}}` +
    `@layer nb.custom{${custom}}` +
    // 使用方自己的 CSS 不分层：盖过组件库的全部层
    user
  );
}

let nativeCssBytes = 0;
if (mode === 'native') {
  const text = nativeCss();
  nativeCssBytes = text.length;
  const element = document.createElement('style');
  element.textContent = text;
  document.head.append(element);
}

/* ───────── 四种按钮 ───────── */

interface BenchButtonProps {
  variant: Variant;
  tone: StatusTone;
  size: Size;
  /** 在定制层里（Provider 的 styles / 作用域类） */
  custom: boolean;
  /** 使用方覆盖的种类，-1 是没有 */
  sxKind: number;
  children?: string;
}

const LiteButton = _component(
  ({ variant, tone, size, custom, sxKind, children }: BenchButtonProps) =>
    () => (
      <button
        type="button"
        data-scope="button"
        data-part="root"
        {...liteSx(variant, tone, size, custom, sxKind >= 0 && sxOf(sxKind))}
      >
        <span {...css.attrs(buttonStyles.content)}>{children}</span>
      </button>
    ),
);

const NativeButton = _component(
  ({ variant, tone, size, sxKind, children }: BenchButtonProps) =>
    () => (
      <button
        type="button"
        data-scope="button"
        data-part="root"
        class={[
          'nb-root',
          `nb-${variant}-${tone}`,
          `nb-fs-${size}`,
          sxKind >= 0 && `nb-sx-${sxKind}`,
        ]}
      >
        <span class="nb-content">{children}</span>
      </button>
    ),
);

const BareButton = _component(({ children }: BenchButtonProps) => () => (
  <button type="button" data-scope="button" data-part="root">
    <span>{children}</span>
  </button>
));

/* ───────── 页面与场景 ───────── */

const Bench = _component(() => {
  let show = _state(false);
  let label = _state(0);
  let shift = _state(0);
  let dark = _state(false);
  /** 定制层：'' 没有，custom 与组合同周期，explode 组合数相乘 */
  let layer = _state<'' | 'custom' | 'explode'>('');

  const scenarios: Record<string, () => void> = {
    mount: () => (show = true),
    unmount: () => (show = false),
    rerender: () => label++,
    variant: () => shift++,
    theme: () => (dark = !dark),
    customMount: () => {
      layer = 'custom';
      show = true;
    },
    explodeMount: () => {
      layer = 'explode';
      show = true;
    },
    reset: () => {
      layer = '';
      show = false;
    },
  };

  (window as unknown as { __bench: unknown }).__bench = {
    mode,
    async run(name: string) {
      const start = performance.now();
      scenarios[name]!();
      await nextTick();
      const rendered = performance.now();
      void document.body.offsetHeight;
      const end = performance.now();
      return { script: rendered - start, layout: end - rendered, total: end - start };
    },
    stats: () => ({
      rules: [...document.styleSheets].reduce((sum, sheet) => sum + sheet.cssRules.length, 0),
      engineCssBytes: styleText().length,
      nativeCssBytes,
      buttons: document.querySelectorAll('button').length,
    }),
  };

  // 组件库的 Button 直接放进列表（不包一层），其余三种是同样一层组件
  const Item = { lite: LiteButton, native: NativeButton, bare: BareButton }[mode as 'lite'];
  const list = () =>
    Array.from({ length: COUNT }, (_, i) => {
      const sxKind = layer ? sxKindOf(i, layer === 'explode') : -1;
      return mode === 'real' ? (
        <Button key={i} {...comboOf(i, shift)} sx={sxKind >= 0 ? sxOf(sxKind) : undefined}>
          {`按钮 ${label}`}
        </Button>
      ) : (
        <Item key={i} {...comboOf(i, shift)} custom={layer !== ''} sxKind={sxKind}>
          {`按钮 ${label}`}
        </Item>
      );
    });

  return () => (
    <Provider theme={dark ? darkTheme : lightTheme}>
      {!show ? null : layer ? (
        <Provider components={{ Button: { styles: customButton } }}>
          <div class="nb-scope">{list()}</div>
        </Provider>
      ) : (
        <div>{list()}</div>
      )}
    </Provider>
  );
});

createApp(Bench).use(createUi()).mount('#app');

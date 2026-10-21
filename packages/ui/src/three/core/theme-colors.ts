/**
 * 主题色 → THREE.Color：3D 场景拿不到 CSS 变量，这里在元素上读出颜色的当前取值，转成 three.js 的颜色。
 *
 *   // 场景里（ThreeCanvas 的 setup）：跟随画布所在位置的主题，换色时自动重画
 *   setup: ({ scene, themeColors }) => {
 *     const palette = themeColors({ accent: colors.accent, glow: colors.chart3 });
 *     material.color = palette.accent;          // 直接赋同一个对象；构造参数里传会被复制一份
 *     uniforms.uGlow = { value: palette.glow };
 *   }
 *
 *   // 组件里（颜色来源随 props 变化时）
 *   const palette = useThemeColors(() => host, () => ({ main: color }), { onChange: invalidate });
 *
 * 切换主题、主题编辑器改品牌色时重新读取，按主题的 lg 时长与 standard 缓动从旧色过渡到新色（减少动态效果时直接换）；
 * Color 对象始终是同一批，材质与 uniform 不用重建。
 *
 * 颜色可以是 token（`colors.accent`）或任意 CSS 颜色（`'#e5484d'`、`'color-mix(…)'`）：
 * 交给一个隐藏的探针元素，由浏览器解析出最终的颜色，light-dark()、color-mix()、主题覆盖都能用。透明度不保留。
 */
import { animate, type JSAnimation } from 'animejs';
import {
  converter,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeP3,
  modeRgb,
  parse,
  useMode,
} from 'culori/fn';
import { Color, SRGBColorSpace } from 'three';
import { onBeforeUnmount, watch } from 'vue';
import { useConfig } from '../../config/context';
import { clamp } from '../../utils/data/number';
import { themeTransitionOrInstant } from '../../utils/motion/animation';

// 浏览器给出的计算值可能是 rgb()、color(srgb …)、color(display-p3 …)、oklch()、lab() 等
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeP3);
useMode(modeLab);
useMode(modeLch);
useMode(modeOklab);
useMode(modeOklch);
const toRgb = converter('rgb');

/** 一组要读的颜色：名字 → token 或 CSS 颜色 */
export type ThemeColorSources = Readonly<Record<string, string>>;

/** 一组主题色：名字 → THREE.Color（换色时原地修改） */
export type ThemeColors<Sources extends ThemeColorSources> = {
  readonly [Name in keyof Sources]: Color;
};

/**
 * 在 scope 元素上读出 CSS 颜色，写进 target（sRGB 转成 three.js 的线性工作空间）。
 * 解析不了时（读不到主题、格式不认识）保持原值，返回 false
 */
export function readThemeColor(scope: Element, value: string, target: Color): boolean {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  probe.style.color = value;
  scope.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const parsed = computed ? parse(computed) : undefined;
  const rgb = parsed && toRgb(parsed);
  if (!rgb) return false;
  const unit = (channel: number) => clamp(channel || 0, 0, 1);
  target.setRGB(unit(rgb.r), unit(rgb.g), unit(rgb.b), SRGBColorSpace);
  return true;
}

/** 一组跟随主题的颜色：refresh 读取并过渡，stop 取消还在跑的过渡 */
export interface ThemeColorSet<Sources extends ThemeColorSources> {
  /** 名字 → THREE.Color：材质直接引用这些对象，换主题时原地改值 */
  readonly colors: ThemeColors<Sources>;
  /** 在 scope 上重新读取；transition 为 false（第一次读）时直接换 */
  refresh(scope: Element, sources: Sources, transition: boolean): void;
  /** 取消还在跑的过渡 */
  stop(): void;
}

/** 建一组主题色（useThemeColors 与场景上下文的 themeColors 共用） */
export function createThemeColorSet<Sources extends ThemeColorSources>(
  onChange?: () => void,
): ThemeColorSet<Sources> {
  const colors: Record<string, Color> = {};
  let running: JSAnimation | undefined;
  return {
    colors: colors as ThemeColors<Sources>,
    refresh(scope, sources, transition) {
      void running?.cancel();
      const from: Record<string, Color> = {};
      const to: Record<string, Color> = {};
      for (const [name, value] of Object.entries(sources)) {
        const color = (colors[name] ??= new Color());
        from[name] = color.clone();
        to[name] = color.clone();
        readThemeColor(scope, value, to[name]!);
      }
      const apply = (progress: number) => {
        for (const name of Object.keys(to))
          colors[name]!.lerpColors(from[name]!, to[name]!, progress);
        onChange?.();
      };
      const timing = transition ? themeTransitionOrInstant(scope, { duration: 'lg' }) : {};
      if (!timing.duration) return apply(1);
      const state = { progress: 0 };
      running = animate(state, { progress: 1, ...timing, onUpdate: () => apply(state.progress) });
    },
    stop() {
      void running?.cancel();
    },
  };
}

/** useThemeColors 的选项 */
export interface ThemeColorOptions {
  /** 颜色变了（第一次读到、过渡的每一帧）时调用：循环停着的场景在这里请求重画 */
  onChange?: () => void;
}

/** 组件里的主题色（在 setup 里调用）：scope 元素挂载后读取，换主题或来源变了时过渡到新色，见文件开头 */
export function useThemeColors<Sources extends ThemeColorSources>(
  scope: () => Element | null | undefined,
  sources: Sources | (() => Sources),
  { onChange }: ThemeColorOptions = {},
): ThemeColors<Sources> {
  const config = useConfig();
  const set = createThemeColorSet<Sources>(onChange);
  const read = () => (typeof sources === 'function' ? sources() : sources);
  // 挂载前就能拿到全部名字：材质可以在第一次读取前引用这些对象
  for (const name of Object.keys(read())) (set.colors as Record<string, Color>)[name] = new Color();
  let loaded = false;
  watch(
    [() => config.theme, scope, () => JSON.stringify(read())],
    ([, element]) => {
      if (!element) return;
      set.refresh(element, read(), loaded);
      loaded = true;
    },
    { immediate: true, flush: 'post' },
  );
  onBeforeUnmount(() => set.stop());
  return set.colors;
}

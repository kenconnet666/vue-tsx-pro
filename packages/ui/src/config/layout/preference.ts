/**
 * 布局偏好：用户选的侧栏形式（固定 / 抽屉）、抽屉从哪一边滑出、抽屉开不开与尺寸，记在本地存储里，
 * 下次打开、其他标签页都沿用。和 createThemePreference 对应：主题管颜色，布局偏好管结构。
 * 交给 AppShell 的 layout，配合 LayoutSwitcher 让用户自己选：
 *
 *   const layout = createLayoutPreference({ defaults: { mode: 'overlay' } });
 *   <AppShell layout={layout} sidebar={…} header={<LayoutSwitcher layout={layout} />}>…</AppShell>
 *
 * 各项都是可读可写的属性（读时跟踪、写时存盘），也能不经 AppShell 直接用：layout.side = 'end'。
 * 存的值不合法（改过键、版本升级）时用默认值，不会报错；存储不可用（隐私模式）时只在内存里。
 */
import { effectScope, reactive, watch } from 'vue';

/** 侧栏的形式 */
export type LayoutMode = 'docked' | 'overlay';

/** 抽屉式侧栏从哪一边滑出：start / end 随排版方向（从右到左时互换），top / bottom 是上下 */
export type LayoutSide = 'start' | 'end' | 'top' | 'bottom';

/** 可选的侧栏形式，LayoutSwitcher 据此列出选项 */
export const LAYOUT_MODES: readonly LayoutMode[] = ['docked', 'overlay'];
/** 可选的抽屉方向，LayoutSwitcher 据此列出选项 */
export const LAYOUT_SIDES: readonly LayoutSide[] = ['start', 'end', 'top', 'bottom'];

/** 默认的抽屉宽度（px）：左右两侧 */
export const DEFAULT_LAYOUT_WIDTH = 256;
/** 默认的抽屉高度（px）：上下两侧 */
export const DEFAULT_LAYOUT_HEIGHT = 320;

/** createLayoutPreference 记住的内容 */
export interface LayoutState {
  /** 侧栏的形式，默认 docked */
  mode: LayoutMode;
  /** 抽屉从哪一边滑出（只在 overlay 时有效），默认 start */
  side: LayoutSide;
  /** 抽屉开着 */
  open: boolean;
  /** 左右两侧抽屉的宽度（px） */
  width: number;
  /** 上下两侧抽屉的高度（px） */
  height: number;
  /** docked 侧栏收起成了图标栏 */
  collapsed: boolean;
}

/** createLayoutPreference 的选项 */
export interface LayoutPreferenceOptions {
  /** 没记过（或记的值不合法）时各项的值 */
  defaults?: Partial<LayoutState>;
  /** 记住选择的 localStorage 键，默认 'vue-tsx-pro-layout'；false 不记 */
  storageKey?: string | false;
}

/** 布局偏好：各项可读可写，写了就存盘、其他标签页跟着变 */
export interface LayoutPreference extends LayoutState {
  /** 全部恢复成默认值（并清掉记住的内容） */
  reset(): void;
}

/** 记住选择的默认 localStorage 键 */
export const DEFAULT_LAYOUT_STORAGE_KEY = 'vue-tsx-pro-layout';

const isMode = (value: unknown): value is LayoutMode => LAYOUT_MODES.includes(value as LayoutMode);
const isSide = (value: unknown): value is LayoutSide => LAYOUT_SIDES.includes(value as LayoutSide);
const isSize = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** 读存下来的内容，只留合法的项 */
function parse(text: string | null): Partial<LayoutState> {
  if (!text) return {};
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {};
  }
  if (typeof value !== 'object' || value === null) return {};
  const stored = value as Record<string, unknown>;
  const result: Partial<LayoutState> = {};
  if (isMode(stored.mode)) result.mode = stored.mode;
  if (isSide(stored.side)) result.side = stored.side;
  if (typeof stored.open === 'boolean') result.open = stored.open;
  if (isSize(stored.width)) result.width = stored.width;
  if (isSize(stored.height)) result.height = stored.height;
  if (typeof stored.collapsed === 'boolean') result.collapsed = stored.collapsed;
  return result;
}

/** 创建布局偏好；在应用的生命周期里一直有效（监听其他标签页的改动不撤销） */
export function createLayoutPreference(options: LayoutPreferenceOptions = {}): LayoutPreference {
  const storageKey =
    options.storageKey === undefined ? DEFAULT_LAYOUT_STORAGE_KEY : options.storageKey;
  const defaults: LayoutState = {
    mode: 'docked',
    side: 'start',
    open: false,
    width: DEFAULT_LAYOUT_WIDTH,
    height: DEFAULT_LAYOUT_HEIGHT,
    collapsed: false,
    ...options.defaults,
  };
  const read = (): LayoutState => ({
    ...defaults,
    ...(storageKey ? parse(safeStorage()?.getItem(storageKey) ?? null) : {}),
  });

  const state = reactive<LayoutState>(read());
  let remote = false;

  // 其他标签页改了：跟着变（这时不再写回去，避免来回触发）
  if (storageKey && typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey) return;
      remote = true;
      Object.assign(state, read());
    });
  }

  // 监听放在自己的作用域里：不属于哪个组件
  effectScope(true).run(() => {
    watch(
      () => ({ ...state }),
      (value) => {
        if (remote) {
          remote = false;
          return;
        }
        if (storageKey) safeStorage()?.setItem(storageKey, JSON.stringify(value));
      },
    );
  });

  // 对外是带读写的属性（state 本身不暴露：reset 不该混进要存的内容里）
  const preference = {
    reset() {
      Object.assign(state, defaults);
      if (storageKey) safeStorage()?.removeItem(storageKey);
    },
  } as LayoutPreference;
  for (const key of Object.keys(defaults) as (keyof LayoutState)[]) {
    Object.defineProperty(preference, key, {
      enumerable: true,
      get: () => state[key],
      set: (value: never) => {
        state[key] = value;
      },
    });
  }
  return preference;
}

/** 隐私模式、禁用存储时 localStorage 会抛错：当作没有存储 */
function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

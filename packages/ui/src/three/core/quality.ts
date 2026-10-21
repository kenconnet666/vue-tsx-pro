/**
 * 3D 效果的画质档位与 WebGL 上下文的数量上限。
 *
 * 档位决定像素比上限、粒子等元素的密度、是否抗锯齿；auto 按设备判断（触屏、核数、内存、省流量）；off 不渲染，显示降级内容。
 * 浏览器同时能保持的 WebGL 上下文有限（Chrome 约 16 个，超出时最早的上下文被强制丢失），
 * 页面上的效果多时由这里分配：超过上限时，回收最久没出现在视口里的那个，它再滚回视口时重建。
 */

/** 画质档位 */
export interface ThreeQualities {
  /** 按设备选择：触屏或低端设备 low / medium，桌面 high */
  auto: unknown;
  /** 像素比 1、密度 0.4、不抗锯齿 */
  low: unknown;
  /** 像素比上限 1.5、密度 0.7 */
  medium: unknown;
  /** 像素比上限 2、全密度 */
  high: unknown;
  /** 不创建 WebGL，直接显示降级内容：用户在设置里关掉了特效、省电模式 */
  off: unknown;
}

/** 画质档位名 */
export type ThreeQuality = keyof ThreeQualities;

/** 档位落到渲染上的参数 */
export interface ResolvedThreeQuality {
  /** 实际档位（auto 已按设备选定） */
  level: Exclude<ThreeQuality, 'auto' | 'off'>;
  /** 像素比上限：实际像素比取它与 devicePixelRatio 的较小值 */
  pixelRatio: number;
  /** 密度系数（0–1）：粒子数、网格细分等按它缩放 */
  density: number;
  /** 抗锯齿 */
  antialias: boolean;
}

const LEVELS: Record<ResolvedThreeQuality['level'], Omit<ResolvedThreeQuality, 'level'>> = {
  low: { pixelRatio: 1, density: 0.4, antialias: false },
  medium: { pixelRatio: 1.5, density: 0.7, antialias: true },
  high: { pixelRatio: 2, density: 1, antialias: true },
};

/** 设备信息里非标准的字段（Chromium 才有） */
interface DeviceHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** auto 的判断：省流量或很弱的设备 low，触屏或 4 核以下 medium，其余 high */
function deviceLevel(): ResolvedThreeQuality['level'] {
  if (typeof navigator === 'undefined') return 'medium';
  const hints = navigator as Navigator & DeviceHints;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = hints.deviceMemory ?? 8;
  if (hints.connection?.saveData || cores <= 2 || memory <= 2) return 'low';
  const coarse = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (coarse || cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

/** 档位名 → 渲染参数（off 不渲染，没有参数） */
export function resolveThreeQuality(
  quality: Exclude<ThreeQuality, 'off'> = 'auto',
): ResolvedThreeQuality {
  const level = quality === 'auto' ? deviceLevel() : quality;
  return { level, ...LEVELS[level] };
}

/** 占用一个 WebGL 上下文的效果 */
export interface ContextHolder {
  /** 现在是否在视口里：只回收不在视口里的 */
  readonly visible: boolean;
  /** 上次在视口里的时间（performance.now()）：先回收最久没出现的 */
  readonly lastSeen: number;
  /** 被回收：释放渲染器与场景，回到等待状态 */
  evict(): void;
  /** 有空位了：等待中的效果再试一次 */
  retry(): void;
}

let limit = 8;
const holders = new Set<ContextHolder>();
const waiting = new Set<ContextHolder>();

/**
 * 页面上同时保持的 WebGL 上下文上限，默认 8（给宿主自己的 canvas 留余量）。
 * 只影响之后申请的效果；已经在渲染的不会因为调低而被回收
 */
export function setMaxThreeContexts(count: number): void {
  limit = Math.max(1, Math.floor(count));
}

/** 当前占用的 WebGL 上下文数（测试、性能面板用） */
export function activeThreeContexts(): number {
  return holders.size;
}

/** 申请一个上下文：有空位直接占用；满了回收一个不在视口里的；都在视口里时排队，返回 false */
export function acquireContext(holder: ContextHolder): boolean {
  if (holders.has(holder)) return true;
  if (holders.size >= limit) {
    let oldest: ContextHolder | undefined;
    for (const other of holders) {
      if (!other.visible && (!oldest || other.lastSeen < oldest.lastSeen)) oldest = other;
    }
    if (!oldest) {
      waiting.add(holder);
      return false;
    }
    holders.delete(oldest);
    oldest.evict();
  }
  waiting.delete(holder);
  holders.add(holder);
  return true;
}

/** 释放上下文（卸载、被回收、上下文丢失），排队的效果依次再试 */
export function releaseContext(holder: ContextHolder): void {
  waiting.delete(holder);
  if (holders.delete(holder)) retryWaiting();
}

/** 排队的效果依次再试：有了空位，或有效果滚出视口（可以被回收）时调用 */
export function retryWaiting(): void {
  for (const next of [...waiting]) next.retry();
}

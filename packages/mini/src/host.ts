/**
 * 宿主约定的小程序实现：组件库（@zerodep-dev/vue-tsx-pro-mobile 的 useHost）要用的平台能力。
 * 每个页面一份，在页面的 Vue 应用上用全局 Symbol 键 provide，两边互不导入；接口的形状以组件库的 Host 为准。
 */
import type { MiniNode } from './node.ts';

/** 注入键：与组件库约定的同一个全局 Symbol */
export const HOST_KEY = Symbol.for('vue-tsx-pro.host');

/** 选择器查询（微信、支付宝相同的部分） */
interface SelectorQuery {
  select(selector: string): { boundingClientRect(): SelectorQuery };
  exec(callback: (results: (MiniRect | null)[]) => void): void;
}
interface MiniRect {
  top: number;
  left: number;
  width: number;
  height: number;
}
interface Callbacks<T> {
  success?: (result: T) => void;
  fail?: (error: unknown) => void;
}

/** 微信（wx）与支付宝（my）全局 API 里用到的部分 */
export interface MiniApi {
  getWindowInfo?(): { windowWidth: number; windowHeight: number };
  getSystemInfoSync(): { windowWidth: number; windowHeight: number };
  createSelectorQuery(): SelectorQuery;
  pageScrollTo(options: { scrollTop: number; duration?: number }): void;
  vibrateShort?(options?: { type?: string }): void;
  setClipboardData(options: { data: string } & Callbacks<unknown>): void;
  /** 微信 */
  chooseMedia?(
    options: { count: number; mediaType: string[] } & Callbacks<{
      tempFiles: { tempFilePath: string; size: number }[];
    }>,
  ): void;
  /** 支付宝 */
  chooseImage?(
    options: { count: number } & Callbacks<{ apFilePaths?: string[]; tempFilePaths?: string[] }>,
  ): void;
}
declare const wx: MiniApi | undefined;
declare const my: MiniApi | undefined;

/** 当前平台；不在小程序里（测试）时 undefined */
export function platform(): { name: 'wx' | 'my'; api: MiniApi } | undefined {
  if (typeof wx !== 'undefined') return { name: 'wx', api: wx };
  if (typeof my !== 'undefined') return { name: 'my', api: my };
  return undefined;
}

/** 窗口大小 */
export function windowSize(api: MiniApi) {
  const info = api.getWindowInfo?.() ?? api.getSystemInfoSync();
  return { width: info.windowWidth, height: info.windowHeight };
}

/** 页面这边要给宿主的：浮层根，以及"等这一轮 setData 生效"（量尺寸前要等节点上了模板） */
export interface PageBridge {
  overlay: MiniNode;
  flushed(): Promise<void>;
}

/** 一个页面的平台能力 */
export function createMiniHost(page: PageBridge) {
  const current = platform();
  const api = () => {
    if (!current) throw new Error('不在小程序里：宿主能力不可用');
    return current.api;
  };
  return {
    platform: current?.name ?? 'wx',
    /** 量节点：节点没有 id 时临时给一个（平时不发 id，省 setData 的体积），等它上了模板再查 */
    async measure(element: unknown): Promise<MiniRect | null> {
      const node = element as MiniNode | null;
      if (!node?.attrs || !current) return null;
      let id = node.attribute('id');
      if (!id) {
        id = `vtm-${node.sid}`;
        node.setAttribute('id', id);
      }
      await page.flushed();
      return new Promise((resolve) =>
        api()
          .createSelectorQuery()
          .select(`#${id}`)
          .boundingClientRect()
          .exec((results) => resolve(results[0] ?? null)),
      );
    },
    window: () => (current ? windowSize(current.api) : { width: 375, height: 667 }),
    scrollTo(top: number, options?: { smooth?: boolean }) {
      api().pageScrollTo({ scrollTop: top, duration: options?.smooth ? 300 : 0 });
    },
    // 小程序里锁滚动靠遮罩节点 catch 掉 touchmove（模板 vtp_lock，见 build/templates.ts），这里不需要做什么
    lockScroll: () => () => {},
    overlayRoot: () => page.overlay,
    vibrate() {
      api().vibrateShort?.({ type: 'light' });
    },
    copy: (text: string) =>
      new Promise<void>((resolve, reject) =>
        api().setClipboardData({ data: text, success: () => resolve(), fail: reject }),
      ),
    chooseImages: ({ count }: { count: number }) =>
      new Promise<{ url: string; size: number }[]>((resolve, reject) => {
        const mini = api();
        if (mini.chooseMedia)
          mini.chooseMedia({
            count,
            mediaType: ['image'],
            success: ({ tempFiles }) =>
              resolve(tempFiles.map((file) => ({ url: file.tempFilePath, size: file.size }))),
            fail: reject,
          });
        else
          mini.chooseImage?.({
            count,
            success: (result) =>
              resolve(
                (result.apFilePaths ?? result.tempFilePaths ?? []).map((url) => ({ url, size: 0 })),
              ),
            fail: reject,
          });
      }),
  };
}

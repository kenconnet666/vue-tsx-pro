/**
 * 宿主约定（MOBILE.md §5）：组件要用的平台能力都从这里取，不直接碰 DOM 与 window——
 * H5 用这里的 Web 实现；小程序由渲染运行时（@zerodep-dev/vue-tsx-pro-mini）在每个页面的应用上 provide 自己的实现。
 * 两边约定同一个全局 Symbol，互不导入。
 *
 *   const host = useHost();
 *   const rect = await host.measure(element);
 *   const unlock = host.lockScroll();
 */
import { inject, type InjectionKey } from 'vue';

/** 元素的位置与大小（视口坐标，px） */
export interface HostRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** 窗口信息 */
export interface HostWindow {
  /** 可用宽度（px） */
  width: number;
  /** 可用高度（px） */
  height: number;
}

/** 选到的图片 */
export interface ChosenImage {
  /** 能直接作为 img src 的地址（H5 是 blob: 地址，小程序是临时文件路径） */
  url: string;
  /** 字节数 */
  size: number;
  /** H5 里的 File，上传时用；小程序里没有 */
  file?: File;
}

/** 平台能力 */
export interface Host {
  /** 平台：web 是浏览器，wx 是微信小程序，my 是支付宝小程序 */
  readonly platform: 'web' | 'wx' | 'my';
  /** 量元素（模板 ref 拿到的节点）的位置大小；量不到时 null。小程序里只能异步取 */
  measure(element: unknown): Promise<HostRect | null>;
  /** 窗口的宽高 */
  window(): HostWindow;
  /** 页面滚动到某个位置 */
  scrollTo(top: number, options?: { smooth?: boolean }): void;
  /** 锁住页面滚动（弹出层打开时），返回解锁函数；可叠加，最后一个解锁时恢复 */
  lockScroll(): () => void;
  /** 浮层根：弹出层、轻提示 Teleport 到这里 */
  overlayRoot(): unknown;
  /** 短震动反馈；不支持时什么也不做 */
  vibrate(): void;
  /** 写剪贴板 */
  copy(text: string): Promise<void>;
  /** 选图片 */
  chooseImages(options: { count: number }): Promise<ChosenImage[]>;
}

/** 注入键：全局 Symbol，小程序运行时用同一个键 provide，不必导入这个模块 */
export const HOST_KEY: InjectionKey<Host> = Symbol.for('vue-tsx-pro.host') as InjectionKey<Host>;

let locks = 0;
let restoreOverflow = '';

/** 浏览器里的实现 */
export const webHost: Host = {
  platform: 'web',
  async measure(element) {
    if (!(element instanceof Element)) return null;
    const { top, left, width, height } = element.getBoundingClientRect();
    return { top, left, width, height };
  },
  window: () => ({ width: window.innerWidth, height: window.innerHeight }),
  scrollTo(top, options) {
    window.scrollTo({ top, behavior: options?.smooth ? 'smooth' : 'auto' });
  },
  lockScroll() {
    if (locks++ === 0) {
      restoreOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--locks === 0) document.body.style.overflow = restoreOverflow;
    };
  },
  overlayRoot: () => document.body,
  vibrate() {
    navigator.vibrate?.(10);
  },
  copy: (text) => navigator.clipboard.writeText(text),
  chooseImages({ count }) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = count > 1;
      input.onchange = () => {
        const files = [...(input.files ?? [])].slice(0, count);
        resolve(files.map((file) => ({ url: URL.createObjectURL(file), size: file.size, file })));
      };
      input.click();
    });
  },
};

/** 当前应用的平台能力：小程序页面里是运行时 provide 的，其余是浏览器的实现 */
export function useHost(): Host {
  return inject(HOST_KEY, webHost);
}

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
import type {
  HostPermissions,
  HostStorage,
  LoginOptions,
  LoginResult,
  PaymentOrder,
  PaymentResult,
  PhoneNumberResult,
  PrivacyReply,
  SubscribeState,
} from '../capability/types';
import { webCapabilities } from '../capability/web';

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
  /** 平台：web 是浏览器，app 是原生应用里的 WebView（Capacitor，见 capacitor/），wx 是微信小程序，my 是支付宝小程序 */
  readonly platform: 'web' | 'app' | 'wx' | 'my';
  /** 量元素（模板 ref 拿到的节点）的位置大小；量不到时 null。小程序里只能异步取 */
  measure(element: unknown): Promise<HostRect | null>;
  /** 窗口的宽高 */
  window(): HostWindow;
  /** 页面滚动到某个位置 */
  scrollTo(top: number, options?: { smooth?: boolean }): void;
  /** 页面当前的滚动位置（px） */
  scrollTop(): number;
  /** 监听页面滚动，返回取消函数 */
  onScroll(listener: (top: number) => void): () => void;
  /**
   * 等这一轮的改动画到屏幕上再回调，返回取消函数。进场动画要先画出关闭的样子，再换成打开的样子，过渡才会播。
   * H5 是两次 requestAnimationFrame；小程序是这一轮 setData 生效之后（逻辑层没有屏幕刷新的回调）
   */
  nextFrame(callback: () => void): () => void;
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
  /** 设备权限：位置、相机、麦克风、相册、蓝牙（组件里用 usePermission） */
  readonly permissions: HostPermissions;
  /** 本地存储（组件里用 useStorage） */
  readonly storage: HostStorage;
  /** 登录凭证，交给后端换会话；H5 没有平台登录，由应用经 ConfigProvider 的 host 给出实现 */
  login(options?: LoginOptions): Promise<LoginResult>;
  /** 调起收银台；参数是后端下单的结果 */
  pay(order: PaymentOrder): Promise<PaymentResult>;
  /** 订阅消息：一次最多 3 个模板，要在用户点按的回调里调用 */
  subscribe(templateIds: string[]): Promise<Record<string, SubscribeState>>;
  /** 手机号按钮（Button 的 openType）的结果换成交给后端的凭证 */
  phoneNumber(detail: unknown): Promise<PhoneNumberResult>;
  /** 平台要求用户先同意隐私协议时通知（只有微信），返回取消函数；回复后平台才继续执行被拦下的接口 */
  onPrivacyRequest(listener: (reply: PrivacyReply) => void): () => void;
  /** 打开小程序的隐私协议页 */
  openPrivacyContract(): Promise<void>;
  /**
   * 页面的主题变了（最外层 ConfigProvider 通知）：原生应用里状态栏的文字颜色跟着换。
   * H5 与小程序不用做什么（小程序的导航栏颜色写在 app.json），可以不实现
   */
  themeChanged?(theme: 'light' | 'dark' | 'system'): void;
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
  scrollTop: () => window.scrollY,
  onScroll(listener) {
    const handle = () => listener(window.scrollY);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  },
  nextFrame(callback) {
    // 第一次在绘制前，第二次时上一帧已经画好
    let inner = 0;
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(callback)));
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
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
  ...webCapabilities,
};

/** 小程序（没有 DOM，节点画在模板里）；H5 与原生应用的 WebView 都是浏览器环境 */
export const isMiniProgram = (host: Host): boolean =>
  host.platform === 'wx' || host.platform === 'my';

/** 当前应用的平台能力：小程序页面里是运行时 provide 的，其余是浏览器的实现 */
export function useHost(): Host {
  return inject(HOST_KEY, webHost);
}

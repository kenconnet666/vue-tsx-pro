/**
 * 授权类能力的浏览器实现（宿主约定见 utils/host.ts，类型见 types.ts）。
 * 浏览器没有平台登录，也只在微信内置浏览器里能调起微信支付：这两项由应用经 ConfigProvider 的 host 补上自己的实现
 */
import type {
  DevicePermission,
  DevicePermissionState,
  HostPermissions,
  HostStorage,
  LoginResult,
  PaymentOrder,
  PaymentResult,
  PhoneNumberResult,
  PrivacyReply,
  SubscribeState,
} from './types';

/** 设备权限 → Permissions API 的名字；album 在 H5 是下载文件、蓝牙要用户在设备选择框里选，不在这里 */
const QUERY_NAMES: Partial<Record<DevicePermission, string>> = {
  location: 'geolocation',
  fuzzyLocation: 'geolocation',
  camera: 'camera',
  microphone: 'microphone',
};

async function status(name: DevicePermission): Promise<DevicePermissionState> {
  if (name === 'album') return 'granted';
  if (name === 'bluetooth') return 'bluetooth' in navigator ? 'prompt' : 'unsupported';
  // Safari 16 之前没有 Permissions API；查不了的名字（旧版 Firefox 的 camera）会抛错：都当作还没问过
  try {
    const result = await navigator.permissions.query({ name: QUERY_NAMES[name] } as never);
    return result.state;
  } catch {
    return 'prompt';
  }
}

/** 调一次对应的能力，让浏览器弹出授权 */
async function ask(name: DevicePermission): Promise<DevicePermissionState> {
  if (name === 'location' || name === 'fuzzyLocation') {
    try {
      await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: Infinity }),
      );
      return 'granted';
    } catch (error) {
      return (error as GeolocationPositionError).code === 1 ? 'denied' : status(name);
    }
  }
  if (name === 'camera' || name === 'microphone') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        name === 'camera' ? { video: true } : { audio: true },
      );
      for (const track of stream.getTracks()) track.stop();
      return 'granted';
    } catch (error) {
      return (error as DOMException).name === 'NotAllowedError' ? 'denied' : status(name);
    }
  }
  return status(name);
}

export const webPermissions: HostPermissions = {
  status,
  async request(name) {
    const current = await status(name);
    return current === 'prompt' ? ask(name) : current;
  },
  openSettings: status,
};

/** localStorage 在隐私模式、禁用存储时会抛错：读不到当作没有，写不进去就算了 */
export const webStorage: HostStorage = {
  get<T>(key: string) {
    try {
      const text = localStorage.getItem(key);
      return text === null ? undefined : (JSON.parse(text) as T);
    } catch {
      return undefined;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 存储满了或被禁用
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // 同上
    }
  },
  keys() {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
};

/** 微信内置浏览器注入的桥 */
interface WeixinJSBridge {
  invoke(
    name: 'getBrandWCPayRequest',
    params: Record<string, string>,
    callback: (result: { err_msg: string }) => void,
  ): void;
}

/** 微信内置浏览器的 JSAPI 支付：结果按 err_msg 的后缀判断（ok、cancel，其余是失败） */
function payInWeChat(order: Extract<PaymentOrder, { provider: 'wechat' }>) {
  const bridge = (globalThis as { WeixinJSBridge?: WeixinJSBridge }).WeixinJSBridge;
  if (!bridge)
    throw new Error(
      '微信支付在 H5 里只能在微信内置浏览器中调起；其它浏览器请用 redirect（H5 支付）',
    );
  if (!order.appId) throw new Error('微信内 H5 支付（JSAPI）要带 appId');
  const { provider: _, ...params } = order;
  return new Promise<PaymentResult>((resolve) =>
    bridge.invoke('getBrandWCPayRequest', params as Record<string, string>, (result) => {
      const outcome = result.err_msg.split(':').at(-1);
      resolve({
        status: outcome === 'ok' ? 'success' : outcome === 'cancel' ? 'cancel' : 'fail',
        raw: result,
      });
    }),
  );
}

export const webCapabilities = {
  permissions: webPermissions,
  storage: webStorage,
  login(): Promise<LoginResult> {
    return Promise.reject(
      new Error('H5 没有平台登录：在 ConfigProvider 的 host 里给出 login 的实现（跳转 OAuth 等）'),
    );
  },
  async pay(order: PaymentOrder): Promise<PaymentResult> {
    if (order.provider === 'wechat') return payInWeChat(order);
    if (order.provider === 'alipay')
      throw new Error('tradeNO 只能在支付宝小程序里调起；H5 用 redirect（手机网站支付的地址）');
    // 跳走之后页面就没了；从支付页回来时由应用去后端查单
    location.href = order.url;
    return { status: 'pending' };
  },
  async subscribe(templateIds: string[]): Promise<Record<string, SubscribeState>> {
    return Object.fromEntries(templateIds.map((id) => [id, 'unsupported' as const]));
  },
  phoneNumber(): Promise<PhoneNumberResult> {
    return Promise.reject(new Error('H5 没有平台的手机号授权，用短信验证码'));
  },
  // 隐私协议只有微信小程序有
  onPrivacyRequest: (_listener: (reply: PrivacyReply) => void) => () => {},
  openPrivacyContract: () => Promise.resolve(),
};

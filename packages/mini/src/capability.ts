/**
 * 宿主约定里授权类能力的小程序实现：设备权限、存储、登录、支付、订阅消息、手机号、隐私协议。
 * 形状以组件库的 Host 为准（mobile 的 capability/types.ts），两边互不导入。
 *
 * 平台接口按官方文档对照（2026-10 核对）：
 * - 微信：getSetting / authorize / openSetting 的 scope；requestPayment；requestSubscribeMessage（tmplIds）；
 *   onNeedPrivacyAuthorization（resolve 的 event 为 agree / disagree，同意时带按钮 id）；手机号按钮的 detail.code
 * - 支付宝：getSetting 的 authSetting 键（location、camera、album）；没有提前申请的接口，授权在第一次调用能力时弹出；
 *   tradePay 的 resultCode（9000 成功，8000 / 6004 结果未知，6001 取消）；requestSubscribeMessage（entityIds）；
 *   getAuthCode 的 scopes（auth_base / auth_user）；手机号要先点 getAuthorize 按钮再调 getPhoneNumber
 */

type Callback<T> = { success?: (result: T) => void; fail?: (error: unknown) => void };
type Settings = { authSetting: Record<string, boolean | undefined> };

/** 用到的平台接口（两端名字相同、参数不同的按各自的写法调用） */
export interface CapabilityApi {
  getSetting?(options: Callback<Settings>): void;
  openSetting?(options: Callback<Settings>): void;
  authorize?(options: { scope: string } & Callback<unknown>): void;
  getStorageSync?(key: unknown): unknown;
  setStorageSync?(key: unknown, data?: unknown): void;
  removeStorageSync?(key: unknown): void;
  getStorageInfoSync?(): { keys: string[] };
  login?(options: Callback<{ code: string }>): void;
  getAuthCode?(options: { scopes: string } & Callback<{ authCode: string }>): void;
  requestPayment?(options: Record<string, string> & Callback<unknown>): void;
  tradePay?(options: { tradeNO: string } & Callback<{ resultCode: string }>): void;
  requestSubscribeMessage?(
    options: { tmplIds?: string[]; entityIds?: string[] } & Callback<Record<string, unknown>>,
  ): void;
  getPhoneNumber?(options: Callback<{ response: string }>): void;
  onNeedPrivacyAuthorization?(
    listener: (
      resolve: (result: { event: 'agree' | 'disagree'; buttonId?: string }) => void,
    ) => void,
  ): void;
  openPrivacyContract?(options: Callback<unknown>): void;
}

type PermissionName =
  'location' | 'fuzzyLocation' | 'camera' | 'microphone' | 'album' | 'bluetooth';
type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';
type PaymentOrder =
  | { provider: 'wechat'; [field: string]: string }
  | { provider: 'alipay'; tradeNO: string }
  | { provider: 'redirect'; url: string };
type PaymentStatus = 'success' | 'cancel' | 'pending' | 'fail';

/** 设备权限 → 微信的 scope */
const WX_SCOPES: Record<PermissionName, string> = {
  location: 'scope.userLocation',
  fuzzyLocation: 'scope.userFuzzyLocation',
  camera: 'scope.camera',
  microphone: 'scope.record',
  album: 'scope.writePhotosAlbum',
  bluetooth: 'scope.bluetooth',
};

/** 设备权限 → 支付宝 authSetting 的键；麦克风、蓝牙没有查到可靠的键名，按"用到时再问"处理 */
const MY_SCOPES: Partial<Record<PermissionName, string>> = {
  location: 'location',
  fuzzyLocation: 'location',
  camera: 'camera',
  album: 'album',
};

/** 回调式接口转 Promise；接口不存在时报出名字 */
function call<T>(
  api: CapabilityApi,
  name: keyof CapabilityApi,
  options: Record<string, unknown> = {},
): Promise<T> {
  const method = api[name] as ((options: Record<string, unknown>) => void) | undefined;
  if (!method) return Promise.reject(new Error(`当前平台没有 ${name}`));
  return new Promise((resolve, reject) =>
    method.call(api, { ...options, success: resolve, fail: reject }),
  );
}

const stateOf = (value: boolean | undefined): PermissionState =>
  value === true ? 'granted' : value === false ? 'denied' : 'prompt';

/** 支付宝 tradePay 的结果码 */
const ALIPAY_RESULTS: Record<string, PaymentStatus> = {
  '9000': 'success',
  '8000': 'pending',
  '6004': 'pending',
  '6001': 'cancel',
};

/** 隐私协议：平台一个回调，页面里可能有多个监听（每个页面的弹窗） */
const privacyListeners = new Set<(reply: (agreed: boolean, buttonId?: string) => void) => void>();
let privacyHooked = false;

function hookPrivacy(api: CapabilityApi) {
  if (privacyHooked || !api.onNeedPrivacyAuthorization) return;
  privacyHooked = true;
  api.onNeedPrivacyAuthorization((resolve) => {
    let answered = false;
    const reply = (agreed: boolean, buttonId?: string) => {
      if (answered) return;
      answered = true;
      resolve(agreed ? { event: 'agree', buttonId } : { event: 'disagree' });
    };
    // 没有弹窗接手时回复不同意，否则被拦下的接口一直等着
    if (!privacyListeners.size) return reply(false);
    for (const listener of privacyListeners) listener(reply);
  });
}

/** 授权类能力；current 不在小程序里（测试）时，用到才报错 */
export function createCapabilities(current: { name: 'wx' | 'my'; api: CapabilityApi } | undefined) {
  const api = () => {
    if (!current) throw new Error('不在小程序里：宿主能力不可用');
    return current.api;
  };
  const scopeOf = (name: PermissionName) =>
    current?.name === 'my' ? MY_SCOPES[name] : WX_SCOPES[name];

  const status = async (name: PermissionName): Promise<PermissionState> => {
    const scope = scopeOf(name);
    if (!scope) return 'prompt';
    const { authSetting } = await call<Settings>(api(), 'getSetting');
    return stateOf(authSetting[scope]);
  };

  // 微信的存储能存任意值，支付宝的要包成 { key, data }：都存 JSON 文本，与 H5 一致
  const isWx = () => current?.name !== 'my';
  const storage = {
    get<T>(key: string): T | undefined {
      const raw = isWx()
        ? api().getStorageSync?.(key)
        : (api().getStorageSync?.({ key }) as { data?: unknown } | undefined)?.data;
      if (typeof raw !== 'string' || raw === '') return undefined;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    },
    set(key: string, value: unknown) {
      const data = JSON.stringify(value);
      if (isWx()) api().setStorageSync?.(key, data);
      else api().setStorageSync?.({ key, data });
    },
    remove(key: string) {
      api().removeStorageSync?.(isWx() ? key : { key });
    },
    keys: () => api().getStorageInfoSync?.().keys ?? [],
  };

  return {
    permissions: {
      status,
      async request(name: PermissionName): Promise<PermissionState> {
        const current = await status(name);
        if (current !== 'prompt' || !isWx()) return current;
        try {
          await call(api(), 'authorize', { scope: WX_SCOPES[name] });
          return 'granted';
        } catch {
          return status(name);
        }
      },
      async openSettings(name: PermissionName): Promise<PermissionState> {
        const scope = scopeOf(name);
        const { authSetting } = await call<Settings>(api(), 'openSetting');
        return scope ? stateOf(authSetting[scope]) : 'prompt';
      },
    },
    storage,
    async login(options?: { scope?: 'base' | 'user' }) {
      if (isWx()) {
        const { code } = await call<{ code: string }>(api(), 'login');
        return { platform: 'wx' as const, code };
      }
      const { authCode } = await call<{ authCode: string }>(api(), 'getAuthCode', {
        scopes: options?.scope === 'user' ? 'auth_user' : 'auth_base',
      });
      return { platform: 'my' as const, code: authCode };
    },
    async pay(order: PaymentOrder): Promise<{ status: PaymentStatus; raw?: unknown }> {
      if (order.provider === 'wechat' && isWx()) {
        const { provider: _, appId: __, ...params } = order;
        try {
          return { status: 'success', raw: await call(api(), 'requestPayment', params) };
        } catch (error) {
          const message = (error as { errMsg?: string }).errMsg ?? '';
          return { status: message.includes('cancel') ? 'cancel' : 'fail', raw: error };
        }
      }
      if (order.provider === 'alipay' && !isWx()) {
        const result = await call<{ resultCode: string }>(api(), 'tradePay', {
          tradeNO: order.tradeNO,
        });
        return { status: ALIPAY_RESULTS[result.resultCode] ?? 'fail', raw: result };
      }
      throw new Error(`${current?.name ?? '小程序'} 里不能用 ${order.provider} 方式支付`);
    },
    async subscribe(templateIds: string[]) {
      if (isWx()) {
        const result = await call<Record<string, unknown>>(api(), 'requestSubscribeMessage', {
          tmplIds: templateIds,
        });
        return Object.fromEntries(
          templateIds.map((id) => {
            const value = result[id];
            return [id, value === 'accept' || value === 'ban' ? value : 'reject'];
          }),
        );
      }
      // 支付宝返回已订阅的模板（含以前订阅过的）
      const result = await call<{ result?: { subscribeEntityIds?: string[] } }>(
        api(),
        'requestSubscribeMessage',
        { entityIds: templateIds },
      );
      const accepted = new Set(result.result?.subscribeEntityIds ?? []);
      return Object.fromEntries(
        templateIds.map((id) => [id, accepted.has(id) ? 'accept' : 'reject']),
      );
    },
    async phoneNumber(detail: unknown) {
      if (isWx()) {
        const { code, errMsg } = (detail ?? {}) as { code?: string; errMsg?: string };
        if (!code) throw new Error(errMsg ?? '用户没有同意手机号授权');
        return { platform: 'wx' as const, code };
      }
      const { response } = await call<{ response: string }>(api(), 'getPhoneNumber');
      return { platform: 'my' as const, response };
    },
    onPrivacyRequest(listener: (reply: (agreed: boolean, buttonId?: string) => void) => void) {
      if (current) hookPrivacy(current.api);
      privacyListeners.add(listener);
      return () => privacyListeners.delete(listener);
    },
    async openPrivacyContract() {
      await call(api(), 'openPrivacyContract');
    },
  };
}

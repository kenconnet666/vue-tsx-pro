/**
 * 宿主能力里与用户授权有关的部分（设备权限、存储、登录、支付、订阅消息、隐私协议）的类型。
 * 三端的差异见 MOBILE.md §12；接口挂在 Host 上（utils/host.ts），H5 的实现在 capability/web.ts，小程序的在 mini 包里
 */

/**
 * 设备权限：
 * location 精确位置、fuzzyLocation 模糊位置（微信里两者在 app.json 的声明互斥，二选一）、camera 相机、microphone 麦克风、
 * album 保存到相册、bluetooth 蓝牙
 */
export type DevicePermission =
  'location' | 'fuzzyLocation' | 'camera' | 'microphone' | 'album' | 'bluetooth';

/**
 * 权限状态：granted 已同意；denied 拒绝过（不会再弹系统授权，只能去设置页打开）；
 * prompt 还没问过（用到时会弹）；unsupported 这一端没有这项能力
 */
export type DevicePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** 设备权限 */
export interface HostPermissions {
  /** 查状态，不弹窗 */
  status(name: DevicePermission): Promise<DevicePermissionState>;
  /**
   * 申请：没问过时弹系统授权，返回之后的状态；拒绝过的直接返回 denied（引导去设置页由 usePermission 做）。
   * 支付宝没有提前申请的接口，授权在第一次调用对应能力时弹出，这里返回 prompt
   */
  request(name: DevicePermission): Promise<DevicePermissionState>;
  /** 打开小程序的设置页，用户改完回来后返回该权限的新状态；H5 不能代开浏览器设置，返回当前状态 */
  openSettings(name: DevicePermission): Promise<DevicePermissionState>;
}

/** 本地存储：值按 JSON 存取，同步读写（三端都有同步接口） */
export interface HostStorage {
  /** 读；没有或解析不了时 undefined */
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  /** 全部的键 */
  keys(): string[];
}

/** 登录：拿平台的一次性凭证，交给后端换会话（组件库不碰密钥） */
export interface LoginOptions {
  /**
   * 支付宝的授权范围：base 静默（只拿用户标识），user 要用户同意（会员基础信息）。微信与 H5 忽略
   * @default 'base'
   */
  scope?: 'base' | 'user';
}

/** 登录凭证：微信 wx.login 的 code，支付宝 my.getAuthCode 的 authCode，H5 是应用自己的实现给的 */
export interface LoginResult {
  platform: 'web' | 'app' | 'wx' | 'my';
  code: string;
}

/**
 * 支付参数，按后端下单的结果填：
 * - wechat：微信支付（小程序 wx.requestPayment；微信内的 H5 走 JSAPI，要加 appId）
 * - alipay：支付宝小程序 my.tradePay 的交易号
 * - redirect：H5 在微信、支付宝之外的浏览器里，跳到支付页（微信 H5 支付的 mweb_url、支付宝手机网站支付的地址）
 */
export type PaymentOrder =
  | {
      provider: 'wechat';
      timeStamp: string;
      nonceStr: string;
      /** prepay_id=… */
      package: string;
      signType: 'MD5' | 'HMAC-SHA256' | 'RSA';
      paySign: string;
      /** 微信内 H5（JSAPI）必填；小程序里不用 */
      appId?: string;
    }
  | { provider: 'alipay'; tradeNO: string }
  | { provider: 'redirect'; url: string };

/**
 * 支付结果。success 也只是前端看到的结果，发货前要以后端查单为准；pending 是结果未知或处理中（支付宝 8000、6004，
 * H5 跳走之后），一定要去后端查
 */
export interface PaymentResult {
  status: 'success' | 'cancel' | 'pending' | 'fail';
  /** 平台的原始结果码或信息，排查用 */
  raw?: unknown;
}

/** 订阅消息每个模板的结果：accept 同意、reject 拒绝、ban 被后台封禁、unsupported 这一端没有 */
export type SubscribeState = 'accept' | 'reject' | 'ban' | 'unsupported';

/** 手机号授权按钮的结果，原样交给后端：微信给 code（后端换号码），支付宝给加密的 response（后端解密） */
export interface PhoneNumberResult {
  platform: 'wx' | 'my';
  code?: string;
  response?: string;
}

/** 隐私协议的回复：同意时带上点的按钮的 id（微信要用它确认是用户点了同意按钮） */
export type PrivacyReply = (agreed: boolean, buttonId?: string) => void;

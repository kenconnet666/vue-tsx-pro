import type { StorageDriver } from '../driver.ts';
import { textDriver, type TextDriverOptions, type TextStore } from './text-store.ts';

/**
 * 小程序存储的同步接口。两种写法：
 * - 'wx'：参数按位置给（微信、抖音 tt、QQ、百度 swan、快手 ks、京东 jd，以及 uni、Taro 的同名封装）
 * - 'my'：参数包成 `{ key, data }`、读到的是 `{ data }`（支付宝、钉钉 dd）
 */
export interface MiniProgramStorageApi {
  getStorageSync(key: unknown): unknown;
  setStorageSync(key: unknown, data?: unknown): void;
  removeStorageSync(key: unknown): void;
  getStorageInfoSync(): { keys: string[] };
  clearStorageSync(): void;
}

/** miniProgramDriver 的选项 */
export interface MiniProgramDriverOptions extends TextDriverOptions {
  /** 平台的接口对象（wx、my、tt、uni…）；默认按全局对象找，先找到哪个用哪个 */
  api?: MiniProgramStorageApi;
  /** 接口的写法；给了 api 时默认 'wx'，没给时按找到的全局对象定 */
  style?: 'wx' | 'my';
}

/** 默认找的全局对象与写法：支付宝、钉钉是 'my' 写法，其余是 'wx' 写法 */
const PLATFORMS = [
  ['wx', 'wx'],
  ['my', 'my'],
  ['tt', 'wx'],
  ['qq', 'wx'],
  ['swan', 'wx'],
  ['ks', 'wx'],
  ['jd', 'wx'],
  ['dd', 'my'],
] as const;

// 支付宝的逻辑层跑在 Worker 里，旧环境没有 globalThis（同 mini 包的 globals.ts）
const scope = (
  typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : {}
) as Record<string, unknown>;

function detect(): { api: MiniProgramStorageApi; style: 'wx' | 'my' } {
  for (const [platform, style] of PLATFORMS) {
    const api = scope[platform] as Partial<MiniProgramStorageApi> | undefined;
    if (typeof api?.getStorageSync === 'function')
      return { api: api as MiniProgramStorageApi, style };
  }
  throw new Error('no mini program storage API (wx, my, tt…) found on the global object');
}

/**
 * 小程序存储的驱动：同步接口包成异步，值经 codec 写成文字（默认 JSON），与 mobile 组件库的 useStorage、
 * mini 运行时的宿主存储同一种格式，两边读得到彼此写的值。没有跨实例的通知（一个小程序只有一个逻辑层），没有 watch。
 *
 *   const cache = createCache(miniProgramDriver({ prefix: 'app:' }));
 *
 * 容量（2026-10 官方文档）：微信单个键 1MB、总共 10MB；支付宝单条 200KB、同一用户同一小程序总共 10MB。超出时 set 以带键名的错误失败。
 * 官方建议启动时不要大量同步读写，大数据别放这里。
 */
export function miniProgramDriver(options: MiniProgramDriverOptions = {}): StorageDriver {
  const open = (): TextStore => {
    // 第一次读写时才找全局对象：在 H5、服务端渲染里建驱动不报错
    const detected = options.api ? { api: options.api, style: 'wx' as const } : detect();
    const { api } = detected;
    const style = options.style ?? detected.style;
    const keyArg = (key: string) => (style === 'my' ? { key } : key);
    return {
      read(key) {
        try {
          const raw =
            style === 'my'
              ? (api.getStorageSync({ key }) as { data?: unknown } | undefined)?.data
              : api.getStorageSync(key);
          // 微信没有这个键时给 ''；我们写进去的都是编码过的文字（空字符串编码后也不是 ''），别人直接存的对象读不了
          return typeof raw === 'string' && raw !== '' ? raw : undefined;
        } catch {
          // 支付宝没有这个键时可能报错（错误码 11）
          return undefined;
        }
      },
      write(key, text) {
        if (style === 'my') api.setStorageSync({ key, data: text });
        else api.setStorageSync(key, text);
      },
      remove: (key) => api.removeStorageSync(keyArg(key)),
      keys: () => api.getStorageInfoSync().keys,
      clear: () => api.clearStorageSync(),
    };
  };

  const { prefix } = options;
  return textDriver(prefix ? `miniProgram(${prefix})` : 'miniProgram', open, options);
}

/**
 * 原生应用（Capacitor 的 iOS / Android 外壳）里的宿主能力：页面跑在系统 WebView 里，DOM、测量、滚动照常用浏览器的，
 * 设备权限、存储、震动、剪贴板、选图换成官方插件（原生的授权弹窗、不会被系统清掉的存储）。
 * 子路径 @zerodep-dev/vue-tsx-pro-mobile/capacitor，插件是可选的 peer 依赖，做原生应用时才装。
 *
 *   // main.ts：在原生外壳里才加载（H5 的包里不带插件）
 *   if (window.Capacitor?.isNativePlatform()) {
 *     const { createCapacitorHost } = await import('@zerodep-dev/vue-tsx-pro-mobile/capacitor');
 *     app.provide(HOST_KEY, await createCapacitorHost());
 *   }
 *
 * 插件接口按 Capacitor 8 的官方文档（2026-10）：Geolocation、Camera 的 checkPermissions / requestPermissions 返回
 * granted、denied、prompt、prompt-with-rationale（相机的还有 limited）；Preferences 是异步的键值存储，启动时整个读进内存，之后同步读、写穿透。
 */
import { App } from '@capacitor/app';
import { Camera } from '@capacitor/camera';
import { Clipboard } from '@capacitor/clipboard';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import type { DevicePermission, DevicePermissionState, HostStorage } from '../capability/types';
import { webPermissions } from '../capability/web';
import { webHost, type Host } from '../utils/host';

/**
 * 插件的权限状态；prompt-with-rationale 是安卓上拒绝过一次、还能再问（要先说明用途），
 * limited 是 iOS 只允许访问部分照片（选图照常能用，算同意）
 */
type PluginState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited';

const stateOf = (state: PluginState | undefined): DevicePermissionState =>
  state === 'granted' || state === 'limited' ? 'granted' : state === 'denied' ? 'denied' : 'prompt';

/** 设备权限 → 插件与它的权限名；麦克风没有官方插件，走 WebView 的 getUserMedia（外壳会转成系统授权） */
async function status(name: DevicePermission): Promise<DevicePermissionState> {
  switch (name) {
    case 'location':
      return stateOf((await Geolocation.checkPermissions()).location);
    case 'fuzzyLocation':
      return stateOf((await Geolocation.checkPermissions()).coarseLocation);
    case 'camera':
      return stateOf((await Camera.checkPermissions()).camera);
    case 'album':
      return stateOf((await Camera.checkPermissions()).photos);
    case 'microphone':
      return webPermissions.status(name);
    case 'bluetooth':
      // 要社区插件（@capacitor-community/bluetooth-le），默认不带
      return 'unsupported';
  }
}

async function request(name: DevicePermission): Promise<DevicePermissionState> {
  switch (name) {
    case 'location':
      return stateOf(
        (await Geolocation.requestPermissions({ permissions: ['location'] })).location,
      );
    case 'fuzzyLocation':
      return stateOf(
        (await Geolocation.requestPermissions({ permissions: ['coarseLocation'] })).coarseLocation,
      );
    case 'camera':
      return stateOf((await Camera.requestPermissions({ permissions: ['camera'] })).camera);
    case 'album':
      return stateOf((await Camera.requestPermissions({ permissions: ['photos'] })).photos);
    case 'microphone':
      return webPermissions.request(name);
    case 'bluetooth':
      return 'unsupported';
  }
}

/** Preferences 整个读进内存：组件按同步接口读；写的时候同时写回原生存储 */
async function preferencesStorage(): Promise<HostStorage> {
  const { keys } = await Preferences.keys();
  const values = new Map<string, string>();
  await Promise.all(
    keys.map(async (key) => {
      const { value } = await Preferences.get({ key });
      if (value !== null) values.set(key, value);
    }),
  );
  return {
    get<T>(key: string) {
      const text = values.get(key);
      if (text === undefined) return undefined;
      try {
        return JSON.parse(text) as T;
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      const text = JSON.stringify(value);
      values.set(key, text);
      void Preferences.set({ key, value: text });
    },
    remove(key) {
      values.delete(key);
      void Preferences.remove({ key });
    },
    keys: () => [...values.keys()],
  };
}

let backButtonHooked = false;

/**
 * 原生应用的宿主能力：在浏览器的实现上换掉设备权限、存储、震动、剪贴板、选图；
 * 顺带接上安卓的返回键（页面能后退就后退，到头了退出应用）。只在原生外壳里调用
 */
export async function createCapacitorHost(): Promise<Host> {
  if (!backButtonHooked) {
    backButtonHooked = true;
    void App.addListener('backButton', ({ canGoBack }) =>
      canGoBack ? history.back() : void App.exitApp(),
    );
  }
  return {
    ...webHost,
    platform: 'app',
    permissions: {
      status,
      async request(name) {
        const current = await status(name);
        return current === 'prompt' ? request(name) : current;
      },
      // 官方插件没有打开系统设置页的接口：返回当前状态，引导由 usePermission 说明
      openSettings: status,
    },
    storage: await preferencesStorage(),
    vibrate() {
      void Haptics.impact({ style: ImpactStyle.Light });
    },
    copy: (text) => Clipboard.write({ string: text }),
    async chooseImages({ count }) {
      const { photos } = await Camera.pickImages({ limit: count });
      // webPath 能直接作为 img 的地址；上传要 File，从它取回内容
      return Promise.all(
        photos.map(async (photo, index) => {
          const blob = await fetch(photo.webPath).then((response) => response.blob());
          const file = new File([blob], `photo-${index}.${photo.format}`, { type: blob.type });
          return { url: photo.webPath, size: blob.size, file };
        }),
      );
    },
  };
}

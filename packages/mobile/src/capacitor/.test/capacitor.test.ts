// 原生应用的宿主能力：插件的权限状态映射（含 limited、prompt-with-rationale）、Preferences 预读与写穿透、选图、返回键
import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugins = vi.hoisted(() => {
  const store = new Map<string, string>([['history', '["咖啡"]']]);
  return {
    store,
    geolocation: { location: 'denied', coarseLocation: 'prompt-with-rationale' },
    camera: { camera: 'prompt', photos: 'limited' },
    backButton: undefined as undefined | ((event: { canGoBack: boolean }) => void),
    exitApp: vi.fn(),
  };
});

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: async () => plugins.geolocation,
    requestPermissions: async () => ({ ...plugins.geolocation, coarseLocation: 'granted' }),
  },
}));
vi.mock('@capacitor/camera', () => ({
  Camera: {
    checkPermissions: async () => plugins.camera,
    requestPermissions: async () => ({ ...plugins.camera, camera: 'granted' }),
    pickImages: async () => ({ photos: [{ webPath: 'blob:photo-1', format: 'jpeg' }] }),
  },
}));
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    keys: async () => ({ keys: [...plugins.store.keys()] }),
    get: async ({ key }: { key: string }) => ({ value: plugins.store.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) =>
      void plugins.store.set(key, value),
    remove: async ({ key }: { key: string }) => void plugins.store.delete(key),
  },
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (_name: string, listener: typeof plugins.backButton) =>
      (plugins.backButton = listener),
    exitApp: plugins.exitApp,
  },
}));
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn() },
  ImpactStyle: { Light: 'LIGHT' },
}));
vi.mock('@capacitor/clipboard', () => ({ Clipboard: { write: vi.fn(async () => {}) } }));

const { createCapacitorHost } = await import('../index');

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(new Blob(['image'], { type: 'image/jpeg' }))),
  );
});

describe('createCapacitorHost', () => {
  it('权限：插件状态映射成四种（limited 算同意，prompt-with-rationale 算还能问）；没问过的才申请；蓝牙没有插件', async () => {
    const host = await createCapacitorHost();
    expect(host.platform).toBe('app');
    expect(await host.permissions.status('location')).toBe('denied');
    expect(await host.permissions.status('album')).toBe('granted');
    expect(await host.permissions.status('fuzzyLocation')).toBe('prompt');
    expect(await host.permissions.request('fuzzyLocation')).toBe('granted');
    expect(await host.permissions.request('camera')).toBe('granted');
    expect(await host.permissions.request('location')).toBe('denied');
    expect(await host.permissions.status('bluetooth')).toBe('unsupported');
  });

  it('存储：启动时读进内存，同步读；写的同时写回 Preferences', async () => {
    const host = await createCapacitorHost();
    expect(host.storage.get('history')).toEqual(['咖啡']);
    host.storage.set('count', 3);
    expect(host.storage.get('count')).toBe(3);
    await Promise.resolve();
    expect(plugins.store.get('count')).toBe('3');
    host.storage.remove('history');
    expect(host.storage.keys()).toEqual(['count']);
  });

  it('选图给出可显示的地址与上传用的 File；安卓返回键到头时退出应用', async () => {
    const host = await createCapacitorHost();
    const [image] = await host.chooseImages({ count: 1 });
    expect(image!.url).toBe('blob:photo-1');
    expect(image!.file?.name).toBe('photo-0.jpeg');
    plugins.backButton?.({ canGoBack: false });
    expect(plugins.exitApp).toHaveBeenCalled();
  });
});

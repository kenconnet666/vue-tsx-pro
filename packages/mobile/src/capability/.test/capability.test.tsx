// 授权类能力：usePermission 的申请与拒绝后的引导、useStorage 写回、ConfigProvider 换掉宿主能力、
// 开放能力按钮只在小程序里带属性、隐私协议弹窗的同意与拒绝
import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { Button } from '../../base/Button';
import { ConfigProvider } from '../../config/ConfigProvider';
import { useHost, webHost, type Host } from '../../utils/host';
import { mount } from '../../utils/.test/mount';
import { WithHost } from '../../utils/.test/touch';
import type { HostPermissions, PrivacyReply } from '../types';
import { usePermission, type PermissionHandle } from '../usePermission';
import { useStorage } from '../useStorage';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"], [role="dialog"]');

/** 挂一个组件拿到组合函数的返回值 */
function withHost<T>(host: Partial<Host>, use: () => T): T {
  let result!: T;
  const Probe = () => {
    result = use();
    return null;
  };
  mount(() => (
    <ConfigProvider>
      <WithHost host={host}>
        <Probe />
      </WithHost>
    </ConfigProvider>
  ));
  return result;
}

describe('usePermission', () => {
  it('查到状态；没问过时申请，同意返回 true', async () => {
    let state: 'prompt' | 'granted' = 'prompt';
    const permissions: HostPermissions = {
      status: async () => state,
      request: async () => (state = 'granted'),
      openSettings: async () => state,
    };
    const camera = withHost<PermissionHandle>({ platform: 'wx', permissions }, () =>
      usePermission('camera'),
    );
    await wait();
    expect(camera.status.value).toBe('prompt');
    expect(await camera.request()).toBe(true);
    expect(camera.status.value).toBe('granted');
  });

  it('申请后仍是 prompt（平台用到时自己问，如支付宝的相机）：返回 true，照常去用', async () => {
    const permissions: HostPermissions = {
      status: async () => 'prompt',
      request: async () => 'prompt',
      openSettings: async () => 'prompt',
    };
    const camera = withHost({ platform: 'my', permissions }, () => usePermission('camera'));
    expect(await camera.request()).toBe(true);
    expect(dialog()).toBeNull();
  });

  it('拒绝过：小程序里问要不要去设置页，确认后按设置页回来的状态', async () => {
    const openSettings = vi.fn(async () => 'granted' as const);
    const permissions: HostPermissions = {
      status: async () => 'denied',
      request: async () => 'denied',
      openSettings,
    };
    const location = withHost({ platform: 'wx', permissions }, () => usePermission('location'));
    const granted = location.request();
    await wait();
    await nextTick();
    expect(dialog()!.textContent).toContain('位置');
    const buttons = dialog()!.querySelectorAll('button');
    buttons[buttons.length - 1]!.click();
    expect(await granted).toBe(true);
    expect(openSettings).toHaveBeenCalledWith('location');
  });
});

describe('useStorage 与 ConfigProvider 的 host', () => {
  it('读存储里的值（没有用默认值），整个换掉时写回', async () => {
    const store = new Map<string, unknown>([['history', ['咖啡']]]);
    const storage = {
      get: <T,>(key: string) => store.get(key) as T | undefined,
      set: (key: string, value: unknown) => void store.set(key, value),
      remove: (key: string) => void store.delete(key),
      keys: () => [...store.keys()],
    };
    const [history, count] = withHost({ storage }, () => [
      useStorage<string[]>('history', []),
      useStorage('count', 0),
    ]);
    expect(history.value).toEqual(['咖啡']);
    expect(count.value).toBe(0);
    history.value = ['茶', ...history.value];
    await nextTick();
    expect(store.get('history')).toEqual(['茶', '咖啡']);
  });

  it('最外层 ConfigProvider 把主题告诉宿主，换主题时再告诉一次', async () => {
    const themeChanged = vi.fn();
    const settings = reactive({ theme: 'light' as 'light' | 'dark' });
    mount(() => (
      <WithHost host={{ themeChanged }}>
        <ConfigProvider theme={settings.theme}>
          <ConfigProvider theme="dark">内层</ConfigProvider>
        </ConfigProvider>
      </WithHost>
    ));
    settings.theme = 'dark';
    await nextTick();
    expect(themeChanged.mock.calls).toEqual([['light'], ['dark']]);
  });

  it('ConfigProvider 的 host 补上 H5 的登录，其余能力照旧', async () => {
    let host!: Host;
    const Probe = () => {
      host = useHost();
      return null;
    };
    const login = async () => ({ platform: 'web' as const, code: 'oauth' });
    mount(() => (
      <ConfigProvider host={{ login }}>
        <Probe />
      </ConfigProvider>
    ));
    expect(await host.login()).toEqual({ platform: 'web', code: 'oauth' });
    expect(host.storage).toBe(webHost.storage);
  });
});

describe('开放能力按钮', () => {
  it('H5 里不带 open-type；小程序里带上，opentype 事件交出 detail', () => {
    const onOpenType = vi.fn();
    const web = mount(() => (
      <Button openType="getPhoneNumber" onOpenType={onOpenType}>
        手机号登录
      </Button>
    ));
    expect(web.querySelector('button')!.hasAttribute('open-type')).toBe(false);

    const mini = mount(() => (
      <WithHost host={{ platform: 'wx' }}>
        <Button openType="getPhoneNumber" onOpenType={onOpenType}>
          手机号登录
        </Button>
      </WithHost>
    ));
    const button = mini.querySelector('button')!;
    expect(button.getAttribute('open-type')).toBe('getPhoneNumber');
    button.dispatchEvent(Object.assign(new Event('opentype'), { detail: { code: 'p1' } }));
    expect(onOpenType).toHaveBeenCalledWith({ code: 'p1' });
  });
});

describe('隐私协议', () => {
  it('平台要求同意时弹出；点同意（开放能力按钮）回复同意并带按钮 id，点拒绝回复不同意', async () => {
    let request!: (reply: PrivacyReply) => void;
    const host: Partial<Host> = {
      platform: 'wx',
      onPrivacyRequest: (listener) => {
        request = listener;
        return () => {};
      },
    };
    mount(() => (
      <WithHost host={host}>
        <ConfigProvider>页面</ConfigProvider>
      </WithHost>
    ));
    const reply = vi.fn();
    request(reply);
    await nextTick();
    const agree = document.querySelector<HTMLElement>('[open-type="agreePrivacyAuthorization"]')!;
    expect(dialog()!.textContent).toContain('隐私保护指引');
    agree.dispatchEvent(new Event('opentype'));
    expect(reply).toHaveBeenCalledWith(true, agree.id);

    const second = vi.fn();
    request(second);
    await nextTick();
    [...dialog()!.querySelectorAll('button')]
      .find((button) => button.textContent === '拒绝')!
      .click();
    expect(second).toHaveBeenCalledWith(false, undefined);
  });
});

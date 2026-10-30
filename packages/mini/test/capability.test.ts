// 授权类能力：设备权限、存储、登录、支付、订阅消息、手机号、隐私协议按两端的接口调用与映射；开放能力按钮；app.json 的声明
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { wechatAppFields } from '../src/build/app.ts';
import { baseTemplate } from '../src/build/templates.ts';
import { PLATFORMS } from '../src/build/platforms.ts';
import { createCapabilities, type CapabilityApi } from '../src/capability.ts';
import { mountPage } from '../src/testing.ts';

/** 假的平台接口：按名字给出 success 的结果，或用 fail 抛出 */
function fakeApi(results: Record<string, unknown>, failures: Record<string, unknown> = {}) {
  const calls: [string, unknown][] = [];
  const api = new Proxy({} as CapabilityApi, {
    get: (_, name: string) => {
      if (name.endsWith('Sync')) return results[name];
      if (!(name in results) && !(name in failures)) return undefined;
      return (options: { success?: (r: unknown) => void; fail?: (e: unknown) => void }) => {
        calls.push([name, options]);
        if (name in failures) options.fail?.(failures[name]);
        else options.success?.(results[name]);
      };
    },
  });
  return { api, calls };
}

describe('设备权限', () => {
  it('微信：getSetting 的 scope 映射成四种状态；没问过时 authorize，拒绝后查回 denied；设置页回来看新状态', async () => {
    let setting: Record<string, boolean> = { 'scope.camera': true, 'scope.record': false };
    // 结果按调用时的 setting 给（getter）：授权被拒之后再查要看到新状态
    const { api } = fakeApi(
      {
        get getSetting() {
          return { authSetting: setting };
        },
        openSetting: { authSetting: { 'scope.record': true } },
      },
      { authorize: { errMsg: 'authorize:fail auth deny' } },
    );
    const { permissions } = createCapabilities({ name: 'wx', api });
    expect(await permissions.status('camera')).toBe('granted');
    expect(await permissions.status('microphone')).toBe('denied');
    expect(await permissions.status('location')).toBe('prompt');
    setting = { ...setting, 'scope.userLocation': false };
    expect(await permissions.request('location')).toBe('denied');
    expect(await permissions.openSettings('microphone')).toBe('granted');
  });

  it('支付宝：没有提前申请的接口，没问过的仍是 prompt；没有键名的权限当作用到时再问', async () => {
    const { api, calls } = fakeApi({ getSetting: { authSetting: { location: true } } });
    const { permissions } = createCapabilities({ name: 'my', api });
    expect(await permissions.status('location')).toBe('granted');
    expect(await permissions.request('camera')).toBe('prompt');
    expect(await permissions.status('bluetooth')).toBe('prompt');
    expect(calls.some(([name]) => name === 'authorize')).toBe(false);
  });
});

describe('存储', () => {
  it('两端都存 JSON 文本：微信按 (key, data)，支付宝按 { key, data }；没有值时 undefined', () => {
    const wxStore = new Map<string, unknown>();
    const wxApi = {
      getStorageSync: (key: string) => wxStore.get(key) ?? '',
      setStorageSync: (key: string, data: unknown) => wxStore.set(key, data),
      removeStorageSync: (key: string) => wxStore.delete(key),
      getStorageInfoSync: () => ({ keys: [...wxStore.keys()] }),
    } as unknown as CapabilityApi;
    const wxStorage = createCapabilities({ name: 'wx', api: wxApi }).storage;
    wxStorage.set('cart', [1, 2]);
    expect(wxStore.get('cart')).toBe('[1,2]');
    expect(wxStorage.get('cart')).toEqual([1, 2]);
    expect(wxStorage.get('missing')).toBeUndefined();
    expect(wxStorage.keys()).toEqual(['cart']);

    const myStore = new Map<string, unknown>();
    const myApi = {
      getStorageSync: ({ key }: { key: string }) => ({ data: myStore.get(key) }),
      setStorageSync: ({ key, data }: { key: string; data: unknown }) => myStore.set(key, data),
      removeStorageSync: ({ key }: { key: string }) => myStore.delete(key),
    } as unknown as CapabilityApi;
    const myStorage = createCapabilities({ name: 'my', api: myApi }).storage;
    myStorage.set('token', 'abc');
    expect(myStorage.get('token')).toBe('abc');
    myStorage.remove('token');
    expect(myStorage.get('token')).toBeUndefined();
  });
});

describe('登录、支付、订阅、手机号', () => {
  it('登录：微信 wx.login 的 code；支付宝 getAuthCode 按 scope 选 auth_base / auth_user', async () => {
    const wx = createCapabilities({ name: 'wx', api: fakeApi({ login: { code: 'c1' } }).api });
    expect(await wx.login()).toEqual({ platform: 'wx', code: 'c1' });
    const { api, calls } = fakeApi({ getAuthCode: { authCode: 'a1' } });
    const my = createCapabilities({ name: 'my', api });
    expect(await my.login({ scope: 'user' })).toEqual({ platform: 'my', code: 'a1' });
    expect((calls[0]![1] as { scopes: string }).scopes).toBe('auth_user');
  });

  it('支付：微信成功、取消、失败；支付宝结果码 9000 成功、6001 取消、8000 待查；方式与平台不符时报错', async () => {
    const order = {
      provider: 'wechat' as const,
      timeStamp: '1',
      nonceStr: 'n',
      package: 'prepay_id=1',
      signType: 'RSA',
      paySign: 's',
    };
    const ok = createCapabilities({ name: 'wx', api: fakeApi({ requestPayment: {} }).api });
    expect((await ok.pay(order)).status).toBe('success');
    const cancel = createCapabilities({
      name: 'wx',
      api: fakeApi({}, { requestPayment: { errMsg: 'requestPayment:fail cancel' } }).api,
    });
    expect((await cancel.pay(order)).status).toBe('cancel');
    const fail = createCapabilities({
      name: 'wx',
      api: fakeApi({}, { requestPayment: { errMsg: 'requestPayment:fail' } }).api,
    });
    expect((await fail.pay(order)).status).toBe('fail');
    await expect(ok.pay({ provider: 'alipay', tradeNO: 't' })).rejects.toThrow('alipay');

    for (const [code, status] of [
      ['9000', 'success'],
      ['6001', 'cancel'],
      ['8000', 'pending'],
      ['4000', 'fail'],
    ]) {
      const my = createCapabilities({
        name: 'my',
        api: fakeApi({ tradePay: { resultCode: code } }).api,
      });
      expect((await my.pay({ provider: 'alipay', tradeNO: 't' })).status).toBe(status);
    }
  });

  it('订阅消息：微信按模板取 accept / reject / ban；支付宝看返回的已订阅模板', async () => {
    const wx = createCapabilities({
      name: 'wx',
      api: fakeApi({ requestSubscribeMessage: { a: 'accept', b: 'reject', c: 'ban', d: 'filter' } })
        .api,
    });
    expect(await wx.subscribe(['a', 'b', 'c', 'd'])).toEqual({
      a: 'accept',
      b: 'reject',
      c: 'ban',
      d: 'reject',
    });
    const my = createCapabilities({
      name: 'my',
      api: fakeApi({ requestSubscribeMessage: { result: { subscribeEntityIds: ['x'] } } }).api,
    });
    expect(await my.subscribe(['x', 'y'])).toEqual({ x: 'accept', y: 'reject' });
  });

  it('手机号：微信取按钮 detail 的 code（没同意时报错）；支付宝再调 getPhoneNumber 取加密的 response', async () => {
    const wx = createCapabilities({ name: 'wx', api: fakeApi({}).api });
    expect(await wx.phoneNumber({ code: 'p1' })).toEqual({ platform: 'wx', code: 'p1' });
    await expect(wx.phoneNumber({ errMsg: 'getPhoneNumber:fail user deny' })).rejects.toThrow(
      'user deny',
    );
    const my = createCapabilities({
      name: 'my',
      api: fakeApi({ getPhoneNumber: { response: 'enc' } }).api,
    });
    expect(await my.phoneNumber({})).toEqual({ platform: 'my', response: 'enc' });
  });
});

describe('隐私协议', () => {
  it('平台要求同意时通知监听者，回复同意带按钮 id；没有监听者时回复不同意', () => {
    let need!: (resolve: (result: unknown) => void) => void;
    const api = {
      onNeedPrivacyAuthorization: (listener: typeof need) => (need = listener),
    } as unknown as CapabilityApi;
    const capabilities = createCapabilities({ name: 'wx', api });
    const listener = vi.fn((reply: (agreed: boolean, id?: string) => void) => reply(true, 'btn'));
    const stop = capabilities.onPrivacyRequest(listener);
    const resolve = vi.fn();
    need(resolve);
    expect(resolve).toHaveBeenCalledWith({ event: 'agree', buttonId: 'btn' });
    stop();
    const second = vi.fn();
    need(second);
    expect(second).toHaveBeenCalledWith({ event: 'disagree' });
  });
});

describe('开放能力按钮', () => {
  it('带 open-type 的 button 用原生按钮模板（加 vtp-btn 去掉默认外观）；平台事件统一成 opentype', async () => {
    const onOpentype = vi.fn();
    const Demo = defineComponent(
      () => () =>
        h('button', { 'open-type': 'getPhoneNumber', onOpentype }, [h('span', '手机号登录')]),
    );
    const page = mountPage(Demo);
    await page.settle();
    const button = page.find((node) => node.t === 'btn')!;
    expect(button.ot).toBe('getPhoneNumber');
    expect(button.c).toContain('vtp-btn');
    await page.dispatch(button, 'getphonenumber', { code: 'p1' });
    expect(onOpentype.mock.calls[0]![0].detail).toEqual({ code: 'p1' });
    expect(baseTemplate(PLATFORMS.wx)).toContain('bindgetphonenumber="eh"');
    expect(baseTemplate(PLATFORMS.my)).toContain('onGetAuthorize="eh"');
  });
});

describe('app.json', () => {
  it('位置的用途说明写进 permission；requiredPrivateInfos 原样写入，模糊与精确位置的接口同时声明时报错', () => {
    expect(
      wechatAppFields({
        root: '',
        platform: 'wx',
        darkmode: true,
        permissions: { location: '展示附近门店' },
        requiredPrivateInfos: ['getLocation', 'chooseLocation'],
      }),
    ).toEqual({
      darkmode: true,
      permission: { 'scope.userLocation': { desc: '展示附近门店' } },
      requiredPrivateInfos: ['getLocation', 'chooseLocation'],
    });
    expect(() =>
      wechatAppFields({
        root: '',
        platform: 'wx',
        requiredPrivateInfos: ['getFuzzyLocation', 'getLocation'],
      }),
    ).toThrow('互斥');
  });
});

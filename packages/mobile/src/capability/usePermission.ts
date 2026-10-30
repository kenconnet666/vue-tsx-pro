/**
 * 设备权限的组合函数：查状态、申请；拒绝过的弹对话框引导去设置页（小程序里打开设置页，H5 只能说明）。
 *
 *   const location = usePermission('location');
 *   const locate = async () => {
 *     if (await location.request()) host.… // 已同意
 *   };
 *   // location.status.value：granted / denied / prompt / unsupported，查到之前是 null
 */
import { shallowRef, type Ref } from 'vue';
import { useConfig } from '../config/context';
import { showConfirmDialog, showDialog } from '../feedback/Dialog';
import { useHost } from '../utils/host';
import type { DevicePermission, DevicePermissionState } from './types';

export interface PermissionHandle {
  /** 当前状态；还没查到时 null */
  readonly status: Readonly<Ref<DevicePermissionState | null>>;
  /** 申请：同意了返回 true。拒绝过的先引导去设置页，从设置页回来再看一次 */
  request(): Promise<boolean>;
  /** 重新查状态（比如页面重新显示时） */
  refresh(): Promise<DevicePermissionState>;
}

export function usePermission(name: DevicePermission): PermissionHandle {
  const host = useHost();
  const config = useConfig();
  const status = shallowRef<DevicePermissionState | null>(null);
  const refresh = async () => (status.value = await host.permissions.status(name));
  void refresh();

  /** 拒绝过：小程序里问要不要去设置页；H5 不能代开浏览器设置，只说明 */
  const guide = async (): Promise<DevicePermissionState> => {
    const { title, message, openSettings } = config.lang.permissionDenied;
    const text = message(config.lang.permissions[name]);
    if (host.platform === 'web') {
      await showDialog({ title, message: text });
      return 'denied';
    }
    const go = await showConfirmDialog({ title, message: text, confirmText: openSettings });
    return go ? host.permissions.openSettings(name) : 'denied';
  };

  return {
    status,
    refresh,
    async request() {
      let next = await host.permissions.request(name);
      if (next === 'denied') next = await guide();
      status.value = next;
      return next === 'granted';
    },
  };
}

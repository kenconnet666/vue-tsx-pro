// 演示的设置：各页面共用（小程序里每个页面是一个 Vue 应用，同一个包里的模块状态是共享的）
import type { MobileThemes } from '@zerodep-dev/vue-tsx-pro-mobile';

export const demoSettings = _state<{ theme: keyof MobileThemes }>({ theme: 'light' });

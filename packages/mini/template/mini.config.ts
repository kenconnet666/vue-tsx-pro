// 小程序：npm run dev:wx（监听）、npm run build:mini（两端）、npm run open:wx（在开发者工具里打开）
import { defineMiniConfig } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

export default defineMiniConfig({
  plugins: vueTsxPro(),
  // 换成自己的 AppID（或微信的「小程序测试号」）：touristappid 在开发者工具里会报 APPID_ERROR
  appId: 'touristappid',
  // 微信报告系统的深浅色，ConfigProvider 的 theme="system" 跟着切换
  darkmode: true,
  window: { navigationBarTitleText: 'vtp-mobile-app' },
});

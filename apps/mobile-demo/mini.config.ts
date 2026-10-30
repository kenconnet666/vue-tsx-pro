// 两端小程序的构建配置：build.ts 与 vtp-mini 命令（open 等）都读它
import { defineMiniConfig } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

export default defineMiniConfig({
  plugins: vueTsxPro(),
  // 微信「小程序测试号」，只用于本地开发者工具预览
  appId: 'wxbc70cc8a7367b5e9',
  darkmode: true,
  window: {
    navigationBarTitleText: 'vue-tsx-pro',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  },
});

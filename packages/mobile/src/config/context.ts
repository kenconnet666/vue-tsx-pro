/**
 * 配置的上下文：ConfigProvider 提供，组件里 `useConfig()` 读。单独一个模块（不带组件），
 * ConfigProvider 渲染的命令式反馈出口（轻提示、对话框）也要读它，放在一起会互相导入。
 */
import { createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { zhCN, type MobileLang } from './lang';

/** 组件读到的配置 */
export interface MobileConfig {
  /** 语言包 */
  readonly lang: MobileLang;
  /**
   * 浮层根元素要重新挂上的样式：主题类与字体、文字颜色。弹出层 Teleport 到 body（或小程序的浮层根）后
   * 就不在 ConfigProvider 的根元素里了，靠它保持同一个主题
   */
  readonly rootSx: SxStyles;
}

/** 配置的上下文 */
export const ConfigContext = createContext<MobileConfig>('ConfigProvider');

/** 不在 ConfigProvider 里时的默认配置 */
const defaultConfig: MobileConfig = { lang: zhCN, rootSx: null };

/** 当前的配置；不在 ConfigProvider 里时是默认配置（简体中文、亮色） */
export const useConfig = (): MobileConfig => ConfigContext.inject(defaultConfig);

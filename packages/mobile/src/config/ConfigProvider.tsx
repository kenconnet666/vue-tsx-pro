/**
 * 全局配置：主题（亮色、暗色、跟随系统）与语言。包在每个页面（或应用）外面，里面的组件读它：
 *
 *   <ConfigProvider theme="system" lang={enUS}>
 *     <Page />
 *   </ConfigProvider>
 *
 * 主题是根元素上只改变量的类，换主题不重新渲染组件；根元素也给出页面的字体、字号、文字颜色。
 * 命令式的反馈（showToast、showDialog、showNotify）渲染在最外层的 ConfigProvider 里：用它们的页面要包一层。
 * 不包时组件用简体中文、亮色主题。
 *
 * host 补上或换掉宿主能力（utils/host.ts）：H5 没有平台登录，由应用给出 login 等实现：
 *
 *   <ConfigProvider host={{ login: () => myOAuth() }}>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { provide, type VNodeChild } from 'vue';
import { FeedbackOutlet } from '../feedback/FeedbackOutlet';
import { darkTheme, systemTheme } from '../theme/dark';
import { HOST_KEY, useHost, type Host } from '../utils/host';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { ConfigContext } from './context';
import { zhCN, type MobileLang } from './lang';

/** 主题 */
export interface MobileThemes {
  /** 亮色 */
  light: unknown;
  /** 暗色 */
  dark: unknown;
  /** 跟随系统的暗色偏好 */
  system: unknown;
}

/** 未声明的属性落到根元素（div）上；lang 是语言包，不是元素的 lang 属性 */
export interface ConfigProviderProps extends PartProps<'div', 'lang'> {
  /**
   * 主题
   * @default 'light'
   */
  theme?: keyof MobileThemes;
  /**
   * 语言包
   * @default zhCN
   */
  lang?: MobileLang;
  /** 补上或换掉的宿主能力（只在创建时读）：H5 给出 login 这类应用自己的实现，测试里换成假的 */
  host?: Partial<Host>;
  /** 内容 */
  children?: VNodeChild;
}

/** ConfigProvider 的样式：root */
export const configProviderStyles = css.create({
  root: {
    fontFamily: '_sans',
    fontSize: '_md',
    lineHeight: '_normal',
    color: '_text',
    WebkitTapHighlightColor: 'transparent',
    textSizeAdjust: '100%',
  },
});

const THEMES = { light: null, dark: darkTheme, system: systemTheme } as const;

/** 全局配置：主题与语言；根元素是一个 div，后面是命令式反馈的出口 */
export const ConfigProvider = _component(
  ({ theme = 'light', lang = zhCN, host, children, ...rest }: ConfigProviderProps) => {
    // 只在创建时读：换宿主能力要重建页面
    const override = _untrack(host);
    if (override) provide(HOST_KEY, { ...useHost(), ...override });
    // 嵌套时只有最外层渲染出口，否则同一条提示会出现两次
    const outermost = ConfigContext.inject(null) === null;
    ConfigContext.provide({
      get lang() {
        return lang;
      },
      get rootSx() {
        return [configProviderStyles.root, THEMES[theme]];
      },
    });
    return () => [
      <div
        {...mergeAttrs<'div'>(
          { sx: [configProviderStyles.root, THEMES[theme]] },
          rest,
          dataAttrs({ 'data-theme': theme }),
        )}
      >
        {children}
      </div>,
      outermost && <FeedbackOutlet />,
    ];
  },
);

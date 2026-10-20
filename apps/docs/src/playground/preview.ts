/**
 * 代码演练场的预览：用户的组件挂在一个独立的 Vue 应用里，与文档站的应用互不相干。
 * 渲染、setup、事件处理、侦听器里抛出的错误都被根组件的错误边界接住（onErrorCaptured），
 * 交给 onError 由页面在预览区显示，出错的组件不再渲染；文档站本身照常工作。
 * 定时器、Promise 里的错误不经过 Vue，只出现在控制台。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { ConfigContext, type UiConfig } from '@vue-tsx-pro/ui';
import { createApp, h, onErrorCaptured, type Component } from 'vue';

/** mountPreview 的选项 */
export interface PreviewOptions {
  /** 文档站的组件库配置：预览与页面用同一个主题、语言、高亮器，切换主题时一起变 */
  config: UiConfig;
  /** 用户代码出错时调用 */
  onError: (error: unknown) => void;
}

/** 在 host 里挂载用户的组件，返回卸载函数 */
export function mountPreview(
  host: Element,
  component: Component,
  { config, onError }: PreviewOptions,
): () => void {
  const report = (error: unknown) => {
    // 控制台里留着原始错误与调用栈，方便排查
    console.error(error);
    onError(error);
  };
  const ErrorBoundary = _component(() => {
    let failed = _state(false);
    onErrorCaptured((error) => {
      failed = true;
      report(error);
      return false;
    });
    return () => (failed ? null : h(component));
  });
  const app = createApp(ErrorBoundary);
  app.provide(ConfigContext.key, config);
  // 边界自己出错（理论上不会）时的兜底：同样只报告，不往上抛
  app.config.errorHandler = report;
  app.mount(host);
  return () => app.unmount();
}

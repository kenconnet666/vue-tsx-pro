/** 微信与支付宝在产物上的差别：文件后缀、模板指令前缀、事件属性写法、项目配置文件 */
export interface Platform {
  readonly name: 'wx' | 'my';
  readonly template: 'wxml' | 'axml';
  readonly style: 'wxss' | 'acss';
  /** 列表指令前缀：wx:for / a:for */
  readonly directive: 'wx' | 'a';
  /**
   * 事件属性：catchtap / catchTap。用 catch 让原生冒泡停在最内层的节点，冒泡由运行时按节点树做（page.ts）；
   * 两端冒泡时 target 的含义不同（支付宝每一层的 target 都是当前节点），不能靠它去重
   */
  event(name: 'tap' | 'touchstart' | 'touchend' | 'touchcancel' | 'input'): string;
}

const camel: Record<string, string> = {
  tap: 'Tap',
  touchstart: 'TouchStart',
  touchend: 'TouchEnd',
  touchcancel: 'TouchCancel',
  input: 'Input',
};

export const PLATFORMS: Readonly<Record<Platform['name'], Platform>> = {
  wx: {
    name: 'wx',
    template: 'wxml',
    style: 'wxss',
    directive: 'wx',
    event: (name) => `catch${name}`,
  },
  my: {
    name: 'my',
    template: 'axml',
    style: 'acss',
    directive: 'a',
    event: (name) => `catch${camel[name]}`,
  },
};

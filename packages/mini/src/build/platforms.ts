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
  event(name: NativeEventName): string;
  /**
   * 手势节点（模板 touch）的 touchmove：平时 bind（页面照常滚动），节点要 catch 时（横向滑动的过程中）换成 catch。
   * 微信的事件名可以是表达式；支付宝不行，只 bind
   */
  touchMove: string;
}

/** 模板上绑的原生事件 */
export type NativeEventName =
  | 'tap'
  | 'longpress'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'touchcancel'
  | 'input'
  | 'confirm'
  | 'focus'
  | 'blur'
  | 'load'
  | 'error';

/** 支付宝的事件名是驼峰：onTouchStart、catchLongTap */
const camel: Record<NativeEventName, string> = {
  tap: 'Tap',
  longpress: 'LongTap',
  touchstart: 'TouchStart',
  touchmove: 'TouchMove',
  touchend: 'TouchEnd',
  touchcancel: 'TouchCancel',
  input: 'Input',
  confirm: 'Confirm',
  focus: 'Focus',
  blur: 'Blur',
  load: 'Load',
  error: 'Error',
};

export const PLATFORMS: Readonly<Record<Platform['name'], Platform>> = {
  wx: {
    name: 'wx',
    template: 'wxml',
    style: 'wxss',
    directive: 'wx',
    event: (name) => `catch${name}`,
    touchMove: `bindtouchmove="{{i.cm ? '' : 'eh'}}" catchtouchmove="{{i.cm ? 'eh' : ''}}"`,
  },
  my: {
    name: 'my',
    template: 'axml',
    style: 'acss',
    directive: 'a',
    event: (name) => `catch${camel[name]}`,
    touchMove: 'onTouchMove="eh"',
  },
};

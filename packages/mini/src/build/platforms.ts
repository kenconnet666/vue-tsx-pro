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
   * 冒泡的事件属性：bindtouchstart / onTouchStart。按下、松开不能 catch：真机上 catch 掉之后不再产生 tap
   * （模拟器照常有），冒泡带来的重复由运行时按事件时间去掉
   */
  bubble(name: NativeEventName): string;
  /**
   * 手势节点（模板 touch）的 touchmove：平时 bind（页面照常滚动），节点要 catch 时（横向滑动的过程中）换成 catch。
   * 微信的事件名可以是表达式；支付宝不行，只 bind
   */
  touchMove: string;
  /**
   * 无障碍属性：节点数据里的读屏字段（page.ts 的 A11Y_ATTRS）写到模板上。微信的组件认 aria-role、aria-label 等；
   * 支付宝没有对应的属性，空着
   */
  a11y: string;
  /** 开放能力按钮（模板 btn）的原生 button 上额外绑的属性与事件 */
  openButton: string;
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
    bubble: (name) => `bind${name}`,
    touchMove: `bindtouchmove="{{i.cm ? '' : 'eh'}}" catchtouchmove="{{i.cm ? 'eh' : ''}}"`,
    a11y: 'aria-role="{{i.ar}}" aria-label="{{i.al}}" aria-hidden="{{i.ahi}}" aria-checked="{{i.ack}}" aria-disabled="{{i.adi}}" aria-selected="{{i.ase}}" aria-expanded="{{i.aex}}"',
    openButton:
      'open-type="{{i.ot}}" hover-class="none" bindgetphonenumber="eh" bindchooseavatar="eh" bindagreeprivacyauthorization="eh" binderror="eh"',
  },
  my: {
    name: 'my',
    template: 'axml',
    style: 'acss',
    directive: 'a',
    event: (name) => `catch${camel[name]}`,
    bubble: (name) => `on${camel[name]}`,
    touchMove: 'onTouchMove="eh"',
    a11y: '',
    openButton: 'open-type="{{i.ot}}" scope="{{i.os}}" onGetAuthorize="eh" onError="eh"',
  },
};

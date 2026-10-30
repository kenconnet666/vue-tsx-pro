/**
 * 页面：一个 Vue 应用挂在页面的根节点上，节点变化在微任务里攒成一次 setData（按路径只发变了的字段），
 * 模板（build/templates.ts）按数据里的 t 选元素模板递归渲染。小程序事件只在目标节点上处理一次，冒泡由这里按节点树做。
 *
 * 数据的形状：{ root: { cn: [节点…] } }，节点是 { s: 编号, t: 模板类型, c: 类名, st: 样式, v: 文字, cn: 子节点 }
 */
import type { App, Component } from 'vue';
import { FORM_CONTROLS, TEMPLATE_DEPTH, templateOf, type TemplateType } from './elements.ts';
import { MiniNode, type MiniEvent, type MiniTouch, type NodeHost } from './node.ts';
import { createMiniApp } from './renderer.ts';
import { createMiniHost, HOST_KEY, platform, windowSize, type MiniApi } from './host.ts';
import { resolveStyle, setColorScheme, setWindowWidth } from './style.ts';
import { svgMaskStyle } from './svg.ts';
import { createPageHooks, emitPageEvent, PAGE_HOOKS_KEY, type PageHooks } from './lifecycle.ts';

/** 页面实例上要用到的部分（微信、支付宝相同） */
interface PageInstance {
  setData(data: Record<string, unknown>, callback?: () => void): void;
}

/** 小程序事件里要用到的部分；支付宝的事件名是驼峰（touchStart），统一转小写 */
interface NativeEvent {
  type: string;
  /** 事件发生的时间：bind 的 touchmove 会沿祖先冒泡，同一次移动按它只处理一次 */
  timeStamp?: number;
  detail?: unknown;
  currentTarget?: { dataset?: Record<string, string> };
  touches?: readonly NativeTouch[];
  changedTouches?: readonly NativeTouch[];
}

/** 小程序事件里的触点：微信给 clientX / pageX，支付宝有的版本只给 pageX（页面坐标），缺的用另一个补 */
interface NativeTouch {
  identifier?: number;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
}

const toTouch = (touch: NativeTouch, index: number): MiniTouch => ({
  identifier: touch.identifier ?? index,
  clientX: touch.clientX ?? touch.pageX ?? 0,
  clientY: touch.clientY ?? touch.pageY ?? 0,
  pageX: touch.pageX ?? touch.clientX ?? 0,
  pageY: touch.pageY ?? touch.clientY ?? 0,
});

/** 节点数据的字段 */
type NodeData = Record<string, unknown>;

/** 有子节点的模板类型 */
const CONTAINERS = new Set<TemplateType>(['v', 'lock', 'touch', 'btn']);

/** 小程序事件 → 组件收到的事件名 */
const EVENT_TYPES: Readonly<Record<string, string>> = {
  tap: 'click',
  touchstart: 'touchstart',
  touchend: 'touchend',
  touchcancel: 'touchcancel',
  touchmove: 'touchmove',
  longpress: 'longpress',
  // 支付宝的长按叫 longTap
  longtap: 'longpress',
  input: 'input',
  // 键盘的确认键：转成按下 Enter，组件照 DOM 的写法判断 event.key
  confirm: 'keydown',
  blur: 'blur',
  focus: 'focus',
  load: 'load',
  error: 'error',
  scroll: 'scroll',
  // 开放能力按钮的结果（微信：手机号、头像、隐私协议同意；支付宝：getAuthorize）：组件收到 opentype，detail 是平台给的
  getphonenumber: 'opentype',
  chooseavatar: 'opentype',
  agreeprivacyauthorization: 'opentype',
  getauthorize: 'opentype',
};

/**
 * 透传到模板上的元素属性：元素属性名 → 节点数据里的字段（模板里写 {{i.字段}}，见 build/templates.ts）；
 * 其余属性只参与样式条件
 */
const TEMPLATE_ATTRS = {
  id: 'id',
  src: 'src',
  mode: 'mode',
  'lazy-load': 'lz',
  value: 'value',
  placeholder: 'placeholder',
  type: 'type',
  maxlength: 'maxlength',
  enterkeyhint: 'ct',
  'data-autosize': 'ah',
  autofocus: 'af',
} as const;

/**
 * 读屏的属性：元素属性名 → 节点数据里的字段（模板上的 aria-* 见 build/platforms.ts 的 a11y）。
 * 只发微信认的几个；role 在微信里叫 aria-role
 */
const A11Y_ATTRS = {
  role: 'ar',
  'aria-label': 'al',
  'aria-hidden': 'ahi',
  'aria-checked': 'ack',
  'aria-disabled': 'adi',
  'aria-selected': 'ase',
  'aria-expanded': 'aex',
} as const;

/** 透传到模板的属性：支付宝的模板上没有读屏属性，不发 */
let passed: [string, string][] | undefined;
const passedAttrs = () =>
  (passed ??= Object.entries(
    platform()?.name === 'my' ? TEMPLATE_ATTRS : { ...TEMPLATE_ATTRS, ...A11Y_ATTRS },
  ));

/** 输入框的 type（加上 inputmode）→ 小程序 input 的 type 与是否密码 */
function inputType(node: MiniNode): { type: string; pw?: 1 } {
  const type = node.attribute('type');
  const mode = node.attribute('inputmode');
  if (type === 'password') return { type: 'text', pw: 1 };
  if (type === 'number' || mode === 'decimal') return { type: 'digit' };
  if (type === 'tel' || mode === 'numeric' || mode === 'tel') return { type: 'number' };
  // 微信的昵称输入框（键盘上方给出微信昵称）；支付宝不认，按文字处理
  if (node.attribute('autocomplete') === 'nickname' && platform()?.name !== 'my')
    return { type: 'nickname' };
  return { type: 'text' };
}

/** 输入框、多行输入的事件：用户输入的值写回节点（不触发 setData，组件把同一个值写回时才发） */
const VALUE_EVENTS = new Set(['input', 'focus', 'blur', 'confirm']);

class PageHost implements NodeHost {
  private readonly nodes = new Map<string, MiniNode>();
  private readonly sent = new WeakMap<MiniNode, NodeData>();
  /**
   * 行内样式的字典：同一个样式串只发一次（页面数据的 ss），节点只带它的编号（st），模板里写 ss[i.st]。
   * 列表里成百上千个节点的样式往往只有几种，首屏的 setData 因此小一个数量级
   */
  private readonly styleIds = new Map<string, string>();
  /** 这一轮新登记、还没发出去的样式 */
  private newStyles: Record<string, string> = {};
  private readonly touched = new Set<MiniNode>();
  private readonly restructured = new Set<MiniNode>();
  private scheduled = false;
  /** 等这一轮 setData 生效的回调（量尺寸要等节点上了模板） */
  private waiting: (() => void)[] = [];
  private readonly page: PageInstance;
  readonly root: MiniNode;
  /** 浮层根：挂在根节点的最后，弹出层、轻提示 Teleport 到这里 */
  readonly overlay = new MiniNode('div');
  /** 页面滚动位置（onPageScroll 记下），与滚动的监听 */
  scrollTop = 0;
  /** 上一次处理的 touchmove 的时间（去掉冒泡带来的重复） */
  private lastMove = -1;
  /** 递归组件里按下的节点与位置（合成点击用） */
  private pressStart: { node: MiniNode; x: number; y: number; time: number } | null = null;
  readonly scrollListeners = new Set<(top: number) => void>();

  constructor(page: PageInstance, root: MiniNode) {
    this.page = page;
    this.root = root;
    root.host = this;
  }

  /** 等这一轮的变化发出去并生效；没有待发的变化时下一个微任务就好 */
  flushed(): Promise<void> {
    return new Promise((resolve) => {
      this.waiting.push(resolve);
      this.schedule();
    });
  }

  /** 样式串 → 字典里的编号（空样式不占编号） */
  private styleId(style: string): string | undefined {
    if (!style) return undefined;
    let id = this.styleIds.get(style);
    if (id === undefined) {
      id = this.styleIds.size.toString(36);
      this.styleIds.set(style, id);
      this.newStyles[id] = style;
    }
    return id;
  }

  /** 所有节点重新展开样式（系统换了深浅色：跟随系统的主题类展开出的变量变了） */
  restyle() {
    for (const node of this.nodes.values()) this.touch(node);
  }

  touch(node: MiniNode) {
    // svg 子树整体画成一张遮罩：里面变了就重画 svg 本身
    this.touched.add(svgRoot(node) ?? node);
    this.schedule();
  }

  restructure(node: MiniNode) {
    const svg = svgRoot(node);
    if (svg) this.touched.add(svg);
    else this.restructured.add(node);
    this.schedule();
  }

  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    // Vue 的更新也在微任务里：排在它后面，一轮更新只发一次 setData
    void Promise.resolve().then(() => this.flush());
  }

  /** 把这一轮的变化合成一次 setData：子节点变了的整段重发，只是字段变了的按路径发变了的那几个 */
  flush() {
    this.scheduled = false;
    const payload: NodeData = {};
    for (const node of this.restructured) {
      const path = this.pathOf(node);
      if (path === undefined || this.coveredBy(node, this.restructured)) continue;
      payload[`${path}.cn`] = node.children.map((child) => this.serialize(child));
    }
    for (const node of this.touched) {
      const path = this.pathOf(node);
      if (path === undefined || node === this.root || this.coveredBy(node, this.restructured))
        continue;
      const previous = this.sent.get(node) ?? {};
      const next = this.fieldsOf(node);
      for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
        if (previous[key] !== next[key]) payload[`${path}.${key}`] = next[key] ?? null;
      }
      this.sent.set(node, next);
    }
    for (const [id, style] of Object.entries(this.newStyles)) payload[`ss.${id}`] = style;
    this.newStyles = {};
    this.restructured.clear();
    this.touched.clear();
    const waiting = this.waiting;
    this.waiting = [];
    const done = () => waiting.forEach((resolve) => resolve());
    if (Object.keys(payload).length) this.page.setData(payload, done);
    else done();
  }

  /** 祖先（不含自己）这一轮整段重发了 */
  private coveredBy(node: MiniNode, set: Set<MiniNode>): boolean {
    for (let parent = node.parent; parent; parent = parent.parent) if (set.has(parent)) return true;
    return false;
  }

  /** 节点在页面数据里的路径；不在这个页面上时 undefined */
  private pathOf(node: MiniNode): string | undefined {
    const indexes: number[] = [];
    let current = node;
    while (current !== this.root) {
      const parent = current.parent;
      if (!parent) return undefined;
      indexes.unshift(parent.children.indexOf(current));
      current = parent;
    }
    return indexes.reduce((path, index) => `${path}.cn[${index}]`, 'root');
  }

  private serialize(node: MiniNode): NodeData {
    const fields = this.fieldsOf(node);
    // 记下的只有自己的字段：子节点不参与字段比对，否则下次比对会把 cn 当成"去掉了"
    this.sent.set(node, fields);
    if (!CONTAINERS.has(fields.t as TemplateType)) return fields;
    return { ...fields, cn: node.children.map((child) => this.serialize(child)) };
  }

  /** 节点自己的字段（不含子节点） */
  private fieldsOf(node: MiniNode): NodeData {
    this.nodes.set(node.sid, node);
    let type = templateOf(node.tag);
    // 遮罩这类节点 catch 掉 touchmove，挡住下面页面的滚动（小程序没有别的办法锁滚动）；手势节点才收 touchmove
    if (type === 'v' && node.tag === 'button' && node.attribute('open-type') !== undefined)
      type = 'btn';
    else if (type === 'v' && node.attribute('data-scroll-lock') !== undefined) type = 'lock';
    else if (type === 'v' && node.attribute('data-touch-move') !== undefined) type = 'touch';
    if (type === 'x') return { s: node.sid, t: type, v: node.text };
    if (type === 'n') return { s: node.sid, t: type };
    const { className, style } = resolveStyle(node);
    const data: NodeData = {
      s: node.sid,
      t: type,
      st: this.styleId(type === 'svg' ? `${svgMaskStyle(node)};${style}` : style),
    };
    // 空的类名不发（多数节点没有类名，全靠行内样式）；原生按钮再加去掉默认外观的类（build/styles.ts）
    if (type === 'btn') {
      data.c = className ? `${className} vtp-btn` : 'vtp-btn';
      data.ot = node.attribute('open-type');
      // 支付宝 getAuthorize 的授权范围
      const scope = node.attribute('scope');
      if (scope !== undefined) data.os = scope;
    } else if (className) data.c = className;
    // 手势节点在横滑的过程中写 data-touch-move="catch"：模板换成 catch，页面不跟着滚
    if (type === 'touch' && node.attribute('data-touch-move') === 'catch') data.cm = 1;
    for (const [name, field] of passedAttrs()) {
      const value = node.attribute(name);
      if (value !== undefined) data[field] = value;
    }
    if (type === 'input' || type === 'textarea') {
      if (type === 'input') Object.assign(data, inputType(node));
      // 小程序没有只读：只读也按禁用画（不弹键盘）
      if (node.attribute('disabled') !== undefined || node.attribute('readonly') !== undefined)
        data.dis = 1;
    }
    return data;
  }

  /** 小程序事件 → 组件事件：模板用 catch 绑定，只有最内层的节点收到，从它起按节点树冒泡 */
  dispatch(native: NativeEvent) {
    const sid = native.currentTarget?.dataset?.s;
    if (!sid) return;
    const target = this.nodes.get(sid);
    const nativeType = native.type.toLowerCase();
    // 手势节点的 touchmove 是 bind（为了不挡页面滚动），会冒泡到外层的手势节点：同一次移动只处理一次
    if (nativeType === 'touchmove' && native.timeStamp !== undefined) {
      if (native.timeStamp === this.lastMove) return;
      this.lastMove = native.timeStamp;
    }
    const type = EVENT_TYPES[nativeType];
    if (!target || !type) return;
    // 递归组件里的节点（超过模板层数）：原生的 tap 不可靠（按下时整段子树重发，tap 会丢），点击由按下、松开合成
    const deep = levelOf(target) >= TEMPLATE_DEPTH;
    if (deep && nativeType === 'tap') return;
    if (nativeType === 'touchstart' || nativeType === 'touchend' || nativeType === 'touchcancel')
      this.press(target, nativeType === 'touchstart');
    if (type === 'click' && insideDisabledControl(target)) return;
    if (VALUE_EVENTS.has(nativeType)) {
      const value = (native.detail as { value?: unknown } | undefined)?.value;
      if (typeof value === 'string') target.attrs.set('value', value);
      // 失焦后去掉 focus 属性，下次 focus() 才会再生效
      if (nativeType === 'blur' && target.attrs.has('autofocus'))
        target.removeAttribute('autofocus');
    }
    this.deliver(type, target, native);
    if (deep && this.isTap(target, nativeType, native) && !insideDisabledControl(target))
      this.deliver('click', target, native);
  }

  /** 递归组件里的点击：按下与松开在同一个节点、移动不到 10px、不到 700ms */
  private isTap(target: MiniNode, nativeType: string, native: NativeEvent): boolean {
    const point = native.changedTouches?.[0] ?? native.touches?.[0];
    if (nativeType === 'touchstart' && point) {
      const { clientX: x, clientY: y } = toTouch(point, 0);
      this.pressStart = { node: target, x, y, time: Date.now() };
      return false;
    }
    if (nativeType !== 'touchend' || !this.pressStart || !point) return false;
    const start = this.pressStart;
    this.pressStart = null;
    const { clientX: x, clientY: y } = toTouch(point, 0);
    return (
      start.node === target &&
      Math.hypot(x - start.x, y - start.y) < 10 &&
      Date.now() - start.time < 700
    );
  }

  /** 交给节点上的处理函数，从目标往上冒泡 */
  private deliver(type: string, target: MiniNode, native: NativeEvent) {
    const nativeType = native.type.toLowerCase();
    let stopped = false;
    const event: MiniEvent = {
      type,
      target,
      currentTarget: target,
      defaultPrevented: false,
      detail: native.detail,
      touches: (native.touches ?? []).map(toTouch),
      changedTouches: (native.changedTouches ?? []).map(toTouch),
      key: nativeType === 'confirm' ? 'Enter' : undefined,
      preventDefault() {
        event.defaultPrevented = true;
      },
      stopPropagation() {
        stopped = true;
      },
    };
    for (let node: MiniNode | null = target; node && !stopped; node = node.parent) {
      event.currentTarget = node;
      for (const listener of [
        ...(node.handlers.get(type) ?? []),
        ...(node.listeners.get(type) ?? []),
      ])
        listener(event);
    }
  }

  /** :active：按下时目标与祖先都算按着（同浏览器） */
  private press(target: MiniNode, pressed: boolean) {
    for (let node: MiniNode | null = target; node; node = node.parent) {
      if (node.pressed === pressed) continue;
      node.pressed = pressed;
      node.changed();
    }
  }
}

/** 节点在模板里的层级：根节点的子节点是 0；不小于模板层数的画在递归组件里 */
function levelOf(node: MiniNode): number {
  let level = -1;
  for (let current = node.parent; current; current = current.parent) level++;
  return level;
}

/** svg 子树里的节点 → 那个 svg；不在 svg 里时 undefined */
function svgRoot(node: MiniNode): MiniNode | undefined {
  for (let current: MiniNode | null = node; current; current = current.parent)
    if (current.tag === 'svg') return current;
  return undefined;
}

/** 浏览器不给禁用的表单控件（及其里面的元素）派发 click */
function insideDisabledControl(node: MiniNode): boolean {
  for (let current: MiniNode | null = node; current; current = current.parent)
    if (FORM_CONTROLS.has(current.tag) && current.attribute('disabled') !== undefined) return true;
  return false;
}

/** 页面实例 → 它的 Vue 应用与宿主；同一个页面可能在页面栈里开多次，不能放在闭包里 */
const live = new Set<PageHost>();
let watchingTheme = false;

/** 读系统的深浅色，并在系统切换时让所有页面重新展开样式（只订阅一次） */
function followColorScheme(api: MiniApi) {
  const info = api.getAppBaseInfo?.() ?? (api.getSystemInfoSync() as { theme?: 'light' | 'dark' });
  setColorScheme(info.theme === 'dark' ? 'dark' : 'light');
  if (watchingTheme || !api.onThemeChange) return;
  watchingTheme = true;
  api.onThemeChange(({ theme }) => {
    setColorScheme(theme === 'dark' ? 'dark' : 'light');
    for (const host of live) host.restyle();
  });
}

const mounted = new WeakMap<object, { app: App<MiniNode>; host: PageHost; hooks: PageHooks }>();

/**
 * 递归组件（模板层数用完后的那一段，build/templates.ts）里的事件：组件的方法拿不到页面实例，交给页面栈顶的页面——
 * 能收到触摸的只有正在显示的页面
 */
declare const getCurrentPages: (() => object[]) | undefined;

export function dispatchToCurrentPage(event: NativeEvent) {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
  const page = pages[pages.length - 1];
  if (page) mounted.get(page)?.host.dispatch(event);
}

/** 页面参数：跳转时编码过（lifecycle.ts 的 pageUrl），这里解开；解不开的原样给 */
function decodeQuery(query: Record<string, string> = {}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

/** 页面的选项：交给小程序的 Page() */
export function pageOptions(component: Component, setup?: (app: App<MiniNode>) => void) {
  return {
    data: { root: { cn: [] }, ss: {} },
    onLoad(this: PageInstance, query: Record<string, string>) {
      const current = platform();
      if (current) {
        setWindowWidth(windowSize(current.api).width);
        followColorScheme(current.api);
      }
      const host = new PageHost(this, new MiniNode('#root'));
      const app = createMiniApp(component, { query: decodeQuery(query) });
      const hooks = createPageHooks();
      app.provide(HOST_KEY, createMiniHost(host));
      app.provide(PAGE_HOOKS_KEY, hooks);
      setup?.(app);
      app.mount(host.root);
      // 浮层根排在应用的节点后面：后渲染的盖在上面
      host.root.insertBefore(host.overlay, null);
      mounted.set(this, { app, host, hooks });
      live.add(host);
    },
    onUnload(this: PageInstance) {
      const page = mounted.get(this);
      if (page) live.delete(page.host);
      page?.app.unmount();
      mounted.delete(this);
    },
    onShow(this: PageInstance) {
      const page = mounted.get(this);
      if (page) emitPageEvent(page.hooks, 'show');
    },
    onHide(this: PageInstance) {
      const page = mounted.get(this);
      if (page) emitPageEvent(page.hooks, 'hide');
    },
    onReachBottom(this: PageInstance) {
      const page = mounted.get(this);
      if (page) emitPageEvent(page.hooks, 'reachBottom');
    },
    /** 模板上所有事件的入口（build/templates.ts） */
    eh(this: PageInstance, event: NativeEvent) {
      mounted.get(this)?.host.dispatch(event);
    },
    /** 页面滚动：记下位置，通知组件（吸顶、回到顶部、下拉刷新） */
    onPageScroll(this: PageInstance, { scrollTop }: { scrollTop: number }) {
      const host = mounted.get(this)?.host;
      if (!host) return;
      host.scrollTop = scrollTop;
      for (const listener of host.scrollListeners) listener(scrollTop);
    },
  };
}

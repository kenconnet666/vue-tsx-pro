/**
 * 页面：一个 Vue 应用挂在页面的根节点上，节点变化在微任务里攒成一次 setData（按路径只发变了的字段），
 * 模板（build/templates.ts）按数据里的 t 选元素模板递归渲染。小程序事件只在目标节点上处理一次，冒泡由这里按节点树做。
 *
 * 数据的形状：{ root: { cn: [节点…] } }，节点是 { s: 编号, t: 模板类型, c: 类名, st: 样式, v: 文字, cn: 子节点 }
 */
import type { App, Component } from 'vue';
import { FORM_CONTROLS, templateOf } from './elements.ts';
import { MiniNode, type MiniEvent, type NodeHost } from './node.ts';
import { createMiniApp } from './renderer.ts';
import { resolveStyle, setWindowWidth } from './style.ts';
import { svgMaskStyle } from './svg.ts';

/** 页面实例上要用到的部分（微信、支付宝相同） */
interface PageInstance {
  setData(data: Record<string, unknown>): void;
}

/** 小程序事件里要用到的部分；支付宝的事件名是驼峰（touchStart），统一转小写 */
interface NativeEvent {
  type: string;
  detail?: unknown;
  currentTarget?: { dataset?: Record<string, string> };
}

/** 节点数据的字段 */
type NodeData = Record<string, unknown>;

/** 小程序事件 → 组件收到的事件名 */
const EVENT_TYPES: Readonly<Record<string, string>> = {
  tap: 'click',
  touchstart: 'touchstart',
  touchend: 'touchend',
  touchcancel: 'touchcancel',
  input: 'input',
  confirm: 'change',
  blur: 'blur',
  focus: 'focus',
};

/** 透传到模板上的元素属性（input 的 value、placeholder 等）；其余属性只参与样式条件 */
const TEMPLATE_ATTRS = ['src', 'value', 'placeholder', 'type', 'maxlength'] as const;

class PageHost implements NodeHost {
  private readonly nodes = new Map<string, MiniNode>();
  private readonly sent = new WeakMap<MiniNode, NodeData>();
  private readonly touched = new Set<MiniNode>();
  private readonly restructured = new Set<MiniNode>();
  private scheduled = false;
  private readonly page: PageInstance;
  readonly root: MiniNode;

  constructor(page: PageInstance, root: MiniNode) {
    this.page = page;
    this.root = root;
    root.host = this;
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
    this.restructured.clear();
    this.touched.clear();
    if (Object.keys(payload).length) this.page.setData(payload);
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
    if (fields.t !== 'v') return fields;
    return { ...fields, cn: node.children.map((child) => this.serialize(child)) };
  }

  /** 节点自己的字段（不含子节点） */
  private fieldsOf(node: MiniNode): NodeData {
    this.nodes.set(node.sid, node);
    const type = templateOf(node.tag);
    if (type === 'x') return { s: node.sid, t: type, v: node.text };
    if (type === 'n') return { s: node.sid, t: type };
    const { className, style } = resolveStyle(node);
    const data: NodeData = {
      s: node.sid,
      t: type,
      c: className,
      st: type === 'svg' ? `${svgMaskStyle(node)};${style}` : style,
    };
    for (const name of TEMPLATE_ATTRS) {
      const value = node.attribute(name);
      if (value !== undefined) data[name] = value;
    }
    return data;
  }

  /** 小程序事件 → 组件事件：模板用 catch 绑定，只有最内层的节点收到，从它起按节点树冒泡 */
  dispatch(native: NativeEvent) {
    const sid = native.currentTarget?.dataset?.s;
    if (!sid) return;
    const target = this.nodes.get(sid);
    const nativeType = native.type.toLowerCase();
    const type = EVENT_TYPES[nativeType];
    if (!target || !type) return;
    if (nativeType === 'touchstart' || nativeType === 'touchend' || nativeType === 'touchcancel')
      this.press(target, nativeType === 'touchstart');
    if (type === 'click' && insideDisabledControl(target)) return;
    let stopped = false;
    const event: MiniEvent = {
      type,
      target,
      currentTarget: target,
      defaultPrevented: false,
      detail: native.detail,
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

/** 微信（wx）与支付宝（my）的全局 API 里用到的部分；getWindowInfo 是微信新版的，旧的 getSystemInfoSync 已废弃 */
interface MiniApi {
  getWindowInfo?(): { windowWidth: number };
  getSystemInfoSync(): { windowWidth: number };
}
declare const wx: MiniApi | undefined;
declare const my: MiniApi | undefined;

/** 当前平台的全局 API；不在小程序里（测试）时 undefined */
const platformApi = (): MiniApi | undefined =>
  typeof wx !== 'undefined' ? wx : typeof my !== 'undefined' ? my : undefined;

/** 页面实例 → 它的 Vue 应用与宿主；同一个页面可能在页面栈里开多次，不能放在闭包里 */
const mounted = new WeakMap<object, { app: App<MiniNode>; host: PageHost }>();

/** 页面的选项：交给小程序的 Page() */
export function pageOptions(component: Component, setup?: (app: App<MiniNode>) => void) {
  return {
    data: { root: { cn: [] } },
    onLoad(this: PageInstance, query: Record<string, string>) {
      const api = platformApi();
      if (api) setWindowWidth((api.getWindowInfo?.() ?? api.getSystemInfoSync()).windowWidth);
      const host = new PageHost(this, new MiniNode('#root'));
      const app = createMiniApp(component, { query });
      setup?.(app);
      app.mount(host.root);
      mounted.set(this, { app, host });
    },
    onUnload(this: PageInstance) {
      mounted.get(this)?.app.unmount();
      mounted.delete(this);
    },
    /** 模板上所有事件的入口（build/templates.ts） */
    eh(this: PageInstance, event: NativeEvent) {
      mounted.get(this)?.host.dispatch(event);
    },
  };
}

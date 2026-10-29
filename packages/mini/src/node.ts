/**
 * 小程序里的节点树：Vue 渲染器（renderer.ts）往这里增删改，页面（page.ts）把变化攒成一次 setData。
 * 只实现组件和样式引擎实际用到的那点 DOM：属性、事件、className、style.setProperty、classList；
 * 没有布局信息，测量类的 API 返回零值。
 */
import { BOOLEAN_ATTRS } from './elements.ts';

/** 一个触点：视口坐标与页面坐标 */
export interface MiniTouch {
  readonly identifier: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
}

/** 小程序事件转成的 DOM 风格事件：组件的 onClick、onTouchstart 收到它 */
export interface MiniEvent {
  readonly type: string;
  readonly target: MiniNode;
  currentTarget: MiniNode;
  defaultPrevented: boolean;
  /** 小程序原始事件的 detail（input 的 value 等） */
  readonly detail: unknown;
  /** 触摸事件：屏幕上的触点（同 TouchEvent.touches 的形状，只有坐标） */
  readonly touches: readonly MiniTouch[];
  /** 触摸事件：这次变化的触点（touchend 时 touches 已经空了，坐标在这里） */
  readonly changedTouches: readonly MiniTouch[];
  /** 键盘事件的键：输入框里按了键盘的确认键时是 Enter（小程序的 confirm 转成 keydown） */
  readonly key?: string;
  preventDefault(): void;
  stopPropagation(): void;
}

export type Listener = (event: MiniEvent) => void;

/** 节点所在的页面：节点变化时告诉它，它负责合并成 setData（page.ts） */
export interface NodeHost {
  /** 节点自己的字段变了（类名、样式、属性、文字） */
  touch(node: MiniNode): void;
  /** 节点的子节点列表变了 */
  restructure(node: MiniNode): void;
}

let nextId = 0;

export class MiniNode {
  /** 模板里的 data-s，事件按它找回节点 */
  readonly sid = (nextId++).toString(36);
  parent: MiniNode | null = null;
  readonly children: MiniNode[] = [];
  /** 文本节点的文字 */
  text = '';
  /** 普通属性：aria-*、data-* 统一成连字符写法 */
  readonly attrs = new Map<string, unknown>();
  /** 渲染时的事件属性（onClick 等）：事件名 → 处理函数；随重新渲染整体替换 */
  readonly handlers = new Map<string, Listener[]>();
  /** addEventListener 加上的 */
  readonly listeners = new Map<string, Listener[]>();
  className = '';
  /** 行内样式：Vue 的 style 绑定、动态样式的变量、样式绑定直接改的变量；排在类展开的样式后面 */
  readonly inline = new Map<string, string>();
  /** 正被按着（:active） */
  pressed = false;
  /** 根节点才有：所在的页面 */
  host: NodeHost | null = null;

  /** Web 标签（div、span、button），文本节点是 #text，注释是 #comment */
  readonly tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }

  static text(text: string) {
    const node = new MiniNode('#text');
    node.text = text;
    return node;
  }

  get nextSibling(): MiniNode | null {
    if (!this.parent) return null;
    const siblings = this.parent.children;
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }

  /** 沿父节点找到页面 */
  private get page(): NodeHost | null {
    return this.parent ? this.parent.page : this.host;
  }

  /** 自己的字段变了 */
  changed() {
    this.page?.touch(this);
  }

  insertBefore(child: MiniNode, anchor: MiniNode | null) {
    child.parent?.removeChild(child);
    const index = anchor ? this.children.indexOf(anchor) : -1;
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    child.parent = this;
    this.page?.restructure(this);
  }

  removeChild(child: MiniNode) {
    const index = this.children.indexOf(child);
    if (index < 0) return;
    this.children.splice(index, 1);
    child.parent = null;
    this.page?.restructure(this);
  }

  setChildren(children: MiniNode[]) {
    for (const child of this.children) child.parent = null;
    this.children.splice(0, this.children.length, ...children);
    for (const child of children) child.parent = this;
    this.page?.restructure(this);
  }

  /** 属性的字符串值；没有这个属性时 undefined（布尔属性为 false 时也算没有） */
  attribute(name: string): string | undefined {
    const value = this.attrs.get(name);
    if (value === undefined || value === null) return undefined;
    if (value === false && BOOLEAN_ATTRS.has(name)) return undefined;
    if (value === true) return BOOLEAN_ATTRS.has(name) ? '' : 'true';
    // 对象值（少见）按 JSON 写出，免得变成 [object Object]
    return typeof value === 'object' ? JSON.stringify(value) : String(value as string | number);
  }

  setAttribute(name: string, value: unknown) {
    this.attrs.set(name, value);
    this.changed();
  }

  /** 输入框的值：用户输入时运行时随事件写回（page.ts），组件照 DOM 的写法读 `event.target.value` */
  get value(): string {
    return this.attribute('value') ?? '';
  }

  /** 让输入框获得焦点：模板的 focus 属性；失焦时运行时去掉 */
  focus() {
    this.setAttribute('autofocus', true);
  }

  /** 让输入框失去焦点 */
  blur() {
    this.removeAttribute('autofocus');
  }

  getAttribute(name: string): string | null {
    return this.attribute(name) ?? null;
  }

  removeAttribute(name: string) {
    this.attrs.delete(name);
    this.changed();
  }

  addEventListener(type: string, listener: Listener) {
    const list = this.listeners.get(type);
    if (list) list.push(listener);
    else this.listeners.set(type, [listener]);
  }

  removeEventListener(type: string, listener: Listener) {
    const list = this.listeners.get(type);
    const index = list?.indexOf(listener) ?? -1;
    if (index >= 0) list!.splice(index, 1);
  }

  /** 样式引擎的绑定（bindings.ts）直接改变量用；赋值写法（vShow 的 style.display）也走这里 */
  readonly style = new Proxy(
    {
      setProperty: (name: string, value: string) => {
        this.inline.set(name, value);
        this.changed();
      },
      removeProperty: (name: string) => {
        this.inline.delete(name);
        this.changed();
      },
    },
    {
      set: (target, key, value) => {
        if (typeof key !== 'string') return false;
        const name = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        if (value === '' || value === null) target.removeProperty(name);
        else target.setProperty(name, String(value));
        return true;
      },
    },
  ) as {
    setProperty(name: string, value: string): void;
    removeProperty(name: string): void;
  } & Record<string, unknown>;

  /** 样式引擎的 css.select 就地换组合类用 */
  readonly classList = {
    add: (...names: string[]) => this.updateClasses((list) => list.push(...names)),
    remove: (...names: string[]) =>
      this.updateClasses((list) => {
        for (const name of names) {
          const index = list.indexOf(name);
          if (index >= 0) list.splice(index, 1);
        }
      }),
    replace: (from: string, to: string) =>
      this.updateClasses((list) => {
        const index = list.indexOf(from);
        if (index >= 0) list[index] = to;
      }),
    contains: (name: string) => this.className.split(/\s+/).includes(name),
  };

  private updateClasses(edit: (list: string[]) => void) {
    const list = this.className.split(/\s+/).filter(Boolean);
    edit(list);
    this.className = list.join(' ');
    this.changed();
  }

  // 小程序里拿不到同步的布局信息：测量类的 API 给零值，组件按"没有尺寸"处理
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
}

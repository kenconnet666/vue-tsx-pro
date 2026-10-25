/**
 * 开发模式下把元素上的样式绑定更新记到 Vue devtools 的时间线（“样式绑定”一层）：这些更新由元素上的 effect 直接改 DOM，
 * 组件不重新渲染，devtools 的组件更新事件里看不到。每条记下哪个组件的哪个元素、换了什么类、改了哪些变量。
 *
 * 只在开发模式、页面装了 devtools（有全局钩子）时载入 @vue/devtools-api；生产构建里 DEV 是 false，整段被去掉。
 */
import type { App, ComponentInternalInstance } from 'vue';

// 模块内声明：运行时代码不依赖 Node 的类型，也不与使用方装的 @types/node 冲突
declare const process: { env: Record<string, string | undefined> };

/** 开发模式（打包工具把 process.env.NODE_ENV 换成字面量，生产构建里这段代码被去掉） */
export const DEV = process.env.NODE_ENV !== 'production';

const LAYER = 'vue-tsx-pro:style-bindings';

/** 一次更新里改了什么 */
export interface BindingChange {
  /** 换类：之前与之后（引擎给的那几个类） */
  className?: readonly [before: string, after: string];
  /** 改了的变量：名字 → 新值（删掉的是 null） */
  variables: Record<string, string | null>;
}

interface TimelineApi {
  now(): number;
  addTimelineEvent(options: {
    layerId: string;
    event: { time: number; title: string; subtitle?: string; data: Record<string, unknown> };
  }): void;
}

/** 每个应用的时间线接口；载入中时为 Promise */
const apis = new WeakMap<App, TimelineApi | Promise<TimelineApi | null> | null>();

/** 页面装了 devtools（扩展或独立版注入的全局钩子） */
const hasDevtools = () =>
  typeof window !== 'undefined' &&
  !!(window as { __VUE_DEVTOOLS_GLOBAL_HOOK__?: unknown }).__VUE_DEVTOOLS_GLOBAL_HOOK__;

function timeline(app: App): TimelineApi | Promise<TimelineApi | null> | null {
  if (apis.has(app)) return apis.get(app)!;
  const loading = import('@vue/devtools-api')
    .then(
      ({ setupDevtoolsPlugin }) =>
        new Promise<TimelineApi>((resolve) =>
          setupDevtoolsPlugin(
            {
              id: LAYER,
              label: 'vue-tsx-pro 样式',
              packageName: '@vue-tsx-pro/tsx',
              app,
              enableEarlyProxy: true,
            },
            (api) => {
              api.addTimelineLayer({ id: LAYER, label: '样式绑定', color: 0x42b883 });
              resolve(api as unknown as TimelineApi);
            },
          ),
        ),
    )
    .catch(() => null)
    .then((api) => {
      apis.set(app, api);
      return api;
    });
  apis.set(app, loading);
  return loading;
}

/** 记一条“样式绑定更新”：只在开发模式、装了 devtools 时调用有效 */
export function recordBindingUpdate(
  instance: ComponentInternalInstance | null,
  element: Element,
  change: BindingChange,
) {
  if (!instance || !hasDevtools()) return;
  const name = instance.type.name ?? instance.type.__name ?? '匿名组件';
  const changed = Object.keys(change.variables).length;
  const event = {
    title: name,
    subtitle: [change.className && '换类', changed && `改变量 ×${changed}`]
      .filter(Boolean)
      .join('，'),
    data: {
      组件: name,
      元素: describe(element),
      ...(change.className && { 换类: `${change.className[0]} → ${change.className[1]}` }),
      ...(changed && { 变量: change.variables }),
    },
  };
  const api = timeline(instance.appContext.app);
  const add = (target: TimelineApi | null) =>
    target?.addTimelineEvent({ layerId: LAYER, event: { time: target.now(), ...event } });
  if (api instanceof Promise) void api.then(add);
  else add(api);
}

/** 元素的简短描述：标签、id、使用方给的类（不含引擎生成的 x 开头的类） */
function describe(element: Element) {
  const id = element.id ? `#${element.id}` : '';
  const classes = [...element.classList]
    .filter((name) => !/^x[0-9a-z]+$/.test(name))
    .map((name) => `.${name}`)
    .join('');
  return `<${element.tagName.toLowerCase()}${id}${classes}>`;
}

/**
 * 部件 props 的类型与合并规则（COMPONENTS.md §2）。
 *
 * 组件给部件的属性分两层：可被使用方覆盖的默认属性（defaults），以及组件状态决定、
 * 不允许覆盖的受管属性（managed，如 role、aria-expanded）。合并规则：
 *   - sx：默认在前、使用方其次、受管最后，StyleX 后者覆盖前者
 *   - class、style：依次排列成数组，交给 Vue 统一处理（它们也可能是数组或对象）
 *   - 事件 onXxx：使用方先执行，调用了 event.preventDefault() 就跳过组件自己的处理
 *   - ref：各方都拿到元素
 *   - 其他属性：受管 > 使用方 > 默认
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { JSX } from '@vue-tsx-pro/tsx/jsx-runtime';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { Ref } from 'vue';

/**
 * 原生元素部件的 props：该元素的属性加上 sx；去掉组件管理的属性与 children（内容走组件自己的 prop）。
 * 形如 `propsInput?: PartProps<'input', 'value' | 'aria-invalid'>`。
 */
export type PartProps<
  Tag extends keyof JSX.IntrinsicElements,
  Managed extends string = never,
> = Omit<JSX.IntrinsicElements[Tag], Managed | 'children'> & { sx?: StyleXStyles };

type Props = Record<string, unknown>;
type Handler = (...args: unknown[]) => unknown;
type RefSetter = ((element: unknown) => void) | Ref<unknown>;

/** 一层属性：Target 是标签名（'svg'）时为该元素的属性加 sx，是 props 类型（IconProps）时就是它 */
type PropsLayer<Target> = Partial<
  Target extends keyof JSX.IntrinsicElements ? PartProps<Target> : Target
>;

/**
 * 合并部件的三层属性：组件默认、使用方传入、组件受管，规则见文件开头。
 * 用类型参数写明属性落到哪里，三层的对象字面量才有补全、悬停说明与类型检查：
 *   mergeProps<'svg'>(默认, rest, 受管)、mergeProps<IconProps>({ sx: … }, propsIcon)
 */
export function mergeProps<Target = Props>(
  defaults: PropsLayer<Target>,
  user: PropsLayer<Target> = {},
  managed: PropsLayer<Target> = {},
): PropsLayer<Target> {
  const layers = [defaults, user, managed] as Props[];
  const [defaultLayer, userLayer, managedLayer] = layers as [Props, Props, Props];
  const merged: Props = { ...defaults, ...user, ...managed };

  for (const key of ['sx', 'class', 'style']) {
    const values = present(layers.map((layer) => layer[key]));
    if (values.length) merged[key] = values;
  }

  const refs = present(layers.map((layer) => layer.ref as RefSetter | undefined));
  if (refs.length > 1) {
    merged.ref = (element: unknown) => refs.forEach((ref) => setRef(ref, element));
  }

  for (const key of new Set(layers.flatMap(Object.keys))) {
    if (!/^on[A-Z]/.test(key)) continue;
    const internal = [defaultLayer[key], managedLayer[key]];
    const handler = mergeHandlers(userLayer[key] as Handler | undefined, internal);
    if (handler) merged[key] = handler;
  }
  return merged as PropsLayer<Target>;
}

/** 原生元素部件：把 sx 换成 StyleX 生成的 class 与 style，再与已有的 class、style 合并 */
export function elementProps<P extends object>(props: P): Omit<P, 'sx'> {
  const { sx, ...rest } = props as P & Props;
  if (sx == null) return rest as Omit<P, 'sx'>;
  const compiled = stylex.attrs(sx as StyleXStyles);
  return {
    ...rest,
    class: present([rest.class, compiled.class]),
    style: present([compiled.style, rest.style]),
  } as Omit<P, 'sx'>;
}

/**
 * 使用方的回调先执行，它调用了 event.preventDefault() 就跳过组件自己的回调。
 * 只有一方提供回调时返回 undefined，保留展开合并的结果即可。
 */
function mergeHandlers(user: Handler | undefined, internal: unknown[]): Handler | undefined {
  const own = present(internal) as Handler[];
  if (own.length + (user ? 1 : 0) < 2) return undefined;
  return (...args) => {
    user?.(...args);
    const event = args[0];
    if (event instanceof Event && event.defaultPrevented) return;
    own.forEach((handler) => handler(...args));
  };
}

function setRef(ref: RefSetter, element: unknown) {
  if (typeof ref === 'function') ref(element);
  else ref.value = element;
}

const present = <T>(values: readonly (T | null | undefined)[]) =>
  values.filter((value): value is T => value != null);

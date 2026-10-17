/**
 * 部件 props 的类型与合并规则（COMPONENTS.md §2）。
 *
 * 组件给部件的属性分两层：可被使用方覆盖的默认属性（defaults），以及组件状态决定、
 * 不允许覆盖的受管属性（managed，如 role、aria-expanded）。合并规则：
 *   - sx：默认在前、使用方其次、受管最后，StyleX 后者覆盖前者
 *   - class：拼接；style：依次叠加
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

const isHandler = (key: string) => /^on[A-Z]/.test(key);

export function mergeProps(defaults: Props, user: Props = {}, managed: Props = {}): Props {
  const merged: Props = { ...defaults, ...user, ...managed };
  const layers = [defaults, user, managed];

  const sx = layers.map((layer) => layer.sx).filter((value) => value != null);
  if (sx.length) merged.sx = sx;
  const classes = layers.map((layer) => layer.class).filter(Boolean);
  if (classes.length) merged.class = classes.join(' ');
  const styles = layers.map((layer) => layer.style).filter((value) => value != null);
  if (styles.length) merged.style = styles;

  const refs = layers
    .map((layer) => layer.ref as RefSetter | undefined)
    .filter((ref) => ref != null);
  if (refs.length > 1)
    merged.ref = (element: unknown) => refs.forEach((ref) => setRef(ref, element));

  for (const key of new Set(layers.flatMap(Object.keys))) {
    if (!isHandler(key)) continue;
    const userHandler = user[key] as Handler | undefined;
    const internal = [defaults[key], managed[key]].filter(
      (handler) => handler != null,
    ) as Handler[];
    if (internal.length + (userHandler ? 1 : 0) < 2) continue;
    merged[key] = (...args: unknown[]) => {
      userHandler?.(...args);
      const event = args[0];
      if (event instanceof Event && event.defaultPrevented) return;
      internal.forEach((handler) => handler(...args));
    };
  }
  return merged;
}

/** 原生元素部件：把 sx 换成 StyleX 生成的 class 与 style，再与已有的 class、style 合并 */
export function elementProps(props: Props): Props {
  const { sx, ...rest } = props;
  if (sx == null) return rest;
  const compiled = stylex.attrs(sx as StyleXStyles);
  return {
    ...rest,
    class: [rest.class, compiled.class].filter(Boolean).join(' ') || undefined,
    style: [compiled.style, rest.style].filter((value) => value != null),
  };
}

function setRef(ref: RefSetter, element: unknown) {
  if (typeof ref === 'function') ref(element);
  else ref.value = element;
}

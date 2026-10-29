/**
 * 部件属性的类型与合并（MOBILE.md §2）：组件给部件的属性分三层——可被覆盖的默认层、使用方传入的、组件状态决定的受管层。
 *   - sx：默认在前、使用方其次、受管最后，后者覆盖前者
 *   - class、style：依次排成数组交给 Vue
 *   - 事件 onXxx：使用方先执行，调用了 event.preventDefault() 就跳过组件自己的处理
 *   - ref：各方都拿到元素
 *   - 其他属性：受管 > 使用方 > 默认
 * 规则与桌面组件库相同，实现独立：小程序里没有 Event 全局，取消与否看事件对象上的 defaultPrevented。
 */
import { mergeRefs, type RefSetter } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { IntrinsicProps, JSX } from '@zerodep-dev/vue-tsx-pro-tsx/jsx-runtime';
import { css, type SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
// 登记主题 tokens（样式里的 '_md' 靠它）：每个组件都经过这里合并属性，渲染之前一定登记过
import '../theme/tokens';

/**
 * 原生元素部件的属性：该元素的属性加上 sx，去掉组件管理的属性与 children（内容走组件自己的 prop）。
 * 形如 `propsInput?: PartProps<'input', 'value' | 'aria-invalid'>`
 */
export type PartProps<
  Tag extends keyof JSX.IntrinsicElements,
  Managed extends string = never,
> = Omit<IntrinsicProps<Tag>, Managed | 'children'> & { sx?: SxStyles };

/**
 * data-* 写进对象字面量（部件属性、合并的各层）时包一层：元素的属性类型不收 data-* 键。
 * 值为 false 的去掉：Vue 会把它写成 data-x="false"，样式里的 [data-x] 照样成立
 */
export function dataAttrs(
  attrs: Record<`data-${string}`, string | number | boolean | undefined>,
): Record<`data-${string}`, string | number | true> {
  const result: Record<`data-${string}`, string | number | true> = {};
  for (const [name, value] of Object.entries(attrs) as [`data-${string}`, unknown][])
    if (value !== false && value !== undefined) result[name] = value as string | number | true;
  return result;
}

type Props = Record<string, unknown>;
type Handler = (...args: unknown[]) => unknown;

/** 一层属性：Target 是标签名时为该元素的属性加 sx，是组件的 props 类型时就是它 */
type PropsLayer<Target> = Partial<
  [Target] extends [keyof JSX.IntrinsicElements] ? PartProps<Target> : Target
>;

/**
 * 合并部件的三层属性：`mergeProps<IconProps>({ sx: … }, propsIcon)`；原生元素用 mergeAttrs。
 * 只有默认层时原样返回；只有两层以上都给了同名事件时才包一层回调（渲染路径上每个部件都要走这里）
 */
export function mergeProps<Target = Props>(
  defaults: PropsLayer<Target>,
  user?: PropsLayer<Target>,
  managed?: PropsLayer<Target>,
): PropsLayer<Target> {
  const base = defaults as Props;
  const own = hasKeys(user) ? (user as Props) : undefined;
  const fixed = hasKeys(managed) ? (managed as Props) : undefined;
  if (!own && !fixed) return defaults;
  const merged: Props = { ...base, ...own, ...fixed };

  for (const key of LISTED_KEYS) {
    const values = present(base[key], own?.[key], fixed?.[key]);
    if (values) merged[key] = values;
  }
  const refs = present(base.ref, own?.ref, fixed?.ref) as RefSetter[] | undefined;
  if (refs && refs.length > 1) merged.ref = mergeRefs(refs);

  // 同名事件：使用方的先执行；使用方传 undefined（onClick={cond ? fn : undefined}）不盖掉组件自己的
  const keys = new Set([...Object.keys(own ?? {}), ...Object.keys(fixed ?? {})]);
  for (const key of keys) {
    if (!isHandlerKey(key)) continue;
    const handler = mergeHandlers(own?.[key] as Handler | undefined, [base[key], fixed?.[key]]);
    merged[key] = handler ?? own?.[key] ?? fixed?.[key] ?? base[key];
  }
  return merged as PropsLayer<Target>;
}

/**
 * 子组件部件的合并：默认层写齐子组件的必填 props，结果就是完整的 props 类型，不必断言：
 *   <Icon {...mergePartProps<IconProps>({ icon: X, sx: styles.icon }, propsIcon)} />
 */
export function mergePartProps<P extends object>(
  defaults: P,
  user?: Partial<P>,
  managed?: Partial<P>,
): P {
  return mergeProps(
    defaults as Props,
    user as Props | undefined,
    managed as Props | undefined,
  ) as P;
}

/** 原生元素部件的合并：合并后把 sx 换成 class 与 style，结果直接展开到元素上 */
export function mergeAttrs<Tag extends keyof JSX.IntrinsicElements>(
  defaults: PropsLayer<Tag>,
  user?: PropsLayer<Tag>,
  managed?: PropsLayer<Tag>,
): Omit<PropsLayer<Tag>, 'sx' | 'children'> {
  return elementProps(mergeProps<Tag>(defaults, user, managed));
}

/** 原生元素：把 sx 换成样式引擎生成的 class 与 style，与已有的 class、style 合并；去掉 children */
export function elementProps<P extends object>(props: P): Omit<P, 'sx' | 'children'> {
  // 解构出的 rest 是新对象，之后直接往上写
  const { sx, children: _children, ...rest } = props as P & Props;
  if (sx == null) return rest as Omit<P, 'sx' | 'children'>;
  const compiled = compileSx(sx as SxStyles);
  const element = rest as Props;
  // 响应式绑定的 ref（元素挂上后改变量）与使用方的 ref 都要拿到元素
  if (compiled.ref)
    element.ref =
      element.ref != null ? mergeRefs([element.ref as RefSetter, compiled.ref]) : compiled.ref;
  element.class = present(rest.class, compiled.class) ?? [];
  element.style = present(compiled.style, rest.style) ?? [];
  return rest as Omit<P, 'sx' | 'children'>;
}

/** 单个样式对象是不变的常量：按对象缓存 css.attrs 的结果 */
const compiledCache = new WeakMap<object, ReturnType<typeof css.attrs>>();
function compileSx(sx: SxStyles) {
  if (Array.isArray(sx) || typeof sx !== 'object' || sx === null) return css.attrs(sx);
  let compiled = compiledCache.get(sx);
  if (!compiled) compiledCache.set(sx, (compiled = css.attrs(sx)));
  return compiled;
}

/** onClick、onUpdate:_value：on 后面跟大写字母 */
const isHandlerKey = (key: string) => /^on[A-Z]/.test(key);

function hasKeys(layer: object | undefined): boolean {
  if (!layer) return false;
  for (const _ in layer) return true;
  return false;
}

/** 使用方的回调先执行，调用了 preventDefault 就跳过组件的；只有一方提供回调时返回 undefined */
function mergeHandlers(user: Handler | undefined, internal: unknown[]): Handler | undefined {
  const own = internal.filter((handler): handler is Handler => typeof handler === 'function');
  if (own.length + (user ? 1 : 0) < 2) return undefined;
  return (...args) => {
    user?.(...args);
    if ((args[0] as { defaultPrevented?: boolean } | undefined)?.defaultPrevented) return;
    for (const handler of own) handler(...args);
  };
}

/** 按层排列、要合并成数组的属性 */
const LISTED_KEYS = ['sx', 'class', 'style'] as const;

/** 几个值里不为空的那些，按原顺序成数组；都为空时 undefined */
function present(...values: unknown[]): unknown[] | undefined {
  const list = values.filter((value) => value != null);
  return list.length ? list : undefined;
}

/** 内容有没有东西：null、undefined、空字符串与布尔都算没有（`footer={cond && …}` 不成立时是 false） */
export function hasContent(node: VNodeChild): boolean {
  return node != null && typeof node !== 'boolean' && node !== '';
}

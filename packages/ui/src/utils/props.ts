/**
 * 部件 props 的类型与合并规则（COMPONENTS.md §2）。
 *
 * 组件给部件的属性分两层：可被使用方覆盖的默认属性（defaults），以及组件状态决定、
 * 不允许覆盖的受管属性（managed，如 role、aria-expanded）。合并规则：
 *   - sx：默认在前、使用方其次、受管最后，后者覆盖前者
 *   - class、style：依次排列成数组，交给 Vue 统一处理（它们也可能是数组或对象）
 *   - 事件 onXxx：使用方先执行，调用了 event.preventDefault() 就跳过组件自己的处理
 *   - ref：各方都拿到元素
 *   - aria-describedby：各层的 id 拼在一起（Field 的说明与使用方自己的提示都念得到）
 *   - 嵌套的部件属性 propsXxx：按这里的规则再合并一次，不整个替换
 *   - 其他属性：受管 > 使用方 > 默认
 *   - 值是 undefined 的键哪一层都不表态，留着前面几层的；要去掉前面的值写 null
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { IntrinsicProps, JSX } from '@zerodep-dev/vue-tsx-pro-tsx/jsx-runtime';
// 登记主题 tokens（样式里的 '_md' 靠它）：每个组件都经过这里合并属性，渲染之前一定登记过
import '../config/theme/tokens';
import type { StyleAttrs, SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { mergeRefs, ownProps, type RefSetter } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';

/**
 * 原生元素部件的 props：该元素的属性加上 sx；去掉组件管理的属性与 children（内容走组件自己的 prop）。
 * 形如 `propsInput?: PartProps<'input', 'value' | 'aria-invalid'>`。
 */
export type PartProps<
  Tag extends keyof JSX.IntrinsicElements,
  Managed extends string = never,
> = Omit<IntrinsicProps<Tag>, Managed | 'children'> & { sx?: SxStyles };

/**
 * 展开收起类组件（Collapsible、Popover）交给触发器的属性：展开到任意可聚焦元素上，
 * 形如 `trigger={(props) => <Button {...props}>更多</Button>}`。弹层另外加上 id、ref、aria-haspopup。
 */
export interface TriggerProps {
  /** 切换展开与收起 */
  onClick: (event: MouseEvent) => void;
  /** 当前是否展开，读屏据此播报“已展开 / 已折叠” */
  'aria-expanded': boolean;
  /** 被控制的内容区的 id */
  'aria-controls': string;
  /** 不可用：组件设了 disabled 时为 true，展开到按钮上就是原生的 disabled */
  disabled?: boolean;
}

/**
 * data-* 属性写进对象字面量（部件属性、mergeAttrs 的各层）：元素的属性类型不收 data-* 键，
 * 用它包一层再展开。JSX 上直接写 data-* 不需要它。
 *
 *   mergeAttrs<'td'>(defaults, user, { role: 'gridcell', ...dataAttrs({ 'data-in-range': inRange || undefined }) })
 */
export const dataAttrs = (attrs: Record<`data-${string}`, string | number | boolean | undefined>) =>
  attrs;

type Props = Record<string, unknown>;
type Handler = (...args: unknown[]) => unknown;

/**
 * 一层属性：Target 是标签名（'svg'）时为该元素的属性加 sx，是 props 类型（IconProps）时就是它。
 * 标签名的联合（'h1' | 'h2'，一个工厂生成的几个组件共用实现时）取这些标签共有的属性，所以这里不按联合分配
 */
type PropsLayer<Target> = Partial<
  [Target] extends [keyof JSX.IntrinsicElements] ? PartProps<Target> : Target
>;

/**
 * 合并部件的三层属性：组件默认、使用方传入、组件受管，规则见文件开头。
 * 用类型参数写明属性落到哪里，三层的对象字面量才有补全、悬停说明与类型检查：
 *   mergeProps<IconProps>({ sx: … }, propsIcon)；原生元素用 mergeAttrs<'svg'>(默认, rest, 受管)
 *
 * 渲染里每个部件每次都要合并，按最常见的情况走捷径：只有默认层时原样返回；
 * 只有两层以上都给了同名事件时才包一层回调。
 */
export function mergeProps<Target = Props>(
  defaults: PropsLayer<Target>,
  user?: PropsLayer<Target>,
  managed?: PropsLayer<Target>,
): PropsLayer<Target> {
  const base = defaults as Props;
  // ...rest 换成背后的普通对象：后面的展开与逐键遍历不再穿过 Proxy
  const own = ownProps(user as Props | undefined);
  const fixed = ownProps(managed as Props | undefined);
  if (!own && !fixed) return defaults;
  const merged: Props = { ...base };

  // 值是 undefined 的键不表态（`title: error`、`onClick={cond ? fn : undefined}` 没有值的时候）：留着前面几层的
  if (own) {
    for (const key in own) {
      const value = own[key];
      if (value === undefined) continue;
      const inner = base[key];
      const forced = fixed?.[key];
      if (inner == null && forced == null) merged[key] = value;
      else if (isHandlerKey(key)) merged[key] = chainHandlers(value as Handler, inner, forced);
      else if (isPartKey(key)) merged[key] = mergeParts(inner, value, forced);
      else merged[key] = value;
    }
  }
  if (fixed) {
    for (const key in fixed) {
      const value = fixed[key];
      if (value === undefined) continue;
      const mine = own?.[key];
      const inner = base[key];
      // 使用方也给了的事件与部件属性，上面已经连同受管层一起合并
      if (isHandlerKey(key)) {
        if (mine == null)
          merged[key] = inner == null ? value : chainHandlers(undefined, inner, value);
      } else if (isPartKey(key)) {
        if (mine == null) merged[key] = inner == null ? value : mergeParts(inner, undefined, value);
      } else merged[key] = value;
    }
  }

  for (const key of LISTED_KEYS) {
    const values = present3(base[key], own?.[key], fixed?.[key]);
    if (values) merged[key] = values;
  }
  // 使用方写了 sx：组件的、使用方的、受管的各成一段（css.layers），组件的组合与使用方的覆盖相加而不是相乘
  if (own?.sx != null)
    merged.sx = css.layers(base.sx as SxStyles, own.sx as SxStyles, fixed?.sx as SxStyles);

  const refs = present3(base.ref, own?.ref, fixed?.ref) as RefSetter[] | undefined;
  if (refs && refs.length > 1) merged.ref = mergeRefs(refs);

  const described = joinIds(base[DESCRIBED_BY], own?.[DESCRIBED_BY], fixed?.[DESCRIBED_BY]);
  if (described !== undefined) merged[DESCRIBED_BY] = described;
  return merged as PropsLayer<Target>;
}

const DESCRIBED_BY = 'aria-describedby';

/** 两层以上都写了 id 列表（aria-describedby）时拼在一起、去掉重复的；不足两层时返回 undefined，留着展开合并的结果 */
function joinIds(a: unknown, b: unknown, c: unknown): string | undefined {
  const lists = present3(a, b, c) as string[] | undefined;
  if (!lists || lists.length < 2) return undefined;
  return [...new Set(lists.join(' ').split(' ').filter(Boolean))].join(' ');
}

/** propsIcon、propsRemove：props 后面跟大写字母，值是另一个部件的属性（对象，或按项给属性的函数） */
function isPartKey(key: string) {
  const sixth = key.charCodeAt(5);
  return sixth >= 65 && sixth <= 90 && key.startsWith('props');
}

type PartLayer = Props | ((...args: unknown[]) => Props | undefined) | null | undefined;

/**
 * 嵌套的部件属性按同样的三层规则再合并一次：组件给子部件的默认（`propsRemove: { tabindex: -1 }`）
 * 不会因为使用方也写了这个部件就整个丢掉。有一层是按项给属性的函数时，结果也是函数
 */
function mergeParts(defaults: unknown, user: unknown, managed: unknown): unknown {
  const layers = [defaults, user, managed] as PartLayer[];
  // 不是对象也不是函数的值（写错了类型）：按普通属性处理，后面的层优先
  if (
    layers.some(
      (layer) => layer != null && typeof layer !== 'object' && typeof layer !== 'function',
    )
  )
    return managed ?? user ?? defaults;
  if (!layers.some((layer) => typeof layer === 'function'))
    return mergeProps((defaults ?? {}) as Props, user as Props, managed as Props);
  return (...args: unknown[]) => {
    const [inner, own, forced] = layers.map((layer) =>
      typeof layer === 'function' ? layer(...args) : layer,
    );
    return mergeProps(inner ?? {}, own ?? undefined, forced ?? undefined);
  };
}

/**
 * 子组件部件的合并：mergeProps 的规则，但默认层要写齐子组件的必填 props（如 Icon 的 icon），
 * 返回完整的 props 类型，展开到子组件上不必再断言：
 *   <Icon {...mergePartProps<IconProps>({ icon: X, sx: styles.icon }, propsIcon)} />
 */
export function mergePartProps<P extends object>(
  defaults: P,
  user?: Partial<P>,
  managed?: Partial<P>,
): P {
  // P 是组件 props 类型，不是标签名：按对象合并，结果的类型就是 P
  return mergeProps(
    defaults as Props,
    user as Props | undefined,
    managed as Props | undefined,
  ) as P;
}

/**
 * 原生元素部件的合并：mergeProps 的规则，再把 sx 换成 class 与 style（elementProps），结果直接展开到元素上：
 *   <svg {...mergeAttrs<'svg'>({ sx: styles.icon }, rest, { 'aria-hidden': true })} />
 */
export function mergeAttrs<Tag extends keyof JSX.IntrinsicElements>(
  defaults: PropsLayer<Tag>,
  user?: PropsLayer<Tag>,
  managed?: PropsLayer<Tag>,
): Omit<PropsLayer<Tag>, 'sx' | 'children'> {
  return elementProps(mergeProps<Tag>(defaults, user, managed));
}

/**
 * 原生元素部件：把 sx 换成样式引擎生成的 class 与 style，再与已有的 class、style 合并。
 * 去掉 children：它是内容不是元素属性（组件的 ...rest 里带着它，转交给子组件时要用）。
 */
export function elementProps<P extends object>(props: P): Omit<P, 'sx' | 'children'> {
  // 解构出的 rest 是新对象：之后直接往上写，不再复制一次（每个元素每次渲染都要走这里）
  const { sx, children: _children, ...rest } = props as P & Props;
  if (sx == null) return rest as Omit<P, 'sx' | 'children'>;
  const compiled = compileSx(sx as SxStyles);
  const element = rest as Props;
  // 响应式绑定的 ref（元素挂上后改变量）与使用方的 ref 都要拿到元素
  if (compiled.ref) {
    element.ref =
      element.ref != null ? mergeRefs([element.ref as RefSetter, compiled.ref]) : compiled.ref;
  }
  if (rest.class == null && rest.style == null) {
    if (compiled.class != null) element.class = compiled.class;
    if (compiled.style != null) element.style = compiled.style;
    return rest as Omit<P, 'sx' | 'children'>;
  }
  element.class = present3(rest.class, compiled.class) ?? [];
  element.style = present3(compiled.style, rest.style) ?? [];
  return rest as Omit<P, 'sx' | 'children'>;
}

/**
 * 编译好的样式是不变的常量：单个样式（不是数组）按对象缓存 css.attrs 的结果，
 * 根元素、图标这类每次渲染都是同一个样式的部件不必重复合并
 */
const compiledCache = new WeakMap<object, ReturnType<typeof css.attrs>>();
function compileSx(sx: SxStyles) {
  if (Array.isArray(sx) || typeof sx !== 'object' || sx === null) return css.attrs(sx);
  let compiled = compiledCache.get(sx);
  if (!compiled) compiledCache.set(sx, (compiled = css.attrs(sx)));
  return compiled;
}

/** onClick、onUpdate:_value：on 后面跟大写字母 */
function isHandlerKey(key: string) {
  const third = key.charCodeAt(2);
  return key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && third >= 65 && third <= 90;
}

/**
 * 同名事件合成一个：使用方的回调先执行，它调用了 event.preventDefault() 就跳过组件自己的（默认层、受管层依次）。
 * 调用前至少有两方给了回调
 */
function chainHandlers(user: Handler | undefined, inner: unknown, forced: unknown): Handler {
  return (...args) => {
    user?.(...args);
    const event = args[0];
    if (event instanceof Event && event.defaultPrevented) return;
    (inner as Handler | null | undefined)?.(...args);
    (forced as Handler | null | undefined)?.(...args);
  };
}

/** 按层排列、要合并成数组的属性 */
const LISTED_KEYS = ['sx', 'class', 'style'] as const;

/** 最多三个值里不为空的那些，按原顺序成数组；都为空时返回 undefined。渲染路径上用，不建中间数组 */
function present3(a: unknown, b: unknown, c?: unknown): unknown[] | undefined {
  if (a == null) {
    if (b == null) return c == null ? undefined : [c];
    return c == null ? [b] : [b, c];
  }
  if (b == null) return c == null ? [a] : [a, c];
  return c == null ? [a, b] : [a, b, c];
}

/**
 * 默认的 aria-labelledby（Field 的标签、弹层的触发器）：使用方写的 aria-labelledby 优先；使用方写了 aria-label 时
 * 不加默认的（aria-labelledby 会盖过 aria-label，使用方写的名称就白写了）
 */
export function defaultLabelledBy(
  attrs: { 'aria-label'?: string; 'aria-labelledby'?: string },
  fallback: string | undefined,
): string | undefined {
  return attrs['aria-labelledby'] ?? (attrs['aria-label'] == null ? fallback : undefined);
}

/**
 * 内容（插槽、标题、说明、错误这类 VNodeChild）有没有东西：null、undefined、空字符串与布尔都算没有。
 * 使用方常写 `error={cond && '…'}`、`aside={wide && <Panel />}`，条件不成立时是 false，不该渲染出空的外层
 */
export function hasContent(node: VNodeChild): boolean {
  return node != null && typeof node !== 'boolean' && node !== '';
}

/**
 * 把 css.attrs 的结果写到命令式创建的元素上（波纹、量取主题的探针）：class 与行内样式，
 * 自定义属性（动态样式的变量）名字原样、用 setProperty
 */
export function applyStyleAttrs(element: HTMLElement, { class: className, style }: StyleAttrs) {
  element.className = className ?? '';
  for (const [name, value] of Object.entries(style ?? {})) {
    const property = name.startsWith('--')
      ? name
      : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    element.style.setProperty(property, String(value));
  }
}

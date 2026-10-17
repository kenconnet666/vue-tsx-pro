/**
 * prop 访问器：编译器把 _component 的参数解构换成对这两个函数的调用。
 * 作者不直接使用它们；思路来自 Svelte 5 的 $.prop。
 *
 * 两者返回的都是真正的 Vue Ref（读写改写为 .value），因此 _ref(size) 可以交给 watch 等 Vue API。
 */
import { computed, shallowRef, toRef, watch, type Ref } from 'vue';

type Props = Record<string, unknown>;
type Emit = (event: string, ...args: unknown[]) => void;

/**
 * 只读 prop：父级传了值就用父级的，否则用默认值。
 *
 * 默认值第一次用到时才求值，并用 computed 缓存：
 *   - [] / {} / 函数调用每个实例各自一份，读多少次都是同一个值
 *   - 引用了其他 prop 的默认值（icon = pick(size)）会随那个 prop 更新
 */
export function prop<T>(props: Props, key: string, fallback?: () => T): Readonly<Ref<T>> {
  let fallbackValue: Readonly<Ref<T>> | undefined;
  return toRef(() => {
    const value = props[key];
    if (value !== undefined || !fallback) return value as T;
    fallbackValue ??= computed(fallback);
    return fallbackValue.value;
  });
}

/**
 * 双向 prop，走标准 v-model 协议（父级 v-model:key ⇔ key + onUpdate:key）：
 *   - 写入立即生效（之后的同步读取就是新值），并发出 update:key
 *   - 父级传入新值时同步覆盖本地值
 *   - 父级没有绑定时，就是组件自己的状态
 */
export function bindable<T>(
  props: Props,
  key: string,
  fallback: (() => T) | undefined,
  emit: Emit,
): Ref<T> {
  const initial = props[key] !== undefined ? (props[key] as T) : (fallback?.() as T);
  const local = shallowRef(initial);
  watch(
    () => props[key],
    (value) => {
      if (value !== undefined) local.value = value as T;
    },
    { flush: 'sync' },
  );
  return computed({
    get: () => local.value,
    set: (value) => {
      local.value = value;
      emit(`update:${key}`, value);
    },
  });
}

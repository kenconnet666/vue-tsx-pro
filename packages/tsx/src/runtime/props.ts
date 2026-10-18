/**
 * prop 访问器：编译器把 _component 的参数解构换成对这两个函数的调用。
 * 作者不直接使用它们；思路来自 Svelte 5 的 $.prop。
 *
 * 两者返回的都是真正的 Vue Ref（读写改写为 .value），因此 _toRef(size) 可以交给 watch 等 Vue API。
 */
import { computed, customRef, getCurrentInstance, nextTick, toRef, watch, type Ref } from 'vue';

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
 * 双向 prop，走标准 v-model 协议（父级 属性={_bind(x)} 编译为 key + onUpdate:key）。
 * 与 Vue 的 useModel 一样，父级同时传了值和 onUpdate:key 才算受控：
 *
 *   - 受控：值以父级为准。写入后同步读取先拿到新值，本轮更新结束时回到父级的值，
 *     所以父级拒绝或修正（例如限制最大值）时组件会跟着回去
 *   - 只传了值：作为初始值，组件可以在本地修改，父级传入新值时以父级为准
 *   - 都没传：就是组件自己的状态
 *
 * 父级传 undefined 等同没传，使用默认值（与普通 prop 一致）；写入总会发出 update:key。
 */
export function bindable<T>(
  props: Props,
  key: string,
  fallback: (() => T) | undefined,
  emit: Emit,
): Ref<T> {
  const instance = getCurrentInstance()!;
  const listener = `onUpdate:${key}`;
  const passed = (name: string) => {
    const raw = instance.vnode.props;
    return !!raw && (name in raw || hyphenate(name) in raw);
  };
  const isControlled = () => passed(key) && passed(listener);

  const fallbackValue = fallback?.() as T;
  const parentValue = () => (props[key] !== undefined ? (props[key] as T) : fallbackValue);
  let local = parentValue();
  /** 受控时写入的值，只在本轮更新内有效 */
  let pending: { value: T } | undefined;
  let writes = 0;

  return customRef((track, trigger) => {
    watch(
      () => props[key],
      (value) => {
        if (value !== undefined) local = value as T;
        trigger();
      },
      { flush: 'sync' },
    );
    return {
      get() {
        track();
        if (pending) return pending.value;
        return isControlled() ? parentValue() : local;
      },
      set(value) {
        local = value;
        if (isControlled()) {
          pending = { value };
          const write = ++writes;
          void nextTick(() => {
            if (write !== writes) return;
            pending = undefined;
            trigger();
          });
        }
        trigger();
        emit(`update:${key}`, value);
      },
    };
  });
}

/** checkedValue → checked-value：父级可能用连字符写法传入 */
function hyphenate(name: string) {
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

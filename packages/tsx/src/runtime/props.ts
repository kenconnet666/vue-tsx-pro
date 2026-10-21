/**
 * prop 访问器：编译器把 _component 的参数解构换成对这几个函数的调用。
 * 作者不直接使用它们；思路来自 Svelte 5 的 $.prop。
 *
 * 返回的都是真正的 Vue Ref（读写改写为 .value），因此 _toRef(size) 可以交给 watch 等 Vue API。
 */
import { computed, customRef, getCurrentInstance, nextTick, toRef, watch, type Ref } from 'vue';
import { vueProps } from './component';
import { overridable } from './state';

type Props = Record<string, unknown>;
type Emit = (event: string, ...args: unknown[]) => void;
/** 编译器原样传入的字面量默认值 */
type Literal = string | number | boolean | bigint | null;

/**
 * 普通 prop：父级传了值就用父级的，否则用默认值；组件内可以临时覆盖（见 overridable），
 * 父级传入新值时以父级为准。
 *
 * 默认值第一次用到时才求值，并用 computed 缓存：
 *   - [] / {} / 函数调用每个实例各自一份，读多少次都是同一个值
 *   - 引用了其他 prop 的默认值（icon = pick(size)）会随那个 prop 更新
 */
export function prop<T>(props: Props, key: string, fallback?: () => T): Ref<T> {
  return overridable(propReader(props, key, fallback));
}

/**
 * 组件里从没写入过的普通 prop（编译器确定时生成，大多数 prop 是这样）：只读的 getter ref，
 * 不像 prop 那样每个实例再建 computed、customRef 与同步 watch，创建快十倍。
 * 默认值的处理与 prop 相同；有默认值时在 setup 里先读一次（prop 的 watch 也是这时求值），
 * 默认值里调用的组合式函数（useId() 等）才拿得到组件实例
 */
export function readonlyProp<T>(props: Props, key: string, fallback?: (() => T) | Literal): Ref<T> {
  // 字面量默认值（'md'、false、0，编译器直接传值）：不用缓存，也不必先求值
  if (fallback !== undefined && typeof fallback !== 'function') {
    const source = vueProps(props);
    return toRef(() => (source[key] !== undefined ? source[key] : fallback) as T) as Ref<T>;
  }
  const read = propReader(props, key, fallback);
  if (fallback) read();
  return toRef(read) as Ref<T>;
}

/** 父级传了值就用父级的，否则用默认值（第一次用到时求值，computed 缓存） */
function propReader<T>(props: Props, key: string, fallback: (() => T) | undefined) {
  const source = vueProps(props);
  let fallbackValue: Readonly<Ref<T>> | undefined;
  return () => {
    const value = source[key];
    if (value !== undefined || !fallback) return value as T;
    fallbackValue ??= computed(fallback);
    return fallbackValue.value;
  };
}

/**
 * 解构出的 children：每次读取都重新执行插槽，不缓存（普通 prop 用 computed 缓存）。
 * 父级重新渲染时传来新的插槽，里面可能只有父级渲染时算好的值、没有响应式读取：
 * 缓存不会失效，子组件就一直显示旧内容。子组件因父级更新而重新渲染时读到的总是新插槽。
 */
export function childrenProp<T>(props: Props, fallback?: () => T): Ref<T> {
  // 插槽里的响应式读取在执行时照常被追踪；这里不缓存，也就不需要自己的 track / trigger
  return customRef(() => ({
    get: () => (props.children ?? fallback?.()) as T,
    // children 只读（编译器拒绝写入），这里不会被调用
    set: () => {},
  }));
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
  const source = vueProps(props);
  // 父级可能用连字符写法传入（checked-value、onUpdate:checked-value）：两种写法先算好，每次读取只查表
  const names = [key, hyphenate(key)];
  const listeners = names.map((name) => `onUpdate:${name}`);
  const passed = (candidates: readonly string[]) => {
    const raw = instance.vnode.props;
    return !!raw && candidates.some((name) => name in raw);
  };
  const isControlled = () => passed(names) && passed(listeners);

  // 默认值只在创建时求一次：它是组件自己的初始状态，别的 prop 变了也不该冲掉组件里改过的值
  const fallbackValue = fallback?.() as T;
  const parentValue = () => (source[key] !== undefined ? (source[key] as T) : fallbackValue);
  let local = parentValue();
  /** 受控时写入的值，只在本轮更新内有效 */
  let pending: { value: T } | undefined;
  let writes = 0;

  return customRef((track, trigger) => {
    watch(
      () => source[key],
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

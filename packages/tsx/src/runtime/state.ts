/**
 * 编译产物使用的状态工具（作者不直接调用）：
 *   - overridable：let 声明的 _derived、组件的普通 prop
 *   - snapshot：_state.snapshot(x)
 *   - untrack：_untrack(x)
 */
import { computed, customRef, isRef, ReactiveEffect, toRaw, watch, type Ref } from 'vue';

/**
 * 跟随来源、可以临时覆盖的值（同 Svelte 5.25 的可覆盖派生）：
 * 读取时是 getter 的结果；写入后读到写入的值，直到 getter 的结果变化，再回到跟随来源。
 *
 *   let likes = _derived(post.likes)   乐观更新：likes += 1，post.likes 一变就以它为准
 *   ({ value }) => … value = x          普通 prop：只改组件本地，父级传入新值时以父级为准
 */
export function overridable<T>(getter: () => T): Ref<T> {
  const source = computed(getter);
  let override: { value: T } | undefined;
  return customRef((track, trigger) => {
    watch(
      source,
      () => {
        override = undefined;
        trigger();
      },
      { flush: 'sync' },
    );
    return {
      get() {
        track();
        const value = source.value;
        return override ? override.value : value;
      },
      set(value) {
        override = { value };
        trigger();
      },
    };
  });
}

/**
 * 读取但不追踪（同 Svelte 的 untrack）：在一个临时的 effect 里执行，读到的响应式值记在它身上，
 * 外层的 _effect、_derived、渲染函数不会因此依赖它们。用 Vue 公开的 ReactiveEffect，不碰内部 API。
 */
export function untrack<T>(read: () => T): T {
  const runner = new ReactiveEffect(read);
  try {
    return runner.run();
  } finally {
    runner.stop();
  }
}

/**
 * 去掉响应式代理的静态深拷贝（同 Svelte 的 $state.snapshot），交给 structuredClone、第三方库或日志。
 * 普通对象与数组逐层拷贝，Date 复制一份，有 toJSON 的取它的结果，其他值（类实例、函数等）原样保留。
 */
export function snapshot<T>(value: T): T {
  return clone(value, new Map()) as T;
}

function clone(value: unknown, seen: Map<object, unknown>): unknown {
  const raw = toRaw(value);
  if (isRef(raw)) return clone(raw.value, seen);
  if (typeof raw !== 'object' || raw === null) return raw;
  if (seen.has(raw)) return seen.get(raw);

  if (Array.isArray(raw)) {
    const copy: unknown[] = [];
    seen.set(raw, copy);
    for (const item of raw) copy.push(clone(item, seen));
    return copy;
  }
  if (raw instanceof Date) return new Date(raw);
  const prototype = Object.getPrototypeOf(raw);
  if (prototype === Object.prototype || prototype === null) {
    const copy: Record<string, unknown> = {};
    seen.set(raw, copy);
    for (const [key, item] of Object.entries(raw)) copy[key] = clone(item, seen);
    return copy;
  }
  const json = (raw as { toJSON?: () => unknown }).toJSON;
  return typeof json === 'function' ? clone(json.call(raw), seen) : raw;
}

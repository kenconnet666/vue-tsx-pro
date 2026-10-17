/**
 * 复合组件（Tabs、Select、Form 等）之间共享状态：声明一次，提供与读取都带类型。
 *
 *   const TabsContext = createContext<TabsState>('Tabs');
 *   TabsContext.provide(state);            // 父组件 setup 里
 *   const tabs = TabsContext.inject();     // 子组件 setup 里；不在父组件内时报错说明
 *   const form = FormContext.inject(null); // 可选：不在父组件内时返回给定的值
 *   app.provide(TabsContext.key, state);   // 应用级提供（Vue 插件里）
 */
import { inject, provide, type InjectionKey } from 'vue';

const MISSING = Symbol('missing');

export interface Context<T> {
  readonly key: InjectionKey<T>;
  provide(value: T): void;
  inject(): T;
  inject<F>(fallback: F): T | F;
}

export function createContext<T>(name: string): Context<T> {
  const key: InjectionKey<T> = Symbol(name);
  return {
    key,
    provide: (value) => provide(key, value),
    inject(...fallback: unknown[]) {
      const value = inject(key, MISSING as T);
      if (value !== MISSING) return value;
      if (fallback.length) return fallback[0];
      throw new Error(`${name} 的子组件需要放在 <${name}> 之内使用`);
    },
  } as Context<T>;
}

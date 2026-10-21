/**
 * 复合组件（Tabs、Select、Form 等）之间共享状态：声明一次，提供与读取都带类型。
 *
 *   const TabsContext = createContext<TabsState>('Tabs');
 *   TabsContext.provide(state);            // 父组件 setup 里
 *   const tabs = TabsContext.inject();     // 子组件 setup 里；不在父组件内时报错说明
 *   const form = FormContext.inject(null); // 可选：不在父组件内时返回给定的值
 *   app.provide(TabsContext.key, state);   // 应用级提供（Vue 插件里）
 */
import { hasInjectionContext, inject, provide, type InjectionKey } from 'vue';

const MISSING = Symbol('missing');

/** createContext 的结果：同一个键的提供与读取 */
export interface Context<T> {
  /** Vue 的注入键：应用级提供时 `app.provide(Context.key, value)` */
  readonly key: InjectionKey<T>;
  /** 在组件 setup 里向子树提供值 */
  provide(value: T): void;
  /** 读取最近的祖先提供的值；没有时报错，说明要放在哪个组件之内 */
  inject(): T;
  /** 读取最近的祖先提供的值；没有时（包括在 setup 之外调用）返回 fallback */
  inject<F>(fallback: F): T | F;
}

/** 声明一个带类型的上下文；name 用于报错信息（“需要放在 <name> 之内”）与调试 */
export function createContext<T>(name: string): Context<T> {
  const key: InjectionKey<T> = Symbol(name);
  return {
    key,
    provide: (value) => provide(key, value),
    inject(...fallback: unknown[]) {
      // setup 之外 Vue 的 inject 只警告、返回 undefined（不是默认值）：有 fallback 时直接用它
      if (!hasInjectionContext()) {
        if (fallback.length) return fallback[0];
        throw new Error(`${name} 的上下文只能在组件的 setup 里读取`);
      }
      const value = inject(key, MISSING as T);
      if (value !== MISSING) return value;
      if (fallback.length) return fallback[0];
      throw new Error(`${name} 的子组件需要放在 <${name}> 之内使用`);
    },
  } as Context<T>;
}

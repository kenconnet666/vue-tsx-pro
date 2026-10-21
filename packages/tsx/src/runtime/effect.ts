/**
 * _effect 的运行时（作者不直接调用）：语义同 Svelte 5 的 $effect，底层是 Vue 的 watchEffect。
 *
 *   _effect(fn)       → effect(fn)         挂载后、每次 DOM 更新后执行
 *   _effect.pre(fn)   → effect(fn, 'pre')  DOM 更新前执行
 *   _effect.root(fn)  → effectRoot(fn)     不随组件销毁，返回手动清理函数
 */
import { effectScope, getCurrentScope, watchEffect } from 'vue';

/** 副作用函数可以返回清理函数：下次执行前、以及销毁时调用 */
type EffectFn = () => void | (() => void);

/** _effect / _effect.pre 编译后的调用：在当前作用域里创建，随组件销毁 */
export function effect(fn: EffectFn, flush: 'pre' | 'post' = 'post'): void {
  if (!getCurrentScope()) {
    throw new Error(
      '_effect 需要在组件函数体、组件里调用的组合式函数、或另一个 _effect 里创建，否则不会自动停止；需要手动管理时用 _effect.root',
    );
  }
  // 服务端渲染不执行副作用（同 Svelte）：Vue 在服务端会立即执行 flush: 'pre' 的 watchEffect，只跳过 post
  if (typeof document === 'undefined') return;
  watchEffect(
    (onCleanup) => {
      // 每次执行一个作用域：这次执行里创建的 _effect 属于它，下次执行前一起销毁（同 Svelte 的嵌套 effect）
      const scope = effectScope();
      const cleanup = scope.run(fn);
      onCleanup(() => {
        scope.stop();
        if (typeof cleanup === 'function') cleanup();
      });
    },
    { flush },
  );
}

/** _effect.root 编译后的调用：独立的作用域，返回手动清理函数 */
export function effectRoot(fn: EffectFn): () => void {
  const scope = effectScope(true);
  const cleanup = scope.run(fn);
  return () => {
    scope.stop();
    if (typeof cleanup === 'function') cleanup();
  };
}

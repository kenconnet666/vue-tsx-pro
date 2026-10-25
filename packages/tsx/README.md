# @vue-tsx-pro/tsx

更自然的 Vue TSX：props 驱动的组件、下划线符文（`_state`、`_derived`、`_bindable`……）、写法像 StyleX 的运行时样式，以及一行配好的 Vite 预设。

```bash
pnpm add @vue-tsx-pro/tsx
```

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { vueTsxPro } from '@vue-tsx-pro/tsx/vite';

export default defineConfig({ plugins: [vue(), ...vueTsxPro()] });
```

tsconfig 里写 `"jsx": "preserve"` 与 `"jsxImportSource": "@vue-tsx-pro/tsx"`，之后就能直接用符文：

```tsx
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';

const styles = css.create({ button: { padding: '_sm', borderRadius: '_md' } });

export const Counter = _component(({ step = 1 }: { step?: number }) => {
  let count = _state(0);
  return () => (
    <button {...css.attrs(styles.button)} onClick={() => (count += step)}>
      点了 {count} 次
    </button>
  );
});
```

| 入口                        | 内容                                                                      |
| --------------------------- | ------------------------------------------------------------------------- |
| `@vue-tsx-pro/tsx`          | `_component`、`createContext` 与符文的运行时                              |
| `@vue-tsx-pro/tsx/styles`   | 运行时样式引擎：`create`、`attrs`、`recipe`、`defineVars`、`createTheme`… |
| `@vue-tsx-pro/tsx/vite`     | Vite 预设：符文、样式绑定与 JSX 一次编译，组件热更新、编译缓存            |
| `@vue-tsx-pro/tsx/compiler` | 编译函数（预设与代码演练场共用）                                          |

要求 Vue 3.5+、Vite 8。文档、符文与样式的完整说明见仓库：<https://github.com/kenconnet666/vue-tsx-pro>（RUNES.md、STYLE-ENGINE.md）。

MIT License

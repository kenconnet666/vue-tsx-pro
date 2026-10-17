import { defineConfig } from 'vite'
import vueJsx from 'vue-jsx/vite'
import stylex from '@stylexjs/unplugin'
import { runes } from './src/runes/vite'

export default defineConfig({
  plugins: [
    // 1. runes：符文 → Vue API，读写 → .value
    runes(),
    // 2. StyleX：stylex.create → 原子类
    stylex.vite(),
    // 3. vue-jsx：参数解构、defineModel 等宏，再编译 JSX
    vueJsx({ macros: { defineComponent: { alias: ['defineComponent', 'component'] } } }),
  ],
  test: { environment: 'happy-dom' },
})

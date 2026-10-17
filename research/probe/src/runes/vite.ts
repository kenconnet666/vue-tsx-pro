import type { Plugin } from 'vite'
import { compileRunes } from './compiler'

/** Vite 插件：在 vue-jsx 之前运行，只处理用到符文的 .ts/.tsx 文件 */
export function runes(): Plugin {
  return {
    name: 'vue-tsx-pro:runes',
    enforce: 'pre',
    async transform(code, id) {
      const file = id.split('?')[0]
      if (!/\.[cm]?[jt]sx?$/.test(file) || file.includes('/node_modules/')) return
      return compileRunes(code, file)
    },
  }
}

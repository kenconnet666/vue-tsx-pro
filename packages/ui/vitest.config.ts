import { defineConfig } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

// 测试时完整编译，样式走运行时引擎（预设的默认），与组件库发布的产物一致
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  // ExcelJS 的 Node 版（excel.js）在 VM 上下文里引 uuid 的 esm-node 出错；浏览器版自带依赖，与使用方的打包器取的一致（package.json 的 browser）
  resolve: { alias: { exceljs: 'exceljs/dist/exceljs.min.js' } },
  test: {
    name: 'ui',
    environment: 'happy-dom',
    // 每个 Worker 只建一次 happy-dom，每个测试文件仍是新的 VM 上下文与 window（Vitest 的 improving-performance）：
    // 建环境、导入模块占了大半时间，106 个文件 37 s → 10 s
    pool: 'vmForks',
    // VM 上下文里外部化的依赖按 Node 的 import 条件解析：@emotion 的 .cjs.mjs 包装再导出 CommonJS，
    // 默认导入拿到的不是函数（Unovis 用到）。交给 Vite 按 module 条件解析成 ES 模块；外部模块的依赖不经过 Vite，
    // 引到它的 Unovis 也要一起内联
    server: { deps: { inline: [/[\\/]@unovis[\\/]/, /[\\/]@emotion[\\/]/] } },
    passWithNoTests: true,
  },
});

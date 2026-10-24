import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';
import pkg from './package.json' with { type: 'json' };

/** 依赖与 peer 依赖（含子路径，如 @lucide/icons/icons/x）都不打进产物，由使用方安装 */
const externals = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/**
 * 组件库构建：TSX 与符文在这里编译掉；样式用运行时模式（styles: 'runtime'）：*.stylex.ts 编译好并在运行时注入，
 * stylex.create 留作运行时调用，第一次用到时生成原子类。发布包是普通的 JS，使用方不必再编译，可以预构建。
 */
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro({ styles: 'runtime' })],
  build: {
    // 每个入口（主入口与各子路径）一份，登记在 package.json 的 exports；可选依赖（shiki、@unovis/ts、three）只在它的子路径里导入
    lib: {
      entry: Object.values(pkg.exports).flatMap((target) =>
        typeof target === 'object' ? [target['@vue-tsx-pro/source']] : [],
      ),
      formats: ['es'],
    },
    rollupOptions: {
      external: isExternal,
      // 保留源码的文件结构：StyleX 要求 defineVars 留在 *.stylex.js 文件里，使用方编译时才认得
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
    minify: false,
    sourcemap: true,
  },
});

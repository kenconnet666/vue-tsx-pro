import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
import pkg from './package.json' with { type: 'json' };

/** 依赖与 peer 依赖（含子路径，如 @lucide/icons/icons/x）都不打进产物，由使用方安装 */
const externals = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/**
 * 组件库构建：TSX 与符文在这里编译掉；css.create 留作运行时调用，由运行时引擎在页面里生成组合类。
 * 发布包是普通的 JS，使用方不必再编译，整个预构建。
 */
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
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
      // 保留源码的文件结构：使用方按文件摇树，有副作用的只有 config/theme/tokens.js（package.json 的 sideEffects）
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
    minify: false,
    sourcemap: true,
  },
});

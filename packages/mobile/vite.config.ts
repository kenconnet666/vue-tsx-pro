import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
import pkg from './package.json' with { type: 'json' };

/** 依赖与 peer 依赖（含子路径）都不打进产物，由使用方安装 */
const externals = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/**
 * 移动端组件库构建：TSX 与符文在这里编译掉，css.create 留作运行时调用；发布普通的 JS，使用方（H5、小程序）不再编译
 */
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  build: {
    lib: {
      entry: Object.values(pkg.exports).flatMap((target) =>
        typeof target === 'object' ? [target['@vue-tsx-pro/source']] : [],
      ),
      formats: ['es'],
    },
    rollupOptions: {
      external: isExternal,
      // 保留源码的文件结构：使用方按文件摇树，有副作用的只有 theme/tokens.js
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
    minify: false,
    sourcemap: true,
  },
});

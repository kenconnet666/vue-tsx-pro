import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
import pkg from './package.json' with { type: 'json' };

/** 依赖与 peer 依赖（含子路径）都不打进产物，由使用方安装 */
const externals = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/** 流程界面组件的构建：TSX 与符文在这里编译掉，发布普通的 JS（同移动端组件库） */
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  build: {
    lib: { entry: pkg.exports['.']['@vue-tsx-pro/source'], formats: ['es'] },
    rollupOptions: {
      external: isExternal,
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
    minify: false,
    sourcemap: true,
  },
});

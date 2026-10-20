import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';
import pkg from './package.json' with { type: 'json' };

/** 依赖与 peer 依赖（含子路径，如 @lucide/icons/icons/x）都不打进产物，由使用方安装 */
const externals = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/**
 * 组件库构建：TSX 与符文在这里编译掉；StyleX 保留 stylex.create 源码，
 * 由使用方应用的 StyleX 插件统一编译（原子类跨库去重，sx 覆盖才能正确合并）。
 */
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro({ stylex: false })],
  build: {
    // 子路径各是一个入口；可选依赖（shiki、@unovis/ts、three）只在它的子路径里导入
    lib: {
      entry: [
        'src/index.ts',
        'src/config/shiki.ts',
        'src/charts/index.ts',
        'src/three/index.ts',
        'src/config/vue-router.ts',
        'src/config/theme/boot.ts',
      ],
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

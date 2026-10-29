/**
 * 构建小程序：应用入口（definePages 的默认导出）连同运行时、Vue、组件库打成一个 CommonJS 包 vtp.js，
 * 再生成小程序要的文件——app.js / app.json、每个页面的 js / json / 模板、通用模板、app 样式表、项目配置。
 * 组件库按发布的产物（dist）打进来，不重新编译；应用自己的 TSX 由传入的插件（vueTsxPro）编译。
 *
 *   await buildMini({ root: import.meta.dirname, platform: 'wx', plugins: vueTsxPro(), appId: 'wx…' });
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { build, type PluginOption } from 'vite';
import { PLATFORMS, type Platform } from './platforms.ts';
import { appStyles } from './styles.ts';
import { baseTemplate, pageTemplate } from './templates.ts';

export interface MiniBuildOptions {
  /** 应用目录 */
  root: string;
  /** 平台：wx 微信，my 支付宝 */
  platform: Platform['name'];
  /** 应用入口，相对 root；默认导出 definePages 的结果 */
  entry?: string;
  /** 产物目录，相对 root；默认 dist/<平台> */
  outDir?: string;
  /** 编译应用源码的插件（vueTsxPro()） */
  plugins?: PluginOption[];
  /** 微信的 AppID（project.config.json） */
  appId?: string;
  /** app.json 的 window */
  window?: Record<string, unknown>;
  /** 开发构建：不压缩，Vue 带开发期检查 */
  development?: boolean;
}

/** 打好的包导出的东西（入口见 entrySource） */
interface Bundle {
  names: readonly string[];
  styleText(): string;
}

export async function buildMini(
  options: MiniBuildOptions,
): Promise<{ outDir: string; pages: readonly string[] }> {
  const platform = PLATFORMS[options.platform];
  const outDir = resolve(options.root, options.outDir ?? `dist/${platform.name}`);
  const entry = writeEntry(options.root, resolve(options.root, options.entry ?? 'src/app.ts'));
  const mode = options.development ? 'development' : 'production';

  await build({
    root: options.root,
    configFile: false,
    logLevel: 'warn',
    mode,
    plugins: options.plugins ?? [],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      // 组件都是组合式写法，用不到选项式 API；关掉还躲开了支付宝编译器解析不了的那段（computed 选项的 set:e=>i.value=e）
      __VUE_OPTIONS_API__: 'false',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    build: {
      outDir,
      emptyOutDir: true,
      minify: !options.development,
      // 小程序的 JS 引擎（iOS 的 JavaScriptCore、支付宝的编译器）对新语法的支持不一，降到 ES2017
      target: 'es2017',
      lib: { entry, formats: ['cjs'], fileName: () => 'vtp.js' },
      rolldownOptions: { output: { exports: 'named' } },
    },
  });

  // 包在 Node 里也能加载（运行时只在页面 onLoad 时才碰小程序的全局 API）：取页面列表与静态样式。
  // 应用目录多半是 type: module，.js 会按 ES 模块加载，复制成 .cjs 再 require
  const copy = join(cacheDir(options.root), `vtp-${platform.name}.cjs`);
  copyFileSync(join(outDir, 'vtp.js'), copy);
  const bundle = createRequire(copy)(copy) as Bundle;
  emit(outDir, platform, bundle, options);
  return { outDir, pages: bundle.names };
}

/** 构建的中间文件放在应用的 node_modules/.cache 下，不污染源码目录 */
function cacheDir(root: string): string {
  const dir = join(root, 'node_modules', '.cache', 'vtp-mini');
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** 打包入口：应用的页面加上静态样式的导出 */
function writeEntry(root: string, appEntry: string): string {
  const dir = cacheDir(root);
  const file = join(dir, 'entry.js');
  writeFileSync(
    file,
    [
      // 补全逻辑层缺的全局函数，排在一切模块前面（依赖可能在模块顶层就取用）
      `import '@zerodep-dev/vue-tsx-pro-mini/globals';`,
      `import pages from ${JSON.stringify(appEntry.replaceAll('\\', '/'))};`,
      `export { styleText } from '@zerodep-dev/vue-tsx-pro-tsx/styles';`,
      'export const names = pages.names;',
      'export const page = (name) => pages.page(name);',
    ].join('\n'),
  );
  return file;
}

/** app.json 的 window 按微信的字段写；支付宝的标题字段叫 defaultTitle，补上 */
function windowConfig(platform: Platform, window: Record<string, unknown> = {}) {
  if (platform.name !== 'my' || window.navigationBarTitleText === undefined) return window;
  return { ...window, defaultTitle: window.navigationBarTitleText };
}

function emit(outDir: string, platform: Platform, bundle: Bundle, options: MiniBuildOptions) {
  const write = (path: string, content: string) => {
    mkdirSync(join(outDir, path, '..'), { recursive: true });
    writeFileSync(join(outDir, path), content);
  };
  const pages = bundle.names.map((name) => `pages/${name}/index`);
  write('app.js', "require('./vtp.js');\nApp({});\n");
  write(
    'app.json',
    JSON.stringify({ pages, window: windowConfig(platform, options.window) }, null, 2),
  );
  write(`app.${platform.style}`, appStyles(bundle.styleText()));
  write(`base.${platform.template}`, baseTemplate(platform));
  for (const name of bundle.names) {
    write(
      `pages/${name}/index.js`,
      `Page(require('../../vtp.js').page(${JSON.stringify(name)}));\n`,
    );
    write(`pages/${name}/index.json`, '{}');
    write(`pages/${name}/index.${platform.template}`, pageTemplate(platform));
  }
  if (platform.name === 'wx') {
    write(
      'project.config.json',
      JSON.stringify(
        {
          appid: options.appId ?? 'touristappid',
          compileType: 'miniprogram',
          libVersion: 'latest',
          setting: { es6: true, minified: false, urlCheck: false },
        },
        null,
        2,
      ),
    );
  } else {
    write('mini.project.json', JSON.stringify({ format: 2, compileOptions: {} }, null, 2));
    // 支付宝的编译器按它判断代码的语法级别；没有时按旧语法解析，ES2017 的产物会报 Unexpected token（Taro 也写这个文件）
    write('.browserslistrc', 'defaults and fully supports es6-module');
  }
}

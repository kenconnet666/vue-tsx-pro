/**
 * 构建小程序：应用入口（definePages 的默认导出）连同运行时、Vue、组件库打成一个 CommonJS 包 vtp.js，
 * 再生成小程序要的文件——app.js / app.json、每个页面的 js / json / 模板、通用模板、app 样式表、项目配置。
 * 组件库按发布的产物（dist）打进来，不重新编译；应用自己的 TSX 由传入的插件（vueTsxPro）编译。
 *
 *   await buildMini({ root: import.meta.dirname, platform: 'wx', plugins: vueTsxPro(), appId: 'wx…' });
 */
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { build, type InlineConfig, type Plugin, type PluginOption } from 'vite';
import { PLATFORMS, type Platform } from './platforms.ts';
import { appStyles } from './styles.ts';
import { baseTemplate, componentTemplate, pageTemplate } from './templates.ts';

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
  /**
   * 跟随系统的深浅色：微信要在 app.json 里开 darkmode 才会报告深色（ConfigProvider 的 theme="system" 用）；
   * 导航栏的颜色在 window 里写死时不受影响
   */
  darkmode?: boolean;
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
  const { config, outDir, platform } = prepare(options, false);
  await build(config);
  return finish(options, platform, outDir, 0);
}

/** 监听模式的句柄 */
export interface MiniWatcher {
  /** 停止监听 */
  close(): Promise<void>;
}

/** 监听模式下依赖单独成包的文件名 */
const VENDOR = 'vtp-vendor.js';

/** 包名（依赖）：不是相对路径、绝对路径、虚拟模块 */
const isBare = (id: string) => !/^(?:[./\\]|[A-Za-z]:|\0)/.test(id);

/**
 * 监听模式：应用的包不打依赖（Vue、运行时、组件库……），对它们的 require 换成从 vtp-vendor.js 取；
 * 依赖包只在依赖的列表变了时重打。源码改了只重打应用自己的代码，再重写小程序的文件，开发者工具看到产物变了会自己重新编译。
 * 每次打完调用 onBuild（第几次、页面、耗时）
 *
 *   const watcher = await watchMini({ ...options, development: true }, ({ pages, ms }) => console.log(ms));
 */
export async function watchMini(
  options: MiniBuildOptions,
  onBuild?: (result: {
    outDir: string;
    pages: readonly string[];
    ms: number;
    count: number;
  }) => void,
): Promise<MiniWatcher> {
  const { config, outDir, platform } = prepare(options, true);
  const externals = new Set<string>();
  config.plugins = [...(await cacheTransforms(config.plugins ?? [])), vendorRequires(externals)];
  config.build!.rolldownOptions!.external = isBare;
  const watcher = (await build(config)) as unknown as {
    on(event: 'event', listener: (event: { code: string; error?: unknown }) => void): void;
    close(): Promise<void>;
  };
  let count = 0;
  let started = performance.now();
  let vendorKey = '';
  // 打完之后的处理排成队：上一次还在重打依赖包时又改了源码，不能交错
  let queue = Promise.resolve();
  watcher.on('event', (event) => {
    if (event.code === 'START') started = performance.now();
    else if (event.code === 'ERROR') console.error(event.error);
    else if (event.code === 'END')
      queue = queue
        .then(async () => {
          const key = [...externals].sort().join('\n');
          if (key !== vendorKey) {
            vendorKey = key;
            await buildVendor(options, outDir, [...externals].sort());
          }
          const result = finish(options, platform, outDir, ++count);
          onBuild?.({ ...result, ms: Math.round(performance.now() - started), count });
        })
        .catch((error: unknown) => console.error(error));
  });
  return { close: () => watcher.close() };
}

/**
 * 插件的 transform 按文件内容缓存：监听模式下每次重打都会把应用的每个文件再交给插件编译一遍（TSX 编译最费时），
 * 内容没变的直接用上次的结果
 */
async function cacheTransforms(options: PluginOption[]): Promise<Plugin[]> {
  return (await flatPlugins(options)).map((plugin) => {
    const hook = plugin.transform;
    if (!hook) return plugin;
    const handler = typeof hook === 'function' ? hook : hook.handler;
    const cache = new Map<string, { code: string; result: unknown }>();
    const cached = async function (this: unknown, code: string, id: string, ...rest: unknown[]) {
      const hit = cache.get(id);
      if (hit?.code === code) return hit.result;
      const result: unknown = await (handler as (...args: unknown[]) => unknown).call(
        this,
        code,
        id,
        ...rest,
      );
      cache.set(id, { code, result });
      return result;
    };
    return {
      ...plugin,
      transform: typeof hook === 'function' ? cached : { ...hook, handler: cached },
    } as Plugin;
  });
}

/** Vite 的插件选项可以嵌套数组、Promise，展开成插件列表 */
async function flatPlugins(option: PluginOption): Promise<Plugin[]> {
  const value = await option;
  if (Array.isArray(value)) return (await Promise.all(value.map(flatPlugins))).flat();
  return value ? [value] : [];
}

/** 应用的包里对依赖的 require 换成从 vtp-vendor.js 取（小程序的 require 只认相对路径），顺带记下用到了哪些依赖 */
function vendorRequires(externals: Set<string>): Plugin {
  return {
    name: 'vtp-mini:vendor-requires',
    renderChunk(code, chunk) {
      for (const id of chunk.imports) if (isBare(id)) externals.add(id);
      const replaced = code.replace(
        /require\((["'])([^"']+)\1\)/g,
        (match, _quote: string, id: string) =>
          externals.has(id) ? `require("./${VENDOR}").modules[${JSON.stringify(id)}]` : match,
      );
      // 只换了 require(…) 那一小段，行号不变：沿用原来的源码映射
      return { code: replaced, map: null };
    },
  };
}

/** 依赖单独成包：各依赖的模块对象放进 modules（键是包名），补全全局函数的模块排在最前面 */
async function buildVendor(options: MiniBuildOptions, outDir: string, ids: string[]) {
  const file = join(cacheDir(options.root), 'vendor-entry.js');
  writeFileSync(
    file,
    [
      `import '@zerodep-dev/vue-tsx-pro-mini/globals';`,
      ...ids.map((id, index) => `import * as m${index} from ${JSON.stringify(id)};`),
      `export const modules = { ${ids.map((id, index) => `${JSON.stringify(id)}: m${index}`).join(', ')} };`,
    ].join('\n'),
  );
  // 不重写应用的入口文件：它在监听里，改了会触发应用的包再打一遍
  const { config } = prepare(options, false, file);
  await build({
    ...config,
    // 依赖都是发布的产物，不用应用的插件；共用插件实例时这次构建结束会停掉监听那边的编译线程
    plugins: [],
    build: {
      ...config.build,
      emptyOutDir: false,
      sourcemap: false,
      lib: { entry: file, formats: ['cjs'], fileName: () => VENDOR },
    },
  });
}

/** 两种构建共用的 Vite 配置 */
function prepare(options: MiniBuildOptions, watch: boolean, entryFile?: string) {
  const platform = PLATFORMS[options.platform];
  const outDir = resolve(options.root, options.outDir ?? `dist/${platform.name}`);
  const entry =
    entryFile ?? writeEntry(options.root, resolve(options.root, options.entry ?? 'src/app.ts'));
  const mode = options.development ? 'development' : 'production';
  const config: InlineConfig = {
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
      // 监听模式下不清空：小程序的其余文件（app.json、模板、依赖包）留着，之后只换 vtp.js
      emptyOutDir: !watch,
      minify: !options.development,
      // 开发构建带源码映射（开发者工具的调试器按它显示源码）
      sourcemap: !!options.development,
      // 小程序的 JS 引擎（iOS 的 JavaScriptCore、支付宝的编译器）对新语法的支持不一，降到 ES2017
      target: 'es2017',
      lib: { entry, formats: ['cjs'], fileName: () => 'vtp.js' },
      // 只出一个文件：小程序的页面只 require('./vtp.js')，开发构建会把辅助函数拆成单独的 chunk
      rolldownOptions: { output: { exports: 'named', codeSplitting: false } },
      watch: watch ? {} : null,
    },
  };
  return { config, outDir, platform };
}

/**
 * 打完之后：在 Node 里加载包（运行时只在页面 onLoad 时才碰小程序的全局 API）取页面列表与静态样式，写出小程序的其余文件。
 * 包（与依赖包）复制到缓存目录里一个声明了 CommonJS 的子目录再 require（应用目录多半是 type: module）；
 * 每次一个新目录，躲开 require 的缓存
 */
function finish(options: MiniBuildOptions, platform: Platform, outDir: string, count: number) {
  const dir = join(cacheDir(options.root), `run-${platform.name}-${count}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{"type":"commonjs"}');
  for (const name of ['vtp.js', VENDOR])
    if (existsSync(join(outDir, name))) copyFileSync(join(outDir, name), join(dir, name));
  const bundle = createRequire(join(dir, 'vtp.js'))(join(dir, 'vtp.js')) as Bundle;
  rmSync(dir, { recursive: true, force: true });
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
      // 递归组件 vtp-comp 的事件入口（templates.ts）
      `export { dispatchToCurrentPage as eh } from '@zerodep-dev/vue-tsx-pro-mini';`,
    ].join('\n'),
  );
  return file;
}

/**
 * 递归组件的脚本：节点数据从属性 i、样式字典从 sd 传进来，事件交给运行时（页面栈顶的页面）。
 * 不渲染组件自己的节点（virtualHost），也用 app 的样式表（微信默认把组件的样式隔开）
 */
function componentScript(platform: Platform): string {
  const options =
    platform.name === 'wx'
      ? `{ options: { virtualHost: true, styleIsolation: 'apply-shared' }, properties: { i: { type: Object, value: {} }, sd: { type: Object, value: {} } }, methods: { eh } }`
      : `{ options: { virtualHost: true }, props: { i: {}, sd: {} }, methods: { eh } }`;
  return `const { eh } = require('../../vtp.js');\nComponent(${options});\n`;
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
  // 递归组件：通用模板（base）里引用它，要在 app.json 全局登记（只在页面里登记时微信不实例化）；页面、它自己也登记一遍
  const usingComponents = { 'vtp-comp': '/components/vtp-comp/index' };
  write('app.js', "require('./vtp.js');\nApp({});\n");
  write(
    'app.json',
    JSON.stringify(
      {
        pages,
        window: windowConfig(platform, options.window),
        usingComponents,
        ...(options.darkmode && platform.name === 'wx' ? { darkmode: true } : {}),
      },
      null,
      2,
    ),
  );
  write(`app.${platform.style}`, appStyles(bundle.styleText()));
  write(`base.${platform.template}`, baseTemplate(platform));
  for (const name of bundle.names) {
    write(
      `pages/${name}/index.js`,
      `Page(require('../../vtp.js').page(${JSON.stringify(name)}));\n`,
    );
    write(`pages/${name}/index.json`, JSON.stringify({ usingComponents }));
    write(`pages/${name}/index.${platform.template}`, pageTemplate(platform));
  }
  write('components/vtp-comp/index.json', JSON.stringify({ component: true, usingComponents }));
  write(`components/vtp-comp/index.${platform.template}`, componentTemplate(platform));
  write('components/vtp-comp/index.js', componentScript(platform));
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

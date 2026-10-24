/**
 * StyleX 的 CSS：各模块编译时登记自己的规则（compile 的结果），这里合成 CSS 交给页面。
 * 取代 @stylexjs/unplugin 的这部分（编译本身在 compile 里与其他步骤一起做），和它相比：
 *   - 开发时规则真的变了才通知浏览器，同一版本的 CSS 只合成一次；原来改任何文件都要同步重算两三遍全量 CSS
 *   - 构建时总在 HTML 里引用合成的 CSS；原来应用自己没有 CSS 文件时，写出的 stylex.css 没有任何地方引用，
 *     页面没有样式（文档站的生产构建就是这样）
 *
 * 开发时：HTML 里先放一个 <link>（首屏不闪），客户端脚本随后换成 <style>，收到新版本号时重新拉取。
 * 构建时：合成的 CSS 作为资源输出（assets/stylex-[hash].css，压缩），HTML 里加 <link>；没有 HTML 的构建
 * （SSR、自定义入口）由使用方按 manifest 引用。
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import browserslist from 'browserslist';
import { browserslistToTargets, transform, type TransformOptions } from 'lightningcss';
import type { Plugin, ResolvedConfig } from 'vite';
import type { StylexRule } from '../compiler/index.ts';

/** 合成 CSS 的选项 */
export interface StylexCssOptions {
  /** 规则放进 @layer（StyleX 的 processStylexRules 的 useLayers），默认不放 */
  useCSSLayers?: boolean;
  /** 从右到左的规则加注释（与 StyleX 插件的同名选项一致） */
  enableLTRRTLComments?: boolean;
  /** LightningCSS 的选项：目标浏览器默认取项目的 browserslist */
  lightningcssOptions?: Omit<TransformOptions<never>, 'code' | 'filename'>;
}

/** 开发时 CSS 的地址（相对 base） */
const CSS_PATH = '@vue-tsx-pro/stylex.css';
/** 开发时替换、更新样式的客户端脚本 */
const CLIENT_ID = 'virtual:vue-tsx-pro/stylex-client';
/** 规则变了：通知浏览器新的版本号 */
const UPDATE_EVENT = 'vue-tsx-pro:stylex';
/** 连续编译时最多每隔这么久通知一次（冷启动时几百个模块陆续编译） */
const NOTIFY_INTERVAL = 100;

/** 全部模块的 StyleX 规则；版本号随内容变化递增，同一版本的 CSS 只合成一次 */
export class StylexRules {
  /** 当前版本号 */
  version = 0;
  private modules = new Map<string, { rules: StylexRule[]; key: string; version: number }>();
  private cache: { version: number; minify: boolean; css: string } | undefined;
  private listeners = new Set<() => void>();
  private targets: TransformOptions<never>['targets'] | undefined;
  private readonly options: StylexCssOptions;

  constructor(options: StylexCssOptions) {
    this.options = options;
  }

  /** 模块编译后登记它的规则（没有规则时去掉）；内容没变就不算更新 */
  set(id: string, rules: StylexRule[]) {
    const key = JSON.stringify(rules);
    if ((this.modules.get(id)?.key ?? '[]') === key) return;
    this.version++;
    if (rules.length) this.modules.set(id, { rules, key, version: this.version });
    else this.modules.delete(id);
    for (const listener of this.listeners) listener();
  }

  /** 模块的规则从哪个版本起在 CSS 里；模块没有规则时为 undefined */
  versionOf(id: string) {
    return this.modules.get(id)?.version;
  }

  /** 重新构建前清空 */
  clear() {
    this.modules.clear();
    this.version++;
  }

  /** 规则变化时调用 listener；返回取消函数 */
  onChange(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 当前全部规则合成的 CSS；没有规则时是空字符串 */
  css(minify = false) {
    if (this.cache?.version === this.version && this.cache.minify === minify) return this.cache.css;
    const rules = [...this.modules.values()].flatMap((module) => module.rules);
    const css = rules.length ? this.process(rules, minify) : '';
    this.cache = { version: this.version, minify, css };
    return css;
  }

  private process(rules: StylexRule[], minify: boolean) {
    const css = stylexBabelPlugin.processStylexRules(rules, {
      useLayers: this.options.useCSSLayers ?? false,
      enableLTRRTLComments: this.options.enableLTRRTLComments,
    });
    this.targets ??= browserslistToTargets(browserslist());
    return transform({
      targets: this.targets,
      ...this.options.lightningcssOptions,
      filename: 'stylex.css',
      code: Buffer.from(css),
      minify,
    }).code.toString();
  }
}

/** 提供 StyleX CSS 的 Vite 插件（开发服务器与构建）；规则由编译插件登记进 rules */
export function stylexCss(rules: StylexRules): Plugin {
  let config: ResolvedConfig;
  /** 构建时输出的 CSS 资源；HTML 里用 Vite 的资源占位符引用，路径由 Vite 按 base 算 */
  let emitted: string | undefined;
  /** 开发服务器在向浏览器提供 CSS（Vitest 等中间件模式不提供） */
  let serving = false;
  return {
    name: 'vue-tsx-pro:stylex-css',
    // 依赖 StyleX 的包（组件库的发布包）不预构建：它们的 stylex.create 要经过编译插件。
    // 它们的第三方依赖反过来要一开始就预构建（见 prebundledDependencies）
    config: (user) => {
      const packages = stylexPackages(user.root ?? process.cwd());
      if (!packages.length) return;
      const names = packages.map((entry) => entry.name);
      const { include, exclude } = prebundledDependencies(packages);
      return {
        optimizeDeps: { include, exclude: [...names, ...exclude] },
        ssr: { optimizeDeps: { exclude: names } },
      };
    },
    configResolved(resolved) {
      config = resolved;
    },
    buildStart() {
      rules.clear();
    },
    resolveId: (id) => (id === CLIENT_ID ? `\0${CLIENT_ID}` : undefined),
    load: (id) => (id === `\0${CLIENT_ID}` ? clientCode(config.base + CSS_PATH) : undefined),
    configureServer(server) {
      // Vitest 等没有 HTTP 服务器的中间件模式：页面不从这里取样式
      if (!server.httpServer) return;
      serving = true;
      const path = config.base + CSS_PATH;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== path) return next();
        response.setHeader('Content-Type', 'text/css');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-StyleX-Version', String(rules.version));
        response.end(rules.css());
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const stop = rules.onChange(() => {
        if (timer) return;
        timer = setTimeout(() => {
          timer = undefined;
          server.environments.client.hot.send({
            type: 'custom',
            event: UPDATE_EVENT,
            data: { version: rules.version },
          });
        }, NOTIFY_INTERVAL);
        timer.unref();
      });
      server.httpServer.once('close', () => {
        stop();
        clearTimeout(timer);
      });
    },
    // 开发时模块求值完之前等它的规则进了页面：否则新打开的页面先按没有样式渲染一下（会闪；
    // 虚拟列表这类靠容器高度决定渲染多少的组件，没有高度时会把全部项都渲染出来）。
    // 加在末尾，不挪动已有代码，source map 不用改。不能排到 order: 'post'：那时 Vite 已经解析完导入，
    // 加上的 import 会原样留给浏览器
    transform(code, id, options) {
      if (!serving || options?.ssr || this.environment.name !== 'client') return;
      const version = rules.versionOf(id);
      if (version === undefined) return;
      return {
        code: `${code}\nimport { stylexReady as __stylexReady } from ${JSON.stringify(CLIENT_ID)};\nawait __stylexReady(${version});\n`,
        map: null,
      };
    },
    transformIndexHtml(_, context) {
      if (context.server) {
        return [
          {
            tag: 'link',
            attrs: { rel: 'stylesheet', href: config.base + CSS_PATH, 'data-stylex': true },
            injectTo: 'head',
          },
          {
            tag: 'script',
            // 与模块里 import 的是同一个地址（\0 在地址里写成 __x00__），页面上才只有一份客户端脚本
            attrs: { type: 'module', src: `${config.base}@id/__x00__${CLIENT_ID}` },
            injectTo: 'head',
          },
        ];
      }
      if (!emitted) return;
      return [
        {
          tag: 'link',
          attrs: { rel: 'stylesheet', crossorigin: true, href: `__VITE_ASSET__${emitted}__` },
          injectTo: 'head',
        },
      ];
    },
    // 在生成 HTML（vite:build-html 的 generateBundle）之前输出，HTML 才能引用它
    generateBundle: {
      order: 'pre',
      handler() {
        emitted = undefined;
        if (this.environment.config.consumer !== 'client') return;
        const css = rules.css(config.build.cssMinify !== false);
        if (css) emitted = this.emitFile({ type: 'asset', name: 'stylex.css', source: css });
      },
    },
  };
}

/**
 * 客户端脚本：<link> 换成 <style>，之后拉取最新的 CSS。请求一个接一个发（版本号不会乱序）；
 * 正在请求时又要更新，就在它之后再拉一次：服务器登记新规则可能晚于正在进行的那次请求
 */
function clientCode(url: string) {
  return `const url = ${JSON.stringify(url)};
let current = -1;
let style;
let running;
let queued;
async function load() {
  const response = await fetch(url, { cache: 'no-store' });
  const css = await response.text();
  current = Number(response.headers.get('X-StyleX-Version'));
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('data-stylex', '');
    document.head.append(style);
    document.querySelector('link[data-stylex]')?.remove();
  }
  style.textContent = css;
}
function refresh() {
  if (running) return (queued ??= running.then(() => ((queued = undefined), refresh())));
  running = load()
    .catch((error) => console.error('[vue-tsx-pro] 拉取 StyleX 的 CSS 失败', error))
    .finally(() => (running = undefined));
  return running;
}
/** 模块末尾等它的规则（从 version 版起）进了页面：编译插件在开发时加上 */
export function stylexReady(version) {
  if (typeof document !== 'undefined' && version > current) return refresh();
}
if (typeof document !== 'undefined') refresh();
import.meta.hot?.on(${JSON.stringify(UPDATE_EVENT)}, ({ version }) => stylexReady(version));
`;
}

/** 用到 StyleX 的包：名字与 package.json 的路径 */
interface StylexPackage {
  name: string;
  manifest: string;
}

/** 项目依赖里用到 StyleX 的包：依赖或 peer 依赖里有 @stylexjs/stylex 或本包 */
function stylexPackages(root: string): StylexPackage[] {
  const manifest = readManifest(join(root, 'package.json'));
  if (!manifest) return [];
  const require = createRequire(join(root, 'package.json'));
  const targets = new Set(['@stylexjs/stylex', '@vue-tsx-pro/tsx']);
  const names = Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  });
  return names.flatMap((name) => {
    if (targets.has(name)) return [];
    let path: string;
    try {
      path = require.resolve(`${name}/package.json`);
    } catch {
      return []; // 没装，或 exports 里没有 package.json
    }
    const dependency = readManifest(path);
    const usesStylex = Object.keys({
      ...dependency?.dependencies,
      ...dependency?.peerDependencies,
    }).some((name) => targets.has(name));
    return usesStylex ? [{ name, manifest: path }] : [];
  });
}

/**
 * 不预构建的包自己导入的第三方依赖：包在 package.json 的 vueTsxPro.optimizeDeps 里声明（include 写导入时的说法，
 * 可以带子路径，如 'zod/v4/core'；exclude 是不要预构建的，如只按需加载其中几个的语言表）。
 * 不声明的话，这些依赖跟着包一起不预构建，开发服务器一个文件一个请求（图标库就是上千个），首次打开页面要十几秒；
 * 打开某页才发现的依赖还会重新预构建、刷新页面。写成“包 > 依赖”，从包的目录解析，使用方不必自己安装；
 * 没装的可选依赖（three、@unovis/ts 等）跳过，免得 Vite 报解析不到
 */
function prebundledDependencies(packages: StylexPackage[]) {
  const include: string[] = [];
  const exclude: string[] = [];
  for (const { name, manifest } of packages) {
    const declared = readManifest(manifest)?.vueTsxPro?.optimizeDeps;
    for (const dependency of declared?.include ?? []) {
      if (installed(packageName(dependency), dirname(manifest)))
        include.push(`${name} > ${dependency}`);
    }
    exclude.push(...(declared?.exclude ?? []));
  }
  return { include, exclude };
}

/** 导入说法里的包名：'zod/v4/core' → 'zod'，'@lucide/icons/x' → '@lucide/icons' */
function packageName(specifier: string) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!;
}

/** 从某个目录往上找得到这个包（Node 的解析方式；不经 exports，只看装没装） */
function installed(name: string, from: string): boolean {
  for (let directory = from; ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'node_modules', name, 'package.json'))) return true;
    if (dirname(directory) === directory) return false;
  }
}

interface Manifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  /** 本预设读的声明（见 prebundledDependencies） */
  vueTsxPro?: { optimizeDeps?: { include?: string[]; exclude?: string[] } };
}

function readManifest(path: string): Manifest | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  } catch {
    return undefined;
  }
}

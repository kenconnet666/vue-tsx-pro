/**
 * 构建时预渲染（ROADMAP 12.6）：客户端构建（dist/）与服务端构建（dist-ssr/）之后运行，按首页与导航里的每一页
 * 调用 src/entry-server.ts 的 render，把正文、页面标题、<html> 与 <body> 的属性、正文用到的样式写进 dist/<地址>.html。
 * 原来的入口页存成 dist/spa.html：没有预渲染的地址（整页示例 /frame/...、找不到的页面）回到它，由浏览器渲染，
 * 不会拿首页的 HTML 去水合别的页面。
 *
 * 顺带做每页的服务端体检（原来的 ssr、pages 两个单元测试）：渲染时 Vue 报了警告或错误、h1 不是页面标题、
 * 锚点 id 重复，都列出来并以 1 退出（CI 的 build、hydration 任务都跑它）。
 *
 * 用法：node build/prerender.ts（pnpm build 的最后一步）
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '../dist');
const serverBuild = join(here, '../dist-ssr');

interface Rendered {
  body: string;
  /** Teleport 到 body 的内容，放在 body 的末尾 */
  teleports: string;
  title: string | undefined;
  attrs: { html: Record<string, string>; body: Record<string, string> };
  styles: string;
  /** 换主题类的防闪烁脚本：要在模板里写底色的那段之后执行 */
  themeBootScript: string;
}
interface ServerEntry {
  render(url: string): Promise<Rendered>;
  prerenderPaths(): string[];
}

const entry = (await import(
  pathToFileURL(join(serverBuild, 'entry-server.js')).href
)) as ServerEntry;
const template = readFileSync(join(dist, 'index.html'), 'utf8');
writeFileSync(join(dist, 'spa.html'), template);

const escape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attributes = (record: Record<string, string>) =>
  Object.entries(record)
    .map(([name, value]) => ` ${name}="${escape(value)}"`)
    .join('');

/**
 * 把一页的渲染结果填进入口页的模板。替换一律用函数：页面内容里的 $'、$& 之类在字符串替换里是替换模式，
 * 会把模板的别处拼进页面（例如示例代码里的正则 'v[0-9]$'），服务端输出与客户端对不上
 */
function page({ body, teleports, title, attrs, styles, themeBootScript }: Rendered): string {
  const html = { lang: 'zh-CN', ...attrs.html };
  return (
    template
      .replace(/<html[^>]*>/, () => `<html${attributes(html)}>`)
      .replace('<head>', () => `<head>\n    ${styles}`)
      .replace('</head>', () => `<script>${themeBootScript}</script>\n  </head>`)
      .replace(
        /<title>[^<]*<\/title>/,
        () => `<title>${escape(title ? `${title} · vue-tsx-pro` : 'vue-tsx-pro')}</title>`,
      )
      // Teleport 到 body 的内容紧挨着 <body> 放在最前：Vue 水合时从 body 的第一个子节点开始找它（中间不能有空白文字）
      .replace(
        /<body>\s*<div id="app"><\/div>/,
        () => `<body${attributes(attrs.body)}>${teleports}<div id="app">${body}</div>`,
      )
  );
}

/** 渲染时的警告与错误：记下来，每页渲染完核对 */
const messages: string[] = [];
for (const level of ['warn', 'error'] as const) {
  console[level] = (...args: unknown[]) =>
    messages.push(args.map(String).join(' ').split('\n')[0]!);
}
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .trim();
const problems: string[] = [];

let count = 0;
for (const path of entry.prerenderPaths()) {
  messages.length = 0;
  const rendered = await entry.render(path);
  if (messages.length) problems.push(`${path}：${messages[0]}`);
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(rendered.body)?.[1];
  if (path !== '/' && rendered.title && text(heading ?? '') !== rendered.title)
    problems.push(`${path}：h1 是“${text(heading ?? '')}”，页面标题是“${rendered.title}”`);
  const ids = [...rendered.body.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]!);
  const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (repeated.length)
    problems.push(`${path}：锚点 id 重复（${[...new Set(repeated)].join('、')}）`);
  // 写成 <地址>.html 而不是 <地址>/index.html：后者要带斜杠访问，浏览器里的路由地址就和服务端渲染时差一个斜杠
  const file = path === '/' ? join(dist, 'index.html') : join(dist, `${path}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page(rendered));
  count++;
}
rmSync(serverBuild, { recursive: true, force: true });
if (problems.length) {
  process.stdout.write(`预渲染时有 ${problems.length} 处问题：\n${problems.join('\n')}\n`);
  process.exit(1);
}
console.log(`预渲染了 ${count} 页`);
// 服务端包里的模块会留下定时器、监听（加载条、主题偏好等浏览器里常驻的东西），进程不会自己退出
process.exit(0);

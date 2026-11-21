// 给 dist 里 .d.ts 的相对导入补上扩展名：ui、mobile 的类型声明由 tsc 按 bundler 解析生成，`from './base/Abbr'` 原样留着；
// 包是 "type": "module"，使用方用 moduleResolution node16 / nodenext 时这样的路径解析不了，类型变成 any（issue #9）。
// 指向 x.d.ts 的改成 x.js，指向目录（x/index.d.ts）的改成 x/index.js。用法：node scripts/build/dts-extensions.mjs <dist 目录>
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
// from '…'、import('…')、export … from '…'、import '…' 里的相对路径
const SPECIFIER = /((?:from|import)\s*\(?\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

function* declarations(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* declarations(path);
    else if (name.endsWith('.d.ts')) yield path;
  }
}

let files = 0;
let rewritten = 0;
for (const file of declarations(dist)) {
  const text = readFileSync(file, 'utf8');
  const next = text.replace(SPECIFIER, (match, head, quote, specifier) => {
    if (/\.(m?js|json|css)$/.test(specifier)) return match;
    const base = resolve(dirname(file), specifier);
    const target = existsSync(`${base}.d.ts`)
      ? `${specifier}.js`
      : existsSync(join(base, 'index.d.ts'))
        ? `${specifier.replace(/\/$/, '')}/index.js`
        : undefined;
    if (!target) throw new Error(`${file}: cannot resolve ${specifier}`);
    rewritten++;
    return `${head}${quote}${target}${quote}`;
  });
  if (next !== text) {
    writeFileSync(file, next);
    files++;
  }
}
console.log(`dts-extensions: ${rewritten} relative imports in ${files} files under ${dist}`);

/**
 * 组件规格里的键盘行为：从文档页的键盘一节（`<KeyboardReference keys={…}>`）静态读出按键与说明，挂到这一页
 * 用到的组件上（页面导入的 `virtual:api/XxxProps`）。keys 可以是字面量数组、共享的常量（date/keyboard.ts 的
 * calendarKeys），或两者展开拼接；常量顺着页面的相对导入去找。只认字符串字面量，说明里写表达式的项不进规格
 */
import { dirname, join, resolve } from 'node:path';

// vite.config 把 fs 映射成浏览器里的替身（同 api.ts）：直接取 Node 的内置模块
const { existsSync, readdirSync, readFileSync } = process.getBuiltinModule('node:fs');

/** 一个按键：键位与它做什么 */
export interface KeyBinding {
  keys: string;
  action: string;
}

/** 从 start（一个 `[`）起找到配对的 `]`，跳过字符串里的括号；返回括号里的文字 */
function bracketed(text: string, start: number): string {
  let depth = 0;
  for (let index = start; index < text.length; index++) {
    const char = text[index]!;
    if (char === "'" || char === '"' || char === '`') {
      index++;
      while (index < text.length && text[index] !== char) index += text[index] === '\\' ? 2 : 1;
      continue;
    }
    if (char === '[') depth++;
    if (char === ']' && --depth === 0) return text.slice(start + 1, index);
  }
  throw new Error(`键盘一节的数组没有配对的 ]（从第 ${start} 个字符起）`);
}

/** 文件里 `export const 名字 … = [` 的数组 */
function exportedArray(file: string, name: string): string | undefined {
  const text = readFileSync(file, 'utf8');
  const match = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(text);
  return match ? bracketed(text, match.index + match[0].length - 1) : undefined;
}

/** 页面相对导入的名字 → 文件 */
function relativeImports(file: string, text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, names, from] of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(\.[^']+)'/g)) {
    const base = resolve(dirname(file), from!);
    const path = ['.ts', '.tsx', '']
      .map((ext) => base + ext)
      .find((candidate) => existsSync(candidate));
    if (!path) continue;
    for (const name of names!.split(',')) {
      const local = name
        .replace(/^\s*type\s+/, '')
        .split(/\s+as\s+/)
        .pop()!
        .trim();
      if (local) found.set(local, path);
    }
  }
  return found;
}

/** 字符串字面量里的转义（' \"）还原 */
const unescape = (text: string) => text.replace(/\\(.)/g, '$1');

/** 数组的文字 → 按键；`...名字` 与单独的名字按页面的导入展开 */
function bindingsOf(body: string, imports: Map<string, string>): KeyBinding[] {
  const bindings: KeyBinding[] = [];
  // 字符串字面量：引号是第 group 组，内容是下一组
  const string = (group: number) => `(['"\`])((?:(?!\\${group})[^\\\\]|\\\\.)*)\\${group}`;
  const pair = new RegExp(
    `\\[\\s*${string(1)}\\s*,\\s*${string(3)}\\s*,?\\s*\\]|\\.\\.\\.(\\w+)`,
    'g',
  );
  for (const match of body.matchAll(pair)) {
    if (match[5]) {
      const file = imports.get(match[5]);
      const shared = file && exportedArray(file, match[5]);
      if (shared) bindings.push(...bindingsOf(shared, imports));
    } else bindings.push({ keys: unescape(match[2]!), action: unescape(match[4]!) });
  }
  return bindings;
}

/** 一页文档的键盘行为与它介绍的组件 */
function pageKeyboard(file: string): { components: string[]; bindings: KeyBinding[] } {
  const text = readFileSync(file, 'utf8');
  const components = [...text.matchAll(/'virtual:api\/(\w+)Props'/g)].map((match) => match[1]!);
  const imports = relativeImports(file, text);
  const bindings: KeyBinding[] = [];
  for (const match of text.matchAll(/<KeyboardReference\b[^>]*?\bkeys=\{/g)) {
    const at = match.index + match[0].length;
    if (text[at] === '[') bindings.push(...bindingsOf(bracketed(text, at), imports));
    else {
      const name = /^\w+/.exec(text.slice(at))?.[0];
      const shared = name && imports.get(name) && exportedArray(imports.get(name)!, name);
      if (shared) bindings.push(...bindingsOf(shared, imports));
    }
  }
  return { components, bindings };
}

/** 全部文档页（components 下各分类的 <组件>/docs.tsx）的键盘行为，按组件名；一个组件出现在几页时合并 */
export function keyboardByComponent(componentsDir: string): Map<string, KeyBinding[]> {
  const byComponent = new Map<string, KeyBinding[]>();
  for (const category of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const page of readdirSync(join(componentsDir, category.name), { withFileTypes: true })) {
      const file = join(componentsDir, category.name, page.name, 'docs.tsx');
      if (!page.isDirectory() || !existsSync(file)) continue;
      const { components, bindings } = pageKeyboard(file);
      if (!bindings.length) continue;
      for (const component of components)
        byComponent.set(component, [...(byComponent.get(component) ?? []), ...bindings]);
    }
  }
  return byComponent;
}

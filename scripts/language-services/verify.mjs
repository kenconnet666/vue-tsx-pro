/**
 * 端到端验证 vue_tsx_pro_lsp：按生成的配置真实启动服务器，逐个调用工具并检查结果。
 * 重启 Codex / Claude Code 之前先跑一遍：pnpm lsp:verify
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';

const SERVER_NAME = 'vue_tsx_pro_lsp';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SWITCH = 'packages/tsx/test/fixtures/Switch.tsx';
const TEMP = 'packages/tsx/test/fixtures/__lsp_verify__.tsx';

/** 优先使用 lsp:setup 生成的 Codex 配置，确保验证的就是客户端将要启动的命令 */
function launchConfig() {
  try {
    const config = parse(readFileSync(resolve(root, '.codex/config.toml'), 'utf8'));
    const server = config.mcp_servers?.[SERVER_NAME];
    if (server) return { ...server, from: '.codex/config.toml' };
  } catch {
    // 尚未运行 lsp:setup
  }
  return {
    command: process.execPath,
    args: ['scripts/language-services/server.mjs', '.'],
    cwd: root,
    from: '默认命令（尚未运行 pnpm lsp:setup）',
  };
}

/** 找到某段文字在文件中的 1 起始位置；offset 用于定位到文字内部 */
function locate(file, text, offset = 0) {
  const lines = readFileSync(resolve(root, file), 'utf8').split('\n');
  const index = lines.findIndex((line) => line.includes(text));
  if (index < 0) throw new Error(`${file} 中找不到 ${text}`);
  return { line: index + 1, column: lines[index].indexOf(text) + 1 + offset };
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail });
}

const launch = launchConfig();
console.log(`启动：${launch.from}\n  ${launch.command} ${launch.args.join(' ')}\n`);

const client = new Client({ name: 'vue-tsx-pro-lsp-verify', version: '0.0.0' });
await client.connect(
  new StdioClientTransport({
    command: launch.command,
    args: launch.args,
    cwd: launch.cwd,
    stderr: 'inherit',
  }),
);

async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content[0]?.text ?? '';
  if (result.isError) throw new Error(`${name} 返回错误：${text}`);
  return JSON.parse(text);
}

try {
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  check(
    '工具列表',
    names.join() === 'completions,definitions,diagnostics,hover,references',
    names.join(', '),
  );

  const clean = await call('diagnostics', { filePath: 'packages/tsx/test/runes.test-d.tsx' });
  check(
    '诊断：类型测试文件无错误',
    clean.errors === 0,
    `TypeScript ${clean.typescript}，${clean.errors} 个错误`,
  );

  const hover = await call('hover', {
    filePath: SWITCH,
    ...locate(SWITCH, 'aria-pressed={checked}', 14),
  });
  check('悬停：符文变量显示为普通类型', /boolean/.test(hover.contents ?? ''), hover.contents);

  const definition = await call('definitions', {
    filePath: SWITCH,
    ...locate(SWITCH, 'import { _component }', 9),
  });
  const target = definition.items[0]?.filePath ?? '';
  check('跳转定义：_component 指向源码', target.endsWith('src/runtime/component.ts'), target);

  const references = await call('references', {
    filePath: SWITCH,
    ...locate(SWITCH, 'function toggle', 9),
  });
  check('查找引用：toggle 声明与使用', references.total >= 2, `${references.total} 处`);

  const completions = await call('completions', {
    filePath: SWITCH,
    ...locate(SWITCH, 'if (disabled) return', 4),
    prefix: 'dis',
  });
  check(
    '补全：包含 disabled',
    completions.items.some((item) => item.name === 'disabled'),
    completions.items.map((item) => item.name).join(', '),
  );

  // 一个文件里放两类错误：类型错误由 TypeScript 报告；符文误用 TypeScript 不报错（对象可以作为监听源），由符文编译器报告
  writeFileSync(
    resolve(root, TEMP),
    [
      "import { watch } from 'vue';",
      "import { _component } from '../../src';",
      'export const Bad = _component(() => {',
      "  let form = _state({ name: '' });",
      '  watch(form, () => {});',
      '  return () => <i>{form.name}</i>;',
      '});',
      "export const wrong: number = 'x';",
      '',
    ].join('\n'),
  );
  try {
    const misuse = await call('diagnostics', { filePath: TEMP });
    const typeError = misuse.diagnostics.find((item) => item.code === 'TS2322');
    check(
      '诊断：发现真实类型错误',
      typeError && typeError.range?.start.line === 8,
      typeError
        ? `第 ${typeError.range?.start.line} 行：${typeError.message}`
        : JSON.stringify(misuse.diagnostics),
    );
    const rune = misuse.diagnostics.find((item) => item.source === 'runes');
    check(
      '诊断：符文误用带位置',
      rune && rune.range?.start.line === 5,
      rune
        ? `第 ${rune.range?.start.line} 行：${rune.message}`
        : JSON.stringify(misuse.diagnostics),
    );

    // 编辑过程中的语法错误：两边都应作为诊断返回，而不是让请求失败
    writeFileSync(resolve(root, TEMP), 'export {};\nlet count = _state(\n');
    const broken = await call('diagnostics', { filePath: TEMP });
    const syntax = broken.diagnostics.find((item) => item.source === 'runes');
    check(
      '诊断：语法错误不中断请求',
      broken.diagnostics.some((item) => item.source === 'typescript') &&
        syntax?.range?.start.line > 0,
      syntax ? `第 ${syntax.range.start.line} 行：${syntax.message}` : JSON.stringify(broken),
    );
  } finally {
    rmSync(resolve(root, TEMP), { force: true });
  }
} finally {
  await client.close();
}

for (const item of checks) console.log(`${item.ok ? '✓' : '✗'} ${item.name}  —  ${item.detail}`);
const failed = checks.filter((item) => !item.ok).length;
console.log(failed ? `\n${failed} 项未通过` : `\n全部 ${checks.length} 项通过，可以重启客户端`);
process.exitCode = failed ? 1 : 0;

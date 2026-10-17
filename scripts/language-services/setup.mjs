/**
 * 生成本机的项目级 MCP 配置，启用 vue_tsx_pro_lsp：
 *
 *   .codex/config.toml           Codex（由 .codex/config.example.toml 生成，只替换受管理的块）
 *   .mcp.json                    Claude Code 项目级 MCP 服务器
 *   .claude/settings.local.json  Claude Code 本机设置：免确认启用上面的服务器
 *
 * 三个文件都包含本机绝对路径，已被 .gitignore 忽略；文件里其他内容原样保留。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';

const SERVER_NAME = 'vue_tsx_pro_lsp';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath.replaceAll('\\', '/');
const rootPath = root.replaceAll('\\', '/');

if (process.versions.node.split('.')[0] !== '24') {
  throw new Error(`需要 Node 24，当前是 ${process.versions.node}`);
}

async function readText(path, fallback) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
  console.log('已写入', path);
}

// ───────────────────────── Codex ─────────────────────────

async function setupCodex() {
  const path = resolve(root, '.codex/config.toml');
  const template = await readFile(resolve(root, '.codex/config.example.toml'), 'utf8');
  const managed =
    /# BEGIN VUE TSX PRO LANGUAGE SERVICES[\s\S]*?# END VUE TSX PRO LANGUAGE SERVICES/u;
  const block = template
    .match(managed)[0]
    .replace('__NODE__', JSON.stringify(node))
    .replace('__ROOT__', JSON.stringify(rootPath));

  const existing = await readText(path, '');
  if (!managed.test(existing) && parse(existing).mcp_servers?.[SERVER_NAME]) {
    throw new Error(`${path} 中已有手写的 ${SERVER_NAME} 配置，请先删除再运行`);
  }
  const next = managed.test(existing)
    ? existing.replace(managed, () => block)
    : existing.trimEnd() + (existing.trim() ? '\n\n' : '') + block + '\n';
  parse(next); // 写入前确认仍是合法 TOML
  await writeText(path, next);
}

// ───────────────────────── Claude Code ─────────────────────────

async function setupClaudeCode() {
  const mcpPath = resolve(root, '.mcp.json');
  const mcp = JSON.parse(await readText(mcpPath, '{}'));
  mcp.mcpServers = {
    ...mcp.mcpServers,
    [SERVER_NAME]: {
      type: 'stdio',
      command: node,
      args: [`${rootPath}/scripts/language-services/server.mjs`, rootPath],
    },
  };
  await writeText(mcpPath, JSON.stringify(mcp, null, 2) + '\n');

  const settingsPath = resolve(root, '.claude/settings.local.json');
  const settings = JSON.parse(await readText(settingsPath, '{}'));
  const enabled = new Set(settings.enabledMcpjsonServers ?? []);
  enabled.add(SERVER_NAME);
  settings.enabledMcpjsonServers = [...enabled];
  await writeText(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

await setupCodex();
await setupClaudeCode();
console.log(
  `\n${SERVER_NAME} 已配置。先运行 pnpm lsp:verify 确认可用，再重启 Codex / Claude Code。`,
);

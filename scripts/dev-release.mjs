// 临时版：不跑测试、不走 CI、不发 npm，直接把四个包（tsx、ui、mobile、mini）打包（pnpm pack，会先构建）挂到一个 GitHub 预发行版上，
// 标签 dev-<提交>。使用方（stride-ts）用 pnpm override 指向打印出来的下载地址，CI 也装得到。用户 2026-11-21 定：先编译直接用、
// 测试后置——测试和正式版（scripts/release.mjs）攒一批再做。
//
//   node scripts/dev-release.mjs        要求：工作区干净、HEAD 已经推送到 origin；同一个提交发过就直接打印地址
//
// 打印一行 JSON：{ "<包名>": "<下载地址>", ... }
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { root } from './lib/repo.mjs';

const PACKAGES = ['tsx', 'ui', 'mobile', 'mini'];
const run = (command, args, cwd = root) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (run('git', ['status', '--porcelain'])) fail('工作区有没提交的改动：先提交、推送再发临时版');
const head = run('git', ['rev-parse', 'HEAD']);
run('git', ['fetch', '--quiet', 'origin']);
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
try {
  run('git', ['merge-base', '--is-ancestor', head, `origin/${branch}`]);
} catch {
  fail(`提交 ${head} 还没推送到 origin/${branch}`);
}
const repo = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
const tag = `dev-${head.slice(0, 10)}`;
const names = Object.fromEntries(
  PACKAGES.map((name) => {
    const manifest = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
    return [
      manifest.name,
      `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`,
    ];
  }),
);
const urls = Object.fromEntries(
  Object.entries(names).map(([pkg, file]) => [
    pkg,
    `https://github.com/${repo}/releases/download/${tag}/${file}`,
  ]),
);

let exists = true;
try {
  run('gh', ['release', 'view', tag]);
} catch {
  exists = false;
}
if (!exists) {
  const out = mkdtempSync(join(tmpdir(), 'vue-tsx-pro-dev-'));
  try {
    for (const name of PACKAGES)
      run('pnpm', ['pack', '--pack-destination', out], join(root, 'packages', name));
    const files = readdirSync(out).map((file) => join(out, file));
    run('gh', [
      'release',
      'create',
      tag,
      ...files,
      '--target',
      head,
      '--prerelease',
      '--title',
      `dev ${head.slice(0, 10)}`,
      '--notes',
      `Temporary packages built from ${head} without running the tests (consumers iterate on them; a regular release follows).`,
    ]);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}
console.log(JSON.stringify(urls));

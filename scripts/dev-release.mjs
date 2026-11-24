// 测试版：在本地把四个包（tsx、ui、mobile、mini）打包（pnpm pack，会先构建），挂到一个滚动的预发行版 dev 上，文件名带提交号
// （zerodep-dev-vue-tsx-pro-ui-0.39.0-<提交前十位>.tgz），只留最近 KEEP 个提交的。不跑测试、不发 npm、不靠 CI（同 stride-ts
// 原生模块的 release-native.ps1 -Dev），不给每个提交打标签（只有一个跟着最新测试版走的 dev 标签）；正式版是推 v* 标签
// （release.yml）发 npm。使用方（stride-ts 的 tools/vue-tsx-pro.ts dev）调它，用 pnpm override 指向打印出来的下载地址。
//
//   node scripts/dev-release.mjs    打包 HEAD（工作区要干净、HEAD 要已推送）、上传、挪 dev 标签、清掉旧的，
//                                   最后一行打印 { "<包名>": "<下载地址>", ... }
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { root } from './lib/repo.mjs';

const PACKAGES = ['tsx', 'ui', 'mobile', 'mini'];
const TAG = 'dev';
/** 留最近几个提交的包：使用方锁着某个提交的地址，太早的删掉免得发行版越堆越多 */
const KEEP = 30;

// 只有 pnpm 要经 shell 起（Windows 上是 .cmd，它的参数没有空格）；git、gh 是可执行文件，不经 shell，带空格的参数原样传
const run = (command, args, cwd = root) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32' && command === 'pnpm',
  }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const repo = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
const manifestOf = (name) =>
  JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
/** 一个包在某个提交上的文件名 */
const fileOf = (name, sha) => {
  const manifest = manifestOf(name);
  return `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}-${sha.slice(0, 10)}.tgz`;
};
const assets = () => {
  try {
    return JSON.parse(run('gh', ['release', 'view', TAG, '--json', 'assets'])).assets;
  } catch {
    return undefined;
  }
};

const head = run('git', ['rev-parse', 'HEAD']);
if (run('git', ['status', '--porcelain']))
  fail('工作区有没提交的改动：先提交，包按 HEAD 的提交号命名');
run('git', ['fetch', '--quiet', 'origin']);
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
try {
  run('git', ['merge-base', '--is-ancestor', head, `origin/${branch}`]);
} catch {
  fail(
    `提交 ${head.slice(0, 10)} 还没推送到 origin/${branch}：先推送，dev 标签和下载地址要对得上远程的提交`,
  );
}

const out = mkdtempSync(join(tmpdir(), 'vue-tsx-pro-dev-'));
try {
  for (const name of PACKAGES) {
    run('pnpm', ['pack', '--pack-destination', out], join(root, 'packages', name));
    // pnpm pack 的文件名不带提交号：按包改名
    const packed = readdirSync(out).find(
      (file) => file.endsWith('.tgz') && !/-[0-9a-f]{10}\.tgz$/.test(file),
    );
    renameSync(join(out, packed), join(out, fileOf(name, head)));
  }
  // dev 标签挪到这个提交（只有这一个标签跟着最新的测试版走）
  run('git', ['tag', '--force', TAG, head]);
  run('git', ['push', '--force', 'origin', `refs/tags/${TAG}`]);
  const notes = `Packages built locally without running the tests, named by commit (the newest ${KEEP} commits are kept). Install one with a pnpm override pointing at its URL; regular releases are the v* tags on npm.`;
  if (!assets()) {
    run('gh', [
      'release',
      'create',
      TAG,
      '--prerelease',
      '--title',
      'dev',
      '--notes',
      notes,
      '--target',
      head,
    ]);
  }
  run('gh', [
    'release',
    'upload',
    TAG,
    '--clobber',
    ...readdirSync(out).map((file) => join(out, file)),
  ]);
  // 只留最近 KEEP 个提交的包
  const recent = new Set(
    run('git', ['log', '--format=%H', `-${KEEP}`, head])
      .split('\n')
      .map((sha) => sha.slice(0, 10)),
  );
  for (const asset of assets()) {
    const sha = /-([0-9a-f]{10})\.tgz$/.exec(asset.name)?.[1];
    if (!sha || !recent.has(sha)) run('gh', ['release', 'delete-asset', TAG, asset.name, '--yes']);
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
console.error(`dev: ${head.slice(0, 10)}`);
console.log(
  JSON.stringify(
    Object.fromEntries(
      PACKAGES.map((name) => [
        manifestOf(name).name,
        `https://github.com/${repo}/releases/download/${TAG}/${fileOf(name, head)}`,
      ]),
    ),
  ),
);

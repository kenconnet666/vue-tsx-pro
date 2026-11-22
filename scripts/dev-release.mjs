// 测试版：推到 master 时 CI（.github/workflows/ci.yml 的第一个任务 dev-release，不等测试）把四个包（tsx、ui、mobile、mini）打包（pnpm pack，会先构建），
// 挂到一个滚动的预发行版 dev 上，文件名带提交号（zerodep-dev-vue-tsx-pro-ui-0.39.0-<提交前十位>.tgz），只留最近 KEEP 个提交的。
// 不跑测试、不发 npm、不给每个提交打标签（只有一个跟着 master 走的 dev 标签）；正式版是推 v* 标签（release.yml）发 npm。
// 使用方（stride-ts）用 pnpm override 指向打印出来的下载地址，CI 也装得到。
//
//   node scripts/dev-release.mjs --publish    CI 里：打包、上传、挪 dev 标签、清掉旧的
//   node scripts/dev-release.mjs [提交]        本地：等那个提交（默认 HEAD，要已推送）的包挂上去，打印 { "<包名>": "<下载地址>", ... }
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { root } from './lib/repo.mjs';

const PACKAGES = ['tsx', 'ui', 'mobile', 'mini'];
const TAG = 'dev';
/** 留最近几个提交的包：使用方锁着某个提交的地址，太早的删掉免得发行版越堆越多 */
const KEEP = 30;
/** 本地等 CI 挂上包：最多等多久、多久看一次 */
const WAIT_MS = 15 * 60_000;
const POLL_MS = 15_000;

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
/** 一个包在某个提交上的文件名 */
const fileOf = (name, sha) => {
  const manifest = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
  return `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}-${sha.slice(0, 10)}.tgz`;
};
const assets = () => {
  try {
    return JSON.parse(run('gh', ['release', 'view', TAG, '--json', 'assets'])).assets;
  } catch {
    return undefined;
  }
};

if (process.argv.includes('--publish')) {
  const head = run('git', ['rev-parse', 'HEAD']);
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
    // dev 标签挪到这个提交（只有这一个标签跟着 master 走）
    run('git', ['tag', '--force', TAG, head]);
    run('git', ['push', '--force', 'origin', `refs/tags/${TAG}`]);
    const notes = `Packages built from master without running the tests, named by commit (the newest ${KEEP} commits are kept). Install one with a pnpm override pointing at its URL; regular releases are the v* tags on npm.`;
    if (!assets()) {
      run('gh', [
        'release',
        'create',
        TAG,
        '--prerelease',
        '--title',
        'dev (master)',
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
    const commits = [
      ...new Set(
        assets()
          .map((asset) => /-([0-9a-f]{10})\.tgz$/.exec(asset.name)?.[1])
          .filter(Boolean),
      ),
    ];
    const recent = new Set(
      run('git', ['log', '--format=%H', `-${KEEP}`, head])
        .split('\n')
        .map((sha) => sha.slice(0, 10)),
    );
    for (const asset of assets()) {
      const sha = /-([0-9a-f]{10})\.tgz$/.exec(asset.name)?.[1];
      if (!sha || !recent.has(sha))
        run('gh', ['release', 'delete-asset', TAG, asset.name, '--yes']);
    }
    console.log(
      `dev: ${head.slice(0, 10)} (${commits.length} commits on the release before pruning)`,
    );
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
} else {
  const target = process.argv[2] ?? 'HEAD';
  const sha = run('git', ['rev-parse', target]);
  run('git', ['fetch', '--quiet', 'origin']);
  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  try {
    run('git', ['merge-base', '--is-ancestor', sha, `origin/${branch}`]);
  } catch {
    fail(`提交 ${sha} 还没推送到 origin/${branch}：推送以后 CI 才会发它的测试版`);
  }
  const files = Object.fromEntries(
    PACKAGES.map((name) => {
      const manifest = JSON.parse(
        readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'),
      );
      return [manifest.name, fileOf(name, sha)];
    }),
  );
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    const names = new Set((assets() ?? []).map((asset) => asset.name));
    if (Object.values(files).every((file) => names.has(file))) break;
    if (Date.now() > deadline)
      fail(
        `等了 ${WAIT_MS / 60_000} 分钟，dev 上还没有 ${sha.slice(0, 10)} 的包：看 Dev release 工作流`,
      );
    console.error(`等 CI 把 ${sha.slice(0, 10)} 的包挂到 dev 上……`);
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  const urls = Object.fromEntries(
    Object.entries(files).map(([pkg, file]) => [
      pkg,
      `https://github.com/${repo}/releases/download/${TAG}/${file}`,
    ]),
  );
  console.log(JSON.stringify(urls));
}

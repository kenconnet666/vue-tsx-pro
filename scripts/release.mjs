// 发版：改四个包的版本号、把 RELEASE.md 的“下一版对使用方的变化”搬进 CHANGELOG.md、提交、打标签并推送；
// 标签触发 .github/workflows/release.yml，在 CI 里验证打包产物、带 provenance 发布 npm、建 GitHub Release。
//
//   node scripts/release.mjs 0.12.0          发版（要求：在 master、工作区干净、与 origin 一致、HEAD 的 CI 把关的任务全部通过）
//   node scripts/release.mjs 0.12.0 --wait   推送后直接运行：等 CI 把关的任务跑完再发（只报告的截图比对不等）
//   node scripts/release.mjs --verify 0.12.0 四个包的版本号都是 0.12.0（发布工作流用）
//   node scripts/release.mjs --notes 0.12.0  打印 CHANGELOG.md 里这一版的说明（发布工作流建 GitHub Release 用）
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib/repo.mjs';

const PACKAGES = ['tsx', 'ui', 'mobile', 'mini'];
const HEADING = '## 下一版对使用方的变化';
const EMPTY = '（暂无）';

const args = process.argv.slice(2).filter((arg) => arg !== '--wait');
const [mode, version] = args[0]?.startsWith('--') ? [args[0], args[1]] : ['--release', args[0]];
if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version ?? '')) {
  console.error('用法：node scripts/release.mjs [--verify | --notes] <版本，如 0.12.0> [--wait]');
  process.exit(1);
}

const read = (file) => readFileSync(join(root, file), 'utf8');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

/** CHANGELOG.md 里某一版的说明（不含标题） */
function notesOf(changelog, target) {
  const match = new RegExp(
    `^## ${target.replaceAll('.', '\\.')}\\b[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
    'm',
  ).exec(changelog);
  return match?.[1]?.trim();
}

/** 只报告、不把关的 CI 任务：截图比对（外观的改动由人看差异图确认），发版不等它 */
const REPORT_ONLY = new Set(['visual']);
const gh = (...args) => JSON.parse(execFileSync('gh', args, { cwd: root, encoding: 'utf8' }));

/**
 * HEAD 的 CI 里把关的任务都通过了才发；带 --wait 时等它们跑完（每 30 秒看一次），有一个失败就停。
 * 推送之后直接 `node scripts/release.mjs <版本> --wait`，不用另外盯着 CI
 */
async function waitForCi(head) {
  const wait = process.argv.includes('--wait');
  for (;;) {
    const [run] = gh(
      'run',
      'list',
      '--commit',
      head,
      '--workflow',
      'ci.yml',
      '--json',
      'databaseId',
    );
    const jobs = run
      ? gh('run', 'view', String(run.databaseId), '--json', 'jobs').jobs.filter(
          (job) => !REPORT_ONLY.has(job.name),
        )
      : [];
    const failed = jobs.filter((job) => job.status === 'completed' && job.conclusion !== 'success');
    if (failed.length)
      fail(`HEAD（${head.slice(0, 8)}）的 CI 没通过：${failed.map((job) => job.name).join('、')}`);
    const pending = jobs.filter((job) => job.status !== 'completed');
    if (run && jobs.length && !pending.length) return;
    if (!wait) fail(`HEAD（${head.slice(0, 8)}）的 CI 还没跑完，等绿了再发（或加 --wait）`);
    console.log(
      run
        ? `等 CI：还有 ${pending.map((job) => job.name).join('、') || '任务没排上'}`
        : '等 CI 开始',
    );
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
}

if (mode === '--verify') {
  const wrong = PACKAGES.filter(
    (name) => JSON.parse(read(`packages/${name}/package.json`)).version !== version,
  );
  if (wrong.length) fail(`这些包的版本号不是 ${version}：${wrong.join('、')}`);
  console.log(`四个包都是 ${version}`);
} else if (mode === '--notes') {
  const notes = notesOf(read('CHANGELOG.md'), version);
  if (!notes) fail(`CHANGELOG.md 里没有 ${version} 这一节`);
  console.log(notes);
} else {
  if (git('branch', '--show-current') !== 'master') fail('要在 master 上发版');
  if (git('status', '--porcelain')) fail('工作区有没提交的改动');
  git('fetch', '-q', 'origin', 'master');
  const head = git('rev-parse', 'HEAD');
  if (head !== git('rev-parse', 'origin/master'))
    fail('本地 master 与 origin/master 不一致，先推送或拉取');
  await waitForCi(head);

  const release = read('RELEASE.md');
  const start = release.indexOf(HEADING);
  const end = release.indexOf('\n## ', start + HEADING.length);
  const section = release.slice(start + HEADING.length, end);
  // 小节开头那段说明（“发布时把这一节……”）之后才是条目
  const intro = section.trim().split('\n\n')[0];
  const entries = section.trim().slice(intro.length).trim();
  if (!entries || entries === EMPTY)
    fail('RELEASE.md 的“下一版对使用方的变化”是空的，先写上这一版的变化');

  for (const name of PACKAGES) {
    const file = `packages/${name}/package.json`;
    writeFileSync(
      join(root, file),
      read(file).replace(/"version": "[^"]+"/, `"version": "${version}"`),
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  const changelog = read('CHANGELOG.md');
  // 新的一版插在第一个版本标题前面（还没有版本时接在末尾）
  const firstEntry = changelog.indexOf('\n## ') + 1 || changelog.length;
  writeFileSync(
    join(root, 'CHANGELOG.md'),
    `${changelog.slice(0, firstEntry)}## ${version}（${date}）\n\n${entries}\n\n${changelog.slice(firstEntry)}`,
  );
  writeFileSync(
    join(root, 'RELEASE.md'),
    `${release.slice(0, start + HEADING.length)}\n\n${intro}\n\n${EMPTY}\n${release.slice(end)}`,
  );

  git(
    'add',
    'CHANGELOG.md',
    'RELEASE.md',
    ...PACKAGES.map((name) => `packages/${name}/package.json`),
  );
  // RELEASE_TRAILER：提交说明末尾的附加行（如 Co-Authored-By），不写时没有
  const trailer = process.env.RELEASE_TRAILER ? ['-m', process.env.RELEASE_TRAILER] : [];
  git('commit', '-q', '-m', `chore(release): ${version}`, ...trailer);
  git('tag', '-a', `v${version}`, '-m', version);
  git('push', '-q', 'origin', 'master', `v${version}`);
  console.log(`已推送 v${version}：Release 工作流接着发布 npm、建 GitHub Release`);
}

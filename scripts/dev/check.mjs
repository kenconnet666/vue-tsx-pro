/**
 * 提交前的检查，只查改动涉及的项目：先自动修（文字、格式、组件库的导出入口），再对每个改到的项目跑它自己的 lint、typecheck
 * 与全部 check:*（packages/*、apps/* 的 package.json），最后是改到时才跑的跨包检查。任何一步失败就打印输出并以 1 退出。
 *
 * 用法：node scripts/dev/check.mjs && git commit …（别接管道，管道会吞掉退出码）
 *       node scripts/dev/check.mjs --all   全部项目都查（等于 CI 的 check 任务）
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const all = process.argv.includes('--all');
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);

/** 跑一条命令；失败时打印最后 30 行并退出 */
function step(name, command, args, cwd = root) {
  const started = Date.now();
  // 整条命令交给 shell（Windows 上 pnpm 是 .cmd，要经 shell 启动）；参数都是脚本名、文件路径，加引号即可
  const line = [command, ...args.map((arg) => `"${arg}"`)].join(' ');
  const result = spawnSync(line, { cwd, encoding: 'utf8', shell: true });
  if (result.status !== 0) {
    const out = `${result.stdout ?? ''}${result.stderr ?? ''}`.trimEnd().split('\n');
    console.log(`FAILED: ${name}\n${out.slice(-30).join('\n')}`);
    process.exit(1);
  }
  console.log(`ok  ${name}  ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

/** 有 package.json 的项目目录（相对仓库根目录） */
const projects = ['packages', 'packages/flow', 'apps']
  .flatMap((dir) =>
    readdirSync(join(root, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${dir}/${entry.name}`),
  )
  .filter((dir) => existsSync(join(root, dir, 'package.json')));

// 新文件先登记（intent-to-add）：按 git ls-files 取文件的检查才看得到它
const untracked = git('ls-files', '-o', '--exclude-standard');
if (untracked.length) git('add', '-N', ...untracked);
const changed = [...new Set([...git('diff', '--name-only', 'HEAD'), ...untracked])].filter((file) =>
  existsSync(join(root, file)),
);

step('text --fix', 'node', ['scripts/text/check.mjs', '--fix']);
const formattable = changed.filter((file) => /\.(tsx?|mjs|md|json|ya?ml|css)$/.test(file));
if (formattable.length)
  step('prettier --write', 'pnpm', ['exec', 'prettier', '--write', ...formattable]);

const touched = all
  ? projects
  : projects.filter((dir) => changed.some((file) => file.startsWith(`${dir}/`)));
// 流程引擎三个包的类型检查挂在模型包上（共用 packages/flow/tsconfig.json）
if (
  touched.some((dir) => dir.startsWith('packages/flow/')) &&
  !touched.includes('packages/flow/model')
)
  touched.push('packages/flow/model');
if (touched.includes('packages/ui'))
  step('ui exports', 'pnpm', ['-s', '-C', 'packages/ui', 'exports']);

for (const dir of touched) {
  const { scripts = {} } = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8'));
  const names = Object.keys(scripts).filter(
    (name) => name === 'lint' || name === 'typecheck' || name.startsWith('check:'),
  );
  for (const name of names) step(`${dir} ${name}`, 'pnpm', ['-s', name], join(root, dir));
}

// 跨包的检查：改到包的源码才查分层与两份拷贝，改到文档或注释才查引用
if (all || touched.some((dir) => dir.startsWith('packages/'))) {
  step('check:deps', 'pnpm', ['-s', 'check:deps']);
  step('check:copies', 'pnpm', ['-s', 'check:copies']);
}
if (all || changed.length) step('check:refs', 'pnpm', ['-s', 'check:refs']);
console.log(`CHECKS OK（${touched.length ? touched.join('、') : '没有改到项目'}）`);

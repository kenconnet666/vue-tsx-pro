#!/usr/bin/env node
/**
 * 命令行 vtp-ui：
 *   vtp-ui create <目录>   从模板建一个桌面后台的新项目（AppShell、vue-router、列表 / 详情 / 编辑页）
 *
 * 模板在包里的 template 目录；组件库与框架的版本取这个包自己的版本（四个包一起发布、版本相同）。
 * 用到 Node 的内置模块，不经构建：发布的包里就是这个文件
 */
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { cwd } from 'node:process';

const TEMPLATE = new URL('../template/', import.meta.url);

function create(dir) {
  if (!dir) throw new Error('用法：vtp-ui create <目录>');
  const target = resolve(cwd(), dir);
  if (existsSync(target) && readdirSync(target).length) throw new Error(`${target} 不是空目录`);
  cpSync(TEMPLATE, target, { recursive: true });
  // npm 发布时会去掉包里的 .gitignore，模板里叫 gitignore
  renameSync(join(target, 'gitignore'), join(target, '.gitignore'));
  const own = JSON.parse(readFileSync(new URL('../package.json', TEMPLATE), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
  manifest.name = basename(target);
  Object.assign(manifest.dependencies, {
    '@zerodep-dev/vue-tsx-pro-ui': `^${own.version}`,
    '@zerodep-dev/vue-tsx-pro-tsx': `^${own.version}`,
  });
  writeFileSync(join(target, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`已建好 ${target}\n  cd ${dir}\n  npm install\n  npm run dev`);
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'create') create(args[0]);
  else console.log('用法：\n  vtp-ui create <目录>   从模板建一个桌面后台的新项目');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

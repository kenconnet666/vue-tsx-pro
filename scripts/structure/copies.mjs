/**
 * 两个包各放一份的文件（包之间不能互相导入时，比如移动端与桌面组件库共用的省市区数据、文档站与 flow-demo 共用的流程设计组合）：以第一份为准，核对第二份一模一样。
 *
 * 用法：node scripts/structure/copies.mjs（pnpm layers:check 里一起跑）；--write 时把第一份抄过去
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../lib/repo.mjs';

/** [以它为准, 副本] */
const COPIES = [
  ['packages/mobile/src/area/data.ts', 'packages/ui/src/area/data.ts'],
  // 流程设计与审批的组合：文档站一页为准，flow-demo 照抄（应用之间不能互相导入）
  [
    'apps/docs/src/components/patterns/Workflow/process-diagram.tsx',
    'apps/flow-demo/src/process-diagram.tsx',
  ],
  [
    'apps/docs/src/components/patterns/Workflow/node-panel.tsx',
    'apps/flow-demo/src/node-panel.tsx',
  ],
];

const write = process.argv.includes('--write');
const stale = [];
for (const [source, copy] of COPIES) {
  const text = readFileSync(join(root, source), 'utf8');
  let current = '';
  try {
    current = readFileSync(join(root, copy), 'utf8');
  } catch {
    // 还没有副本：按不一致处理
  }
  if (current === text) continue;
  if (write) writeFileSync(join(root, copy), text);
  else stale.push(`${copy}（应与 ${source} 一致）`);
}

if (stale.length) {
  console.error(
    `以下副本与原件不一致，运行 node scripts/structure/copies.mjs --write 同步：\n${stale.join('\n')}`,
  );
  process.exit(1);
}
console.log(`副本检查通过：${COPIES.length} 份`);

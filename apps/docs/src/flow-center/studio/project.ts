/**
 * 工作室里的工程（packages/flow/docs/decisions/0002-projects.md）：工作副本就是路径 → 源码。
 * 图（设计器）读写 process.json，代码页直接改各个文件；发布、检查都把整份文件交给引擎。
 */
import { templates, type FlowProject, type ProcessDefinition } from '@zerodep-dev/flow-ts-model';

export const PROCESS_FILE = 'process.json';
/** 场景测试的文件 */
export const TEST_FILE = 'test.ts';

/** 新建时能选的起点 */
export const STARTERS = [
  { id: 'blank', title: '空白', text: '只有开始与结束，自己加环节' },
  { id: 'leave', title: '请假', text: '经理审批，超过 3 天再给人事备案' },
  { id: 'purchase', title: '采购申请', text: '部门经理审批，金额超过一万再给总经理' },
  { id: 'expense', title: '报销', text: '财务复核（财务的人谁有空谁认领）' },
] as const;

export type StarterId = (typeof STARTERS)[number]['id'];

const blank = (key: string, name: string): ProcessDefinition => ({
  key,
  name,
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    { id: 'end', type: 'end', name: '结束', result: 'approved' },
  ],
  edges: [{ id: 'e1', from: 'start', to: 'end' }],
});

/** 从起点建一个新工程：键与名字按填的换掉 */
export function starterProject(starter: StarterId, key: string, name: string): FlowProject {
  const definition =
    starter === 'blank' ? blank(key, name) : { ...templates[starter](), key, name };
  return { files: { [PROCESS_FILE]: stringify(definition) } };
}

/** 宽度上限：同仓库 prettier 的 printWidth */
const WIDTH = 100;

/** 一个 JSON 值的写法：放得下一行（连同缩进）就写一行，否则对象、数组分行；同 prettier 格式化过的 JSON */
function json(value: unknown, indent: string): string {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value);
  const inner = `${indent}  `;
  const items = Array.isArray(value)
    ? value.map((item) => json(item, inner))
    : Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${JSON.stringify(k)}: ${json(v, inner)}`);
  const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}'];
  if (items.length === 0) return `${open}${close}`;
  const flat = Array.isArray(value) ? `[${items.join(', ')}]` : `{ ${items.join(', ')} }`;
  if (!flat.includes('\n') && indent.length + flat.length <= WIDTH - 2) return flat;
  return `${open}\n${items.map((item) => `${inner}${item}`).join(',\n')}\n${indent}${close}`;
}

/** process.json 的写法：同 prettier 格式化过的样子，设计器改了图，版本对比里只看得到真改的行 */
export const stringify = (definition: ProcessDefinition): string => {
  // 顶层总是分行（同仓库里的样例）
  const entries = Object.entries(definition)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${json(v, '  ')}`);
  return `{\n${entries.join(',\n')}\n}\n`;
};

/** 读出图；写坏了时是 undefined（代码页里正在改到一半） */
export function definitionOf(
  files: Readonly<Record<string, string>>,
): ProcessDefinition | undefined {
  try {
    return JSON.parse(files[PROCESS_FILE] ?? '') as ProcessDefinition;
  } catch {
    return undefined;
  }
}

/** 文件的先后：process.json、form.ts、logic.ts、test.ts 在前，其余按路径 */
export function sortedPaths(files: Readonly<Record<string, string>>): string[] {
  const rank = (path: string) => [PROCESS_FILE, 'form.ts', 'logic.ts', TEST_FILE].indexOf(path);
  return Object.keys(files).sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra >= 0 || rb >= 0) return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
    return a.localeCompare(b);
  });
}

/** 新文件的样板：form.ts、logic.ts 按约定写好开头 */
export function fileTemplate(path: string): string {
  if (path === 'form.ts')
    return `import { defineForm } from '@zerodep-dev/flow-ts-model';\n\nexport default defineForm({\n  title: { label: '事由', type: 'text', required: true },\n});\n`;
  if (path === 'logic.ts')
    return `import { defineLogic } from '@zerodep-dev/flow-ts-engine';\nimport form from './form';\n\nexport default defineLogic(form, {\n  guards: {},\n});\n`;
  if (path === TEST_FILE)
    return `import { defineScenarios } from '@zerodep-dev/flow-ts-engine';
import form from './form';

export default defineScenarios(form, {
  '发起后停在第一步': {
    variables: {},
    expect: { status: 'active' },
  },
});
`;
  return '';
}

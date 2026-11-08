/**
 * 字段清单写回 form.ts（工作室的表单设计器改完用）：`defineForm({...})` 的字面量，键能不加引号就不加，文字用单引号、
 * 两格缩进、末尾逗号，同仓库的 prettier 风格。手写在 form.ts 里的注释、别的代码不保留——设计器与 form.ts 是同一份清单。
 */
import type { FormManifest } from './manifest.ts';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const quote = (text: string) =>
  `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;

/** 一个值写成 TS 字面量；indent 是这一层的缩进 */
function literal(value: unknown, indent: string): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    // 全是简单值的短数组写在一行
    const flat = value.map((item) => literal(item, inner));
    if (
      value.every((item) => typeof item !== 'object' || item === null) &&
      flat.join(', ').length < 60
    )
      return `[${flat.join(', ')}]`;
    return `[\n${flat.map((item) => `${inner}${item},`).join('\n')}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== undefined,
  );
  if (entries.length === 0) return '{}';
  const key = (name: string) => (IDENTIFIER.test(name) ? name : quote(name));
  const oneLine = `{ ${entries.map(([k, v]) => `${key(k)}: ${literal(v, inner)}`).join(', ')} }`;
  // 字段的属性一般不长：放得下一行（同 prettier 的 100 列减去缩进）就写一行
  if (!oneLine.includes('\n') && oneLine.length + indent.length < 90) return oneLine;
  return `{\n${entries.map(([k, v]) => `${inner}${key(k)}: ${literal(v, inner)},`).join('\n')}\n${indent}}`;
}

/** 整个 form.ts 的源码：每个字段一行起头（字段多半写得下一行） */
export function formFileSource(manifest: FormManifest): string {
  const fields = Object.entries(manifest)
    .map(
      ([name, field]) =>
        `  ${IDENTIFIER.test(name) ? name : quote(name)}: ${literal(field, '  ')},`,
    )
    .join('\n');
  const body = fields ? `{\n${fields}\n}` : '{}';
  return `import { defineForm } from '@zerodep-dev/flow-ts-model';\n\nexport default defineForm(${body});\n`;
}

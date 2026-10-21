/**
 * 组件演练场的控件：从 API 数据（virtual:api-catalog）推导每个属性用什么控件调。
 * 档位（keyof X、字面量联合）→ 分段按钮或下拉；boolean → 开关；string、number → 输入框；IconData → 图标库（IconGallery）。
 * 函数、数组、对象等复杂类型不给控件，需要时由预设（presets.tsx）固定传入。
 */
import type { ApiProp } from '@vue-tsx-pro/ui/docs-kit';

/** 一个属性的控件 */
export type Control =
  | { kind: 'enum'; prop: ApiProp; options: readonly string[] }
  | { kind: 'boolean' | 'text' | 'number' | 'icon'; prop: ApiProp };

/** 不值得调的属性：表单字段名、元素 id */
const SKIPPED = new Set(['id', 'name']);

/** 属性 → 控件；没有合适控件时返回 undefined */
export function controlOf(prop: ApiProp): Control | undefined {
  if (prop.kind !== 'prop' || SKIPPED.has(prop.name)) return undefined;
  if (prop.values?.length) {
    return { kind: 'enum', prop, options: prop.values.map((item) => item.value) };
  }
  if (prop.type === 'boolean') return { kind: 'boolean', prop };
  if (prop.type === 'string') return { kind: 'text', prop };
  if (prop.type === 'number' || prop.type === 'number | null') return { kind: 'number', prop };
  if (/^IconData\b/.test(prop.type)) return { kind: 'icon', prop };
  return undefined;
}

/** 默认值的源码（`'solid'`、`false`、`0.5`）→ 值；表达式（变量、调用）读不出时返回 undefined */
export function parseDefault(source: string | undefined): unknown {
  if (source === undefined) return undefined;
  if (source === 'true' || source === 'false') return source === 'true';
  if (/^-?\d+(\.\d+)?$/.test(source)) return Number(source);
  const quoted = /^(['"`])(.*)\1$/.exec(source);
  return quoted ? quoted[2] : undefined;
}

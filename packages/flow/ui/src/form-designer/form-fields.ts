/**
 * 表单设计器改字段清单的函数：都返回新的清单，不改原来的。字段的路径是 `名字`，明细表的列是 `明细表.列`。
 * 字段的先后就是清单里键的先后（JSON 对象按写入的顺序），重排、改名都照这个顺序重建。
 */
import type {
  BuiltinFieldType,
  Condition,
  FieldDefinition,
  FormManifest,
} from '@zerodep-dev/flow-ts-model';

/** 设计器能加的字段类型：名字与新字段的样子 */
export const FIELD_TYPES: readonly {
  type: BuiltinFieldType;
  label: string;
  make: () => FieldDefinition;
}[] = [
  { type: 'text', label: '文字', make: () => ({ label: '文字', type: 'text' }) },
  { type: 'number', label: '数字', make: () => ({ label: '数字', type: 'number' }) },
  { type: 'decimal', label: '金额', make: () => ({ label: '金额', type: 'decimal', scale: 2 }) },
  { type: 'boolean', label: '开关', make: () => ({ label: '开关', type: 'boolean' }) },
  { type: 'date', label: '日期', make: () => ({ label: '日期', type: 'date' }) },
  { type: 'datetime', label: '日期时间', make: () => ({ label: '时间', type: 'datetime' }) },
  {
    type: 'select',
    label: '选择',
    make: () => ({
      label: '选择',
      type: 'select',
      options: [
        { value: 'a', label: '选项一' },
        { value: 'b', label: '选项二' },
      ],
    }),
  },
  { type: 'people', label: '人员', make: () => ({ label: '人员', type: 'people' }) },
  { type: 'file', label: '附件', make: () => ({ label: '附件', type: 'file' }) },
  {
    type: 'list',
    label: '明细表',
    make: () => ({
      label: '明细',
      type: 'list',
      fields: { item: { label: '项目', type: 'text' } },
    }),
  },
];

/** 类型的名字 */
export const fieldTypeLabel = (type: string) =>
  FIELD_TYPES.find((item) => item.type === type)?.label ?? type;

/** 拆开路径：明细表的列是 [明细表, 列] */
function split(path: string): [string] | [string, string] {
  const dot = path.indexOf('.');
  return dot < 0 ? [path] : [path.slice(0, dot), path.slice(dot + 1)];
}

/** 改一层里的字段（顶层，或某个明细表的列），返回新的清单 */
function withLevel(
  manifest: FormManifest,
  list: string | undefined,
  update: (fields: FormManifest) => FormManifest,
): FormManifest {
  if (list === undefined) return update(manifest);
  const owner = manifest[list];
  if (owner?.type !== 'list') return manifest;
  return { ...manifest, [list]: { ...owner, fields: update(owner.fields ?? {}) } };
}

/** 这一层里没用过的名字：类型名后面加序号（text1、text2…） */
export function freshName(fields: FormManifest, base: string): string {
  for (let index = 1; ; index++)
    if (!Object.hasOwn(fields, `${base}${index}`)) return `${base}${index}`;
}

/** 加一个字段：list 给了时加成那个明细表的列；返回新清单与新字段的路径 */
export function insertField(
  manifest: FormManifest,
  field: FieldDefinition,
  list?: string,
): { manifest: FormManifest; path: string } {
  let name = '';
  const next = withLevel(manifest, list, (fields) => {
    name = freshName(fields, field.type);
    return { ...fields, [name]: field };
  });
  return { manifest: next, path: list === undefined ? name : `${list}.${name}` };
}

/** 改一个字段 */
export function updateField(
  manifest: FormManifest,
  path: string,
  update: (field: FieldDefinition) => FieldDefinition,
): FormManifest {
  const [first, column] = split(path);
  const list = column === undefined ? undefined : first;
  const name = column ?? first;
  return withLevel(manifest, list, (fields) =>
    fields[name] ? { ...fields, [name]: update(fields[name]) } : fields,
  );
}

/** 删一个字段 */
export function removeField(manifest: FormManifest, path: string): FormManifest {
  const [first, column] = split(path);
  const list = column === undefined ? undefined : first;
  const name = column ?? first;
  return withLevel(manifest, list, (fields) =>
    Object.fromEntries(Object.entries(fields).filter(([key]) => key !== name)),
  );
}

/** 按给的名字重排一层的字段（拖动排序后）；没列出的接在后面 */
export function orderFields(
  manifest: FormManifest,
  names: readonly string[],
  list?: string,
): FormManifest {
  return withLevel(manifest, list, (fields) => {
    const rest = Object.keys(fields).filter((name) => !names.includes(name));
    return Object.fromEntries(
      [...names, ...rest].filter((name) => fields[name]).map((name) => [name, fields[name]!]),
    );
  });
}

/** 条件里引用的字段换名字 */
function renameInCondition(condition: Condition, from: string, to: string): Condition {
  if ('not' in condition) return { not: renameInCondition(condition.not, from, to) };
  if ('all' in condition) return { all: condition.all.map((c) => renameInCondition(c, from, to)) };
  if ('any' in condition) return { any: condition.any.map((c) => renameInCondition(c, from, to)) };
  return condition.field === from ? { ...condition, field: to } : condition;
}

/**
 * 改字段名：位置不变；顶层字段改名时，别的字段的显示、必填条件里的 `form.旧名` 跟着改。
 * 新名字不合法或已经用了时抛错（设计器显示原因）
 */
export function renameField(manifest: FormManifest, path: string, to: string): FormManifest {
  const [first, column] = split(path);
  const list = column === undefined ? undefined : first;
  const from = column ?? first;
  if (from === to) return manifest;
  if (!/^[a-z][A-Za-z0-9]{0,63}$/.test(to)) throw new Error('字段名要小写字母开头，只用字母和数字');
  const renamed = withLevel(manifest, list, (fields) => {
    if (Object.hasOwn(fields, to)) throw new Error(`已经有叫 ${to} 的字段了`);
    return Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key === from ? to : key, field]),
    );
  });
  if (list !== undefined) return renamed;
  const rewrite = (field: FieldDefinition): FieldDefinition => {
    const next: Record<string, unknown> = { ...field };
    for (const key of ['visibleWhen', 'requiredWhen'] as const)
      if (field[key]) next[key] = renameInCondition(field[key], `form.${from}`, `form.${to}`);
    return next as unknown as FieldDefinition;
  };
  return Object.fromEntries(Object.entries(renamed).map(([key, field]) => [key, rewrite(field)]));
}

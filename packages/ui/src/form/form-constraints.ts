/**
 * 从 zod schema 推出字段约束：必填、长度、数值范围、格式、可选值。useForm 据此告诉 Field 与控件，
 * 只写一份 schema，标签上的必填标记、输入框的 maxlength、NumberField 的 min / max 就都有了。
 *
 * 用 zod 的 toJSONSchema（输入一侧）把 schema 转成 JSON Schema，再按字段路径取约束；JSON Schema 表达不了的部分
 * （transform、refine、自定义类型）不产生约束，校验照常由 schema 负责。控件上显式写的属性总是优先。
 *
 *   const constraints = createConstraints(z.object({ name: z.string().min(1).max(20), age: z.number().int().min(0) }));
 *   constraints('name')  // { required: true, minLength: 1, maxLength: 20 }
 *   constraints('age')   // { required: true, min: 0, step: 1 }
 */
import { toJSONSchema, type $ZodType } from 'zod/v4/core';

/** 一个字段从 schema 推出的约束；推不出的项不出现 */
export interface FieldConstraints {
  /** 必填：值不能为空（字符串至少 1 个字、数组至少 1 项、数字等不能缺） */
  required?: boolean;
  /** 最少几个字 */
  minLength?: number;
  /** 最多几个字 */
  maxLength?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步长（倍数约束，整数时为 1） */
  step?: number;
  /** 正则（字符串约束，不含首尾的 /） */
  pattern?: string;
  /** 格式：email、uri、date 等（JSON Schema 的 format） */
  format?: string;
  /** 可选值（枚举） */
  options?: readonly (string | number)[];
}

type JsonSchema = Record<string, unknown>;

const NONE: FieldConstraints = Object.freeze({});

/** schema → JSON Schema（输入一侧）；表达不了的类型当作 any，循环引用写成 $ref */
function toJsonSchema(schema: $ZodType): JsonSchema | undefined {
  try {
    return toJSONSchema(schema, {
      io: 'input',
      unrepresentable: 'any',
      cycles: 'ref',
    }) as JsonSchema;
  } catch (error) {
    // 理论上不会走到这里（unrepresentable: 'any'）；约束只是辅助，失败时不影响校验
    console.warn('useForm：无法从 schema 推出字段约束', error);
    return undefined;
  }
}

/** 解开 $ref（只认本文档的 #/$defs/…）与“允许 null”的 anyOf：返回实际的 schema 与是否允许 null */
function unwrap(
  root: JsonSchema,
  node: JsonSchema | undefined,
): { node?: JsonSchema; nullable: boolean } {
  let current = node;
  let nullable = false;
  for (let depth = 0; current && depth < 10; depth++) {
    const ref = current.$ref;
    if (typeof ref === 'string' && ref.startsWith('#/$defs/')) {
      current = (root.$defs as Record<string, JsonSchema> | undefined)?.[ref.slice(8)];
      continue;
    }
    // type: ['string', 'null']（nullable）
    if (Array.isArray(current.type) && current.type.includes('null')) {
      const types = current.type.filter((type) => type !== 'null');
      nullable = true;
      current = { ...current, type: types.length === 1 ? types[0] : types };
      continue;
    }
    const variants = (current.anyOf ?? current.oneOf) as JsonSchema[] | undefined;
    if (variants) {
      const rest = variants.filter((variant) => variant.type !== 'null');
      nullable ||= rest.length < variants.length;
      if (rest.length === 1) {
        current = rest[0];
        continue;
      }
    }
    break;
  }
  return { node: current, nullable };
}

const numberOf = (value: unknown) => (typeof value === 'number' ? value : undefined);

/** 字段自己的 schema → 约束；parentRequires 表示父对象要求这个键存在 */
function constraintsOf(
  node: JsonSchema,
  nullable: boolean,
  parentRequires: boolean,
): FieldConstraints {
  const result: FieldConstraints = {};
  const type = node.type;
  if (type === 'string') {
    result.minLength = numberOf(node.minLength);
    result.maxLength = numberOf(node.maxLength);
    if (typeof node.pattern === 'string') result.pattern = node.pattern;
    if (typeof node.format === 'string') result.format = node.format;
  }
  if (type === 'number' || type === 'integer') {
    result.min = numberOf(node.minimum);
    result.max = numberOf(node.maximum);
    result.step = numberOf(node.multipleOf) ?? (type === 'integer' ? 1 : undefined);
  }
  if (Array.isArray(node.enum)) result.options = node.enum as (string | number)[];
  // 键存在不等于“必填”：空字符串、false 通过 z.string()、z.boolean() 的校验，要看值本身能不能为空
  const nonEmpty =
    type === 'string'
      ? (result.minLength ?? 0) > 0 ||
        result.format != null ||
        result.pattern != null ||
        result.options != null
      : type === 'boolean'
        ? node.const === true
        : type === 'array'
          ? (numberOf(node.minItems) ?? 0) > 0
          : true;
  if (parentRequires && !nullable && nonEmpty) result.required = true;
  for (const key of Object.keys(result) as (keyof FieldConstraints)[]) {
    if (result[key] === undefined) delete result[key];
  }
  return result;
}

/** 按点连接的路径找字段：对象走 properties，数组走 items（下标是数字） */
function find(root: JsonSchema, path: string): FieldConstraints {
  let { node, nullable } = unwrap(root, root);
  let required = true;
  for (const segment of path.split('.')) {
    if (!node) return NONE;
    if (node.type === 'array') {
      ({ node, nullable } = unwrap(root, node.items as JsonSchema | undefined));
      required = true;
      continue;
    }
    const properties = node.properties as Record<string, JsonSchema> | undefined;
    required = ((node.required as string[] | undefined) ?? []).includes(segment);
    ({ node, nullable } = unwrap(root, properties?.[segment]));
  }
  return node ? constraintsOf(node, nullable, required) : NONE;
}

/**
 * 按 schema 创建 路径 → 约束 的查询函数；JSON Schema 在第一次查询时才转换，结果按路径缓存。
 * 没有 schema 时总是返回空约束
 */
export function createConstraints(
  schema: $ZodType | undefined,
): (path: string) => FieldConstraints {
  let root: JsonSchema | undefined | null = null;
  const cache = new Map<string, FieldConstraints>();
  return (path) => {
    if (root === null) root = schema && toJsonSchema(schema);
    if (!root) return NONE;
    let found = cache.get(path);
    if (!found) {
      found = find(root, path);
      cache.set(path, found);
    }
    return found;
  };
}

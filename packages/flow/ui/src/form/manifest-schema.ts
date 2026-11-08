/**
 * 字段清单 → 组件库表单用的 zod schema：类型、范围、选项与控件写进 schema 与 meta，SchemaForm、SchemaView 照它生成字段。
 *
 * 必填、显示、能不能改不在这里：它们随节点与值变，由 {@link manifestAccess} 按模型包的 fieldStates 合算（与后端同一套规则），
 * 交给 useForm 的 access。所以每个字段在 schema 里都可以空着，范围、格式这些也只查有值的（同模型包的 checkFieldValue）。
 *
 * 值在表单里的形状见 form-values.ts：日期、日期时间是 ISO 文字，选项的值是文字，decimal 是 Decimal。
 */
import { decimalSchema } from '@zerodep-dev/vue-tsx-pro-ui';
import type { FieldDefinition, FormManifest } from '@zerodep-dev/flow-ts-model';
import Decimal from 'decimal.js';
import { z } from 'zod';

/** 文字长度、格式：空着不查（必填另算）；问题用 zod 的标准错误码，提示跟着使用方配置的 zod 语言 */
function textSchema(field: FieldDefinition) {
  const { minLength, maxLength, pattern } = field;
  const regex = pattern === undefined ? undefined : new RegExp(`^(?:${pattern})$`, 'u');
  const schema = maxLength === undefined ? z.string() : z.string().max(maxLength);
  return schema.check((ctx) => {
    const value = ctx.value;
    if (value === '') return;
    if (minLength !== undefined && value.length < minLength)
      ctx.issues.push({
        code: 'too_small',
        origin: 'string',
        minimum: minLength,
        inclusive: true,
        input: value,
      });
    if (regex && !regex.test(value))
      ctx.issues.push({ code: 'invalid_format', format: 'regex', pattern: pattern!, input: value });
  });
}

/** 一个字段的 schema（不含 meta） */
function valueSchema(field: FieldDefinition): z.ZodType {
  switch (field.type) {
    case 'text':
      return textSchema(field);
    case 'number': {
      let schema = field.integer ? z.number().int() : z.number();
      if (typeof field.min === 'number') schema = schema.min(field.min);
      if (typeof field.max === 'number') schema = schema.max(field.max);
      return schema;
    }
    case 'decimal':
      return decimalSchema({
        ...(field.min !== undefined && { min: String(field.min) }),
        ...(field.max !== undefined && { max: String(field.max) }),
        ...(field.scale !== undefined && { scale: field.scale }),
        type: Decimal,
      });
    case 'boolean':
      return z.boolean();
    case 'date':
      return z.iso.date();
    case 'datetime':
      return z.iso.datetime({ local: true });
    case 'select': {
      // 组件库的选项值是文字：数字选项在表单里写成文字，提交时换回（form-values.ts）
      const one = Array.isArray(field.options)
        ? z.enum(field.options.map((option) => String(option.value)) as [string, ...string[]])
        : z.string();
      return field.multiple ? z.array(one) : one;
    }
    case 'people':
      return z.array(z.object({ id: z.union([z.string(), z.number()]), type: z.string() }).loose());
    case 'file':
      return z.array(z.object({ id: z.string(), name: z.string() }).loose());
    case 'list': {
      let schema = z.array(manifestSchema(field.fields ?? {}));
      if (field.minItems !== undefined) schema = schema.min(field.minItems);
      if (field.maxItems !== undefined) schema = schema.max(field.maxItems);
      return schema;
    }
    default:
      // 接入方注册的字段类型：值的形状由注册的实现定，表单这边不约束
      return z.unknown();
  }
}

/** 字段的 meta：标签、说明、控件、选项 */
function metaOf(field: FieldDefinition): Record<string, unknown> {
  const meta: Record<string, unknown> = { title: field.label };
  if (field.description) meta.description = field.description;
  if (field.type === 'select') {
    // Array.isArray 收窄不了只读数组，按有没有 source 分
    if (field.options && 'source' in field.options) meta.source = field.options.source;
    else if (field.options)
      meta.options = Object.fromEntries(
        field.options.map((option) => [String(option.value), option.label]),
      );
    if (field.multiple) meta.control = 'multiselect';
  }
  if (field.type === 'people') meta.control = 'people';
  if (field.type === 'file') meta.control = 'file';
  if (field.type === 'list') meta.control = 'table';
  return meta;
}

/** 字段清单 → zod schema：交给 useForm（useFlowForm 已经接好）、SchemaForm、SchemaView */
export function manifestSchema(manifest: FormManifest): z.ZodObject {
  return z.object(
    Object.fromEntries(
      Object.entries(manifest).map(([name, field]) => [
        name,
        valueSchema(field).nullable().optional().meta(metaOf(field)),
      ]),
    ),
  );
}

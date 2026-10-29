/**
 * 内置值类型的 zod schema：Decimal（金额、精确小数）与 bigint（超过 2^53 的整数、ID）；
 * 常见的格式：手机号（phoneSchema）、居民身份证号（idCardSchema，校验出生日期与校验码）。
 *
 *   const schema = z.object({
 *     price: decimalSchema({ min: 0, scale: 2 }),         // Decimal，最小 0，最多两位小数
 *     stock: bigintSchema({ min: 0n }),
 *   });
 *   // useForm 从 schema 推出约束：NumberField 拿到 min 0、step 0.01，不用再写一遍
 *
 * zod 自带的 z.bigint()、自定义类型转 JSON Schema 时表达不了，表单推不出字段约束；
 * 这里用 .meta() 把 minimum、maximum、multipleOf 写进去（form-constraints 读 JSON Schema）。
 * 校验用 zod 的标准错误码（too_small、too_big、not_multiple_of），提示跟着使用方配置的 zod 语言走。
 */
import type Decimal from 'decimal.js';
import { z } from 'zod';
import { isDecimal, toNumber, type NumericValue } from '../utils/data/numeric';

/** decimalSchema 的选项；边界与步长可以是数字、bigint、Decimal 或十进制文本（'0.01'） */
export interface DecimalSchemaOptions {
  /** 最小值（含） */
  min?: NumericValue | string;
  /** 最大值（含） */
  max?: NumericValue | string;
  /** 步长：值要是 step 的整数倍（从 0 算起） */
  step?: NumericValue | string;
  /** 最多几位小数（金额通常是 2） */
  scale?: number;
}

/** Decimal 的 schema：类型、范围、步长与小数位数 */
export function decimalSchema({ min, max, step, scale }: DecimalSchemaOptions = {}) {
  // 小数位数等价于步长 10^-scale；两个都给时都要满足
  const steps = [step, scale == null ? undefined : `1e-${scale}`].filter((item) => item != null);
  return z
    .custom<Decimal>(isDecimal)
    .check((ctx) => {
      const value = ctx.value;
      // 边界按值自己的构造函数转成 Decimal：使用方可能用 Decimal.clone 配了精度
      const Ctor = value.constructor as typeof Decimal;
      const of = (bound: NumericValue | string) =>
        isDecimal(bound) ? bound : new Ctor(String(bound));
      if (min != null && value.lt(of(min))) {
        ctx.issues.push({
          code: 'too_small',
          origin: 'number',
          minimum: toNumber(of(min)),
          inclusive: true,
          input: value,
        });
      }
      if (max != null && value.gt(of(max))) {
        ctx.issues.push({
          code: 'too_big',
          origin: 'number',
          maximum: toNumber(of(max)),
          inclusive: true,
          input: value,
        });
      }
      for (const item of steps) {
        const divisor = of(item);
        if (!value.mod(divisor).isZero()) {
          ctx.issues.push({
            code: 'not_multiple_of',
            origin: 'number',
            divisor: toNumber(divisor),
            // zod 的类型要求这里是 number（只用来拼提示文字）；判断本身已经按十进制精确做过了
            input: toNumber(value),
          });
        }
      }
    })
    .meta({
      type: 'number',
      ...(min != null && { minimum: Number(String(min)) }),
      ...(max != null && { maximum: Number(String(max)) }),
      ...(steps.length > 0 && {
        multipleOf: Math.min(...steps.map((item) => Number(String(item)))),
      }),
    });
}

/** bigintSchema 的选项 */
export interface BigIntSchemaOptions {
  /** 最小值（含） */
  min?: bigint;
  /** 最大值（含） */
  max?: bigint;
}

/** bigint 的 schema：范围由 zod 精确校验，约束（转成 number，只给控件用）写进 JSON Schema */
export function bigintSchema({ min, max }: BigIntSchemaOptions = {}) {
  let schema = z.bigint();
  if (min != null) schema = schema.min(min);
  if (max != null) schema = schema.max(max);
  return schema.meta({
    type: 'integer',
    ...(min != null && { minimum: Number(min) }),
    ...(max != null && { maximum: Number(max) }),
  });
}

/** phoneSchema、idCardSchema 的选项 */
export interface PatternSchemaOptions {
  /** 不符合时的提示；不写时用 zod 的“格式不对”（跟着语言包） */
  message?: string;
}

/** 中国大陆手机号：1 开头、第二位 3–9、共 11 位数字（配 TextField 的 phoneFormat，值里没有空格） */
export function phoneSchema({ message }: PatternSchemaOptions = {}) {
  return z.string().regex(/^1[3-9]\d{9}$/, message === undefined ? undefined : { message });
}

const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CHECK_CODES = '10X98765432';

/**
 * 居民身份证号（GB 11643）是否有效：18 位，出生日期是真实的日期，最后一位校验码对得上（配 idCardFormat）
 */
export function isValidIdCard(value: string): boolean {
  if (!/^\d{17}[\dX]$/.test(value)) return false;
  const [year, month, day] = [value.slice(6, 10), value.slice(10, 12), value.slice(12, 14)].map(
    Number,
  ) as [number, number, number];
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day ||
    year < 1900
  ) {
    return false;
  }
  const sum = ID_WEIGHTS.reduce((total, weight, index) => total + weight * Number(value[index]), 0);
  return ID_CHECK_CODES[sum % 11] === value[17];
}

/** 居民身份证号的 schema：长度、出生日期与校验码（isValidIdCard） */
export function idCardSchema({ message }: PatternSchemaOptions = {}) {
  return z.string().refine(isValidIdCard, message === undefined ? undefined : { message });
}

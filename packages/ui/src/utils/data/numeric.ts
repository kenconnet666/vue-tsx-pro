/**
 * 内置支持的数值类型：number、bigint 与 decimal.js 的 Decimal（金额、精确运算）。
 * 组件的数值属性都接受它们（NumericValue），排序、格式化、表单提交不丢精度。
 *
 *   compareNumeric(new Decimal('1.5'), 1.25)   // 1：不同类型也按大小比
 *   numericText(new Decimal('1e21'))           // '1000000000000000000000'：提交给服务端的十进制文本
 *
 * 这里不在运行时导入 decimal.js：按实例自己的构造函数识别与运算（使用方可能用 Decimal.clone 配了精度），
 * 没用到 Decimal 的应用不会因此打包它。
 */
import type Decimal from 'decimal.js';
import { snapToStep } from './number';

/** 组件接受的数值 */
export type NumericValue = number | bigint | Decimal;

type DecimalConstructor = typeof Decimal;

/** 是不是 decimal.js 的 Decimal（含 Decimal.clone 出来的构造函数的实例） */
export function isDecimal(value: unknown): value is Decimal {
  if (typeof value !== 'object' || value === null) return false;
  const constructor = (value as { constructor?: Partial<DecimalConstructor> }).constructor;
  return typeof constructor?.isDecimal === 'function' && constructor.isDecimal(value);
}

/** 能读成数字的文字：接口常把金额给成十进制字符串（'19.90'）；空白、Infinity、不是数字的都不算 */
export function isNumericText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
}

/** 是不是组件接受的数值（NaN 也算 number，由使用方决定怎么处理） */
export function isNumeric(value: unknown): value is NumericValue {
  return typeof value === 'number' || typeof value === 'bigint' || isDecimal(value);
}

/** 转成 number：只给需要浮点数的地方用（动画的中间帧、图表坐标、aria-valuenow），会丢精度 */
export function toNumber(value: NumericValue): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return value.toNumber();
}

/** 十进制文本，不用科学计数法：表单提交、复制给服务端；NaN、Infinity 原样 */
export function numericText(value: NumericValue): string {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value);
    // 1e21 以上、1e-6 以下 String() 会写成科学计数法；toLocaleString 不带分组时给出完整的十进制
    const plain = value === 0 || (Math.abs(value) < 1e21 && Math.abs(value) >= 1e-6);
    return plain
      ? String(value)
      : value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
  }
  return value.isFinite() ? value.toFixed() : value.toString();
}

/**
 * 十进制文本的小数点左移 places 位（除以 10 的 places 次方；负数右移），按文字移位、不经过浮点数：
 * `shiftDecimal('155353.2', 4)` → `'15.53532'`。不是普通十进制写法的文本（NaN、科学计数法）原样返回
 */
export function shiftDecimal(text: string, places: number): string {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!match || places === 0 || !/\d/.test(text)) return text;
  const [, sign, whole = '', fraction = ''] = match;
  const digits = whole + fraction;
  const point = whole.length - places;
  const padded = point <= 0 ? '0'.repeat(1 - point) + digits : digits.padEnd(point, '0');
  const at = Math.max(point, 1);
  const integer = padded.slice(0, at).replace(/^0+(?=\d)/, '');
  const decimal = padded.slice(at).replace(/0+$/, '');
  return `${sign}${integer}${decimal ? `.${decimal}` : ''}`;
}

/** 用 Decimal 的构造函数（从 a 或 b 里找）把两个值都转成 Decimal 比较 */
function compareWithDecimal(a: NumericValue, b: NumericValue, Ctor: DecimalConstructor): number {
  const left = isDecimal(a) ? a : new Ctor(numericText(a));
  return left.cmp(isDecimal(b) ? b : new Ctor(numericText(b)));
}

/**
 * 按大小比较两个数值，不同类型混着也行：返回负数、0 或正数（同 Array.prototype.sort 的约定）。
 * 有 Decimal 时按十进制精确比较；number 与 bigint 之间不经过浮点数（大整数不丢精度）；NaN 排在最后
 */
export function compareNumeric(a: NumericValue, b: NumericValue): number {
  if (typeof a === 'number' && Number.isNaN(a))
    return typeof b === 'number' && Number.isNaN(b) ? 0 : 1;
  if (typeof b === 'number' && Number.isNaN(b)) return -1;
  if (isDecimal(a)) return compareWithDecimal(a, b, a.constructor as DecimalConstructor);
  if (isDecimal(b)) return compareWithDecimal(a, b, b.constructor as DecimalConstructor);
  // number、bigint 之间：JavaScript 的关系运算符对混合类型按数学值比较，不丢精度
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 两个数值是否相等（1 与 1n、Decimal('1.0') 与 1 都算相等） */
export const sameNumeric = (a: NumericValue, b: NumericValue) => compareNumeric(a, b) === 0;

/** 数值写回成什么类型：number、bigint，或某个 Decimal 构造函数（使用方 Decimal.clone 配过精度的也行） */
export type NumericKind = 'number' | 'bigint' | DecimalConstructor;

/** 值的类型：Decimal 取它自己的构造函数 */
export function numericKind(value: NumericValue): NumericKind {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'bigint') return 'bigint';
  return value.constructor as DecimalConstructor;
}

/** 十进制文本（'-12.5'）→ 整数，四舍五入（远离 0） */
function roundedBigInt(text: string): bigint {
  const [whole = '0', fraction = ''] = text.replace(/^[+-]/, '').split('.');
  const negative = text.startsWith('-');
  let result = BigInt(whole || '0');
  if (Number(fraction[0] ?? 0) >= 5) result += 1n;
  return negative ? -result : result;
}

/**
 * 转成指定类型；value 也可以是十进制文本（'-12.5'，输入框解析出来的）。
 * bigint 四舍五入到整数，Decimal 按十进制文本转（不经过浮点数）
 */
export function toNumericKind(value: NumericValue | string, kind: NumericKind): NumericValue {
  const text = () => (typeof value === 'string' ? value : numericText(value));
  if (kind === 'number') return typeof value === 'string' ? Number(value) : toNumber(value);
  if (kind === 'bigint') return typeof value === 'bigint' ? value : roundedBigInt(text());
  return isDecimal(value) && value.constructor === kind ? value : new kind(text());
}

/** 按 kind 精确相加：Decimal 用它的构造函数算，bigint 整数相加，number 浮点相加（再由 snapNumeric 去掉误差） */
export function addNumeric(value: NumericValue, delta: NumericValue, kind: NumericKind) {
  const left = toNumericKind(value, kind);
  const right = toNumericKind(delta, kind);
  if (typeof left === 'number') return left + (right as number);
  if (typeof left === 'bigint') return left + (right as bigint);
  return (left as Decimal).plus(right as Decimal);
}

/** value 的 times 倍（times 是整数，如 -1、10），按 kind 精确运算 */
export function multiplyNumeric(value: NumericValue, times: number, kind: NumericKind) {
  const typed = toNumericKind(value, kind);
  if (typeof typed === 'number') return typed * times;
  if (typeof typed === 'bigint') return typed * BigInt(times);
  return (typed as Decimal).times(times);
}

/**
 * 夹在 [min, max] 之间并对齐到 min + n × step（没有 min 时对齐到 0 + n × step），按 kind 精确运算：
 * number 走 snapToStep（按小数位取整去掉浮点误差），bigint 的步长至少为 1，Decimal 用值自己的构造函数
 */
export function snapNumeric(
  value: NumericValue,
  step: NumericValue,
  min: NumericValue | undefined,
  max: NumericValue | undefined,
  kind: NumericKind,
): NumericValue {
  if (kind === 'number') {
    return snapToStep(
      toNumber(value),
      toNumber(step),
      min == null ? -Infinity : toNumber(min),
      max == null ? Infinity : toNumber(max),
    );
  }
  const at = (item: NumericValue) => toNumericKind(item, kind);
  let snapped: NumericValue;
  if (kind === 'bigint') {
    const size = (at(step) as bigint) > 0n ? (at(step) as bigint) : 1n;
    const base = min == null ? 0n : (at(min) as bigint);
    const offset = (at(value) as bigint) - base;
    // 整数除法四舍五入（远离 0）
    const half = offset < 0n ? -size : size;
    snapped = base + ((2n * offset + half) / (2n * size)) * size;
  } else {
    const base = (min == null ? new kind(0) : at(min)) as Decimal;
    const size = at(step) as Decimal;
    snapped = base.plus((at(value) as Decimal).minus(base).div(size).round().times(size));
  }
  if (min != null && compareNumeric(snapped, min) < 0) snapped = at(min);
  if (max != null && compareNumeric(snapped, max) > 0) snapped = at(max);
  return snapped;
}

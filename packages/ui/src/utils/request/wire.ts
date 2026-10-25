/**
 * 线上的 typed JSON（与 query 库的 @zerodep-dev/wire、Java 的 org.dpdns.zerodep.wire 同一套写法）：bigint、Decimal、
 * 日期、时间、字节等 JSON 不能原样承载的值写成文字，根对象上的 `$types` 记下它们的位置（路径 → 种类），对方据此还原。
 * createHttpClient 默认就用它：请求体经 toWire 发出，带 `$types` 的响应经 fromWire 还原，地址栏参数经 wireText 写成文字。
 *
 *   toWire({ id: 9007199254740993n, amount: new Decimal('12.50'), on: new CalendarDate(2024, 1, 31) })
 *   // { id: '9007199254740993', amount: '12.5', on: '2024-01-31', $types: { id: 'bigint', amount: 'decimal', on: 'date' } }
 *
 * 种类与文字：bigint 是十进制整数，decimal 不用科学计数法，double 只有 NaN / ±Infinity 写成文字，date 'YYYY-MM-DD'、
 * time 'HH:mm:ss'、timestamp 'YYYY-MM-DDTHH:mm:ss[.fff]'、timestamptz 换算成 UTC 带 Z，bytes 是标准 base64。
 * 路径从根开始用点连接属性名，数组不占一段（`rows.amount` 是每一行的 amount），属性名里的 ~ 与 . 写成 ~0、~1。
 *
 * 还原的默认值跟组件的约定走：bigint 还原成 bigint；decimal 在给了 Decimal 构造函数时还原成 Decimal，否则留作十进制文字
 * （DataTable 的数字列、NumberField 都认）；日期与时间留作 ISO 文字（组件对外的值就是它），dates: 'objects' 时还原成
 * CalendarDate、Time、CalendarDateTime、ZonedDateTime。这里不在运行时导入 decimal.js（同 numeric.ts）。
 */
import {
  CalendarDate,
  CalendarDateTime,
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
  parseDateTime,
  parseTime,
  Time,
  ZonedDateTime,
} from '@internationalized/date';
import type Decimal from 'decimal.js';
import { isDecimal, numericText } from '../data/numeric';

/** 线上要还原的值的种类 */
export type WireType =
  'bigint' | 'decimal' | 'double' | 'date' | 'time' | 'timestamp' | 'timestamptz' | 'bytes';

/** 根对象上的类型表：路径 → 种类 */
export type WireTypes = Record<string, WireType>;

/** 能写成线上文字的单个值（地址栏参数、表头筛选） */
export type WireScalar =
  | string
  | number
  | boolean
  | bigint
  | Decimal
  | CalendarDate
  | CalendarDateTime
  | ZonedDateTime
  | Time
  | Date
  | null
  | undefined;

/** fromWire 怎样还原 */
export interface WireReviveOptions {
  /** 还原 decimal 用的构造函数（decimal.js 的 Decimal 或它 clone 出来的）；不给时 decimal 留作十进制文字 */
  decimal?: new (text: string) => Decimal;
  /** 日期与时间：'iso' 留作 ISO 文字（默认），'objects' 还原成 CalendarDate、Time、CalendarDateTime、ZonedDateTime */
  dates?: 'iso' | 'objects';
  /** 'objects' 时 timestamptz 还原到哪个时区，默认浏览器的时区 */
  timeZone?: string;
}

const TYPES = '$types';
const VALUE = '$value';

/** 值要还原成哪一种；JSON 能原样承载的值为 undefined */
function wireTypeOf(value: unknown): WireType | undefined {
  if (typeof value === 'bigint') return 'bigint';
  if (typeof value === 'number') return Number.isFinite(value) ? undefined : 'double';
  if (typeof value !== 'object' || value === null) return undefined;
  if (isDecimal(value)) return 'decimal';
  if (value instanceof CalendarDateTime) return 'timestamp';
  if (value instanceof CalendarDate) return 'date';
  if (value instanceof Time) return 'time';
  if (value instanceof ZonedDateTime || value instanceof Date) return 'timestamptz';
  if (value instanceof Uint8Array) return 'bytes';
  return undefined;
}

/** 要还原的值写成的文字 */
function specialText(type: WireType, value: unknown): string {
  switch (type) {
    case 'decimal':
      return numericText(value as Decimal);
    case 'timestamptz':
      return utcText(
        value instanceof Date ? value.getTime() : (value as ZonedDateTime).toDate().getTime(),
      );
    case 'bytes':
      return encodeBase64(value as Uint8Array);
    default:
      return String(value);
  }
}

/** 某一时刻的 UTC 写法：总有秒，毫秒去掉末尾的零 */
function utcText(epochMillis: number): string {
  return new Date(epochMillis)
    .toISOString()
    .replace(/\.(\d{3})Z$/, (_, ms: string) => (ms === '000' ? 'Z' : `.${ms.replace(/0+$/, '')}Z`));
}

/**
 * 一个值写成线上的文字：地址栏参数、表头筛选都用它。Decimal 不用科学计数法，日期与时间是 ISO 写法，
 * 带时区的时刻换算成 UTC；null、undefined 是空字符串
 */
export function wireText(value: WireScalar): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Object.is(value, -0) ? '0' : String(value);
  if (typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  const type = wireTypeOf(value);
  if (!type) throw new TypeError(`wireText：${String(value)} 不是单个值`);
  return specialText(type, value);
}

/**
 * 把值写成线上的 JSON：要还原的值写成文字，根对象上加 `$types`；没有这样的值时就是普通 JSON。
 * 对象取自身可枚举的属性（undefined 与函数跳过），有 toJSON 的先调用它；同一路径上既有文字又有 Decimal 这类值时报错
 */
export function toWire(value: unknown): unknown {
  const found = new Map<string, WireType | 'text'>();
  const json = encode(value, '', found, new Set());
  const types: WireTypes = {};
  for (const [path, type] of found) if (type !== 'text') types[path] = type;
  if (Object.keys(types).length === 0) return json;
  if (isRecord(json)) return { ...json, [TYPES]: types };
  const wrapped: WireTypes = {};
  for (const [path, type] of Object.entries(types))
    wrapped[path === '' ? VALUE : `${VALUE}.${path}`] = type;
  return { [VALUE]: json, [TYPES]: wrapped };
}

function encode(
  value: unknown,
  path: string,
  found: Map<string, WireType | 'text'>,
  seen: Set<object>,
): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    note(found, path, 'text');
    return value;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return Object.is(value, -0) ? 0 : value;
  if (typeof value === 'function' || typeof value === 'symbol') return null;
  const type = wireTypeOf(value);
  if (type) {
    note(found, path, type);
    return specialText(type, value);
  }
  const object = value as object;
  if (seen.has(object)) throw new TypeError(`toWire：${path || '根对象'}引用了自己`);
  seen.add(object);
  try {
    if (Array.isArray(object) || object instanceof Set)
      return [...object].map((item: unknown) => encode(item, path, found, seen));
    if (typeof (object as { toJSON?: unknown }).toJSON === 'function')
      return encode((object as { toJSON(): unknown }).toJSON(), path, found, seen);
    const entries =
      object instanceof Map
        ? [...(object as Map<unknown, unknown>)].map(([k, v]) => [String(k), v] as const)
        : Object.entries(object);
    const out: Record<string, unknown> = {};
    for (const [key, item] of entries) {
      if (item === undefined || typeof item === 'function') continue;
      out[key] = encode(item, path === '' ? escape(key) : `${path}.${escape(key)}`, found, seen);
    }
    return out;
  } finally {
    seen.delete(object);
  }
}

/** 记下路径上的值的种类；同一路径出现两种时报错（对方无从还原） */
function note(found: Map<string, WireType | 'text'>, path: string, type: WireType | 'text') {
  const known = found.get(path);
  if (known !== undefined && known !== type)
    throw new TypeError(
      `toWire：${path || '根'}上的值既有 ${known} 又有 ${type}，一个路径只能是一种值`,
    );
  found.set(path, type);
}

/**
 * 读线上的 JSON：按根上的 `$types` 还原（见文件开头的默认值），去掉 `$types`，`{ $value, $types }` 拆成里面的值；
 * 没有 `$types` 时原样返回。就地改写传入的对象（通常刚由 JSON.parse 得到）
 */
export function fromWire<T = unknown>(json: unknown, options: WireReviveOptions = {}): T {
  if (!isRecord(json) || !Object.hasOwn(json, TYPES)) return json as T;
  const types = json[TYPES];
  if (!isRecord(types)) throw new TypeError('fromWire：$types 要是 路径 → 种类 的对象');
  delete json[TYPES];
  for (const [path, type] of Object.entries(types)) {
    const steps = path.split('.').map(unescape);
    try {
      revive(json, steps[0]!, steps.slice(1), type as WireType, options);
    } catch (error) {
      throw new TypeError(`fromWire：${path}：${(error as Error).message}`, { cause: error });
    }
  }
  const keys = Object.keys(json);
  return (keys.length === 1 && keys[0] === VALUE ? json[VALUE] : json) as T;
}

function revive(
  holder: Record<string | number, unknown>,
  key: string | number,
  rest: readonly string[],
  type: WireType,
  options: WireReviveOptions,
) {
  const value = holder[key];
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++)
      revive(value as unknown as Record<number, unknown>, i, rest, type, options);
    return;
  }
  if (rest.length === 0) {
    if (typeof value === 'string') holder[key] = parseText(type, value, options);
    return;
  }
  if (isRecord(value)) revive(value, rest[0]!, rest.slice(1), type, options);
}

/** 按种类读一段文字；留作文字的种类原样返回 */
function parseText(type: WireType, text: string, options: WireReviveOptions): unknown {
  const objects = options.dates === 'objects';
  switch (type) {
    case 'bigint':
      if (!/^[+-]?\d+$/.test(text)) throw new TypeError(`${JSON.stringify(text)} 不是整数`);
      return BigInt(text);
    case 'decimal':
      return options.decimal ? new options.decimal(text) : text;
    case 'double':
      return Number(text);
    case 'bytes':
      return decodeBase64(text);
    case 'date':
      return objects ? parseDate(text) : text;
    case 'time':
      return objects ? parseTime(text) : text;
    case 'timestamp':
      return objects ? parseDateTime(text.replace(' ', 'T')) : text;
    case 'timestamptz':
      return objects ? parseAbsolute(text, options.timeZone ?? getLocalTimeZone()) : text;
  }
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** 标准 base64（带补齐的 =），与 Java 的 Base64.getEncoder() 一致 */
function encodeBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i]!, bytes[i + 1], bytes[i + 2]];
    out += BASE64[a >> 2]! + BASE64[((a & 3) << 4) | ((b ?? 0) >> 4)]!;
    out +=
      b === undefined
        ? '=='
        : BASE64[((b & 15) << 2) | ((c ?? 0) >> 6)]! + (c === undefined ? '=' : BASE64[c & 63]!);
  }
  return out;
}

/** 读标准 base64 */
function decodeBase64(text: string): Uint8Array {
  if (text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text))
    throw new TypeError(`${JSON.stringify(text.slice(0, 40))} 不是 base64`);
  const pad = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  const out = new Uint8Array((text.length / 4) * 3 - pad);
  let at = 0;
  for (let i = 0; i < text.length; i += 4) {
    let n = 0;
    for (let k = 0; k < 4; k++) n = (n << 6) | Math.max(0, BASE64.indexOf(text[i + k]!));
    for (const byte of [n >> 16, (n >> 8) & 255, n & 255]) if (at < out.length) out[at++] = byte;
  }
  return out;
}

/** 属性名写进路径：~ → ~0，. → ~1（同 JSON Pointer） */
const escape = (key: string) => key.replaceAll('~', '~0').replaceAll('.', '~1');

/** escape 的反向 */
const unescape = (step: string) => step.replaceAll('~1', '.').replaceAll('~0', '~');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

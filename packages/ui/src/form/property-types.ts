/**
 * 属性面板（PropertyGrid）的字段描述与值的工具：一个字段是名字加类型，类型说明值长什么样（数、开关、文字、枚举、向量、颜色、
 * 列表、对象、几种形状之一、原样的 JSON），面板按它画编辑器。描述是普通数据，能从别处（引擎的组件、着色器的参数、
 * 插件的配置）生成；使用方自己的种类（资源、实体、旋转）写成 X，编辑器经 PropertyGrid 的 editors 给。
 *
 *   const fields: PropertyField[] = [
 *     { name: 'intensity', type: { kind: 'number', min: 0, step: 0.1 }, optional: true, default: 1 },
 *     { name: 'color', type: { kind: 'color', space: 'linear' } },
 *     { name: 'shadow', type: { kind: 'object', fields: shadowFields }, optional: true },
 *   ];
 *
 * 修改是“路径加值”：PropertyGrid 的 onSet 给出相对它的值的路径和新值，新值可以是按原来的值算的函数（多选时每个对象各算各的：
 * 只改了向量的一个分量、只换了颜色不动 alpha）。setPropertyPath 把一次修改落到一份值上。
 */

/** 多选时几个对象不一样的值：传给 PropertyGrid 的值里这样标，编辑器显示“多个值” */
export const PROPERTY_MIXED: unique symbol = Symbol('property-mixed');

/** 值里一处的路径（对象的键、列表的下标） */
export type PropertyPath = readonly (string | number)[];

/** 按原来的值算新值（多选时每个对象各算各的） */
export type PropertyUpdate = (current: unknown) => unknown;

/** 使用方自己的种类：只要有 kind */
export interface PropertyKind {
  /** 种类的名字，不和内置的重名 */
  readonly kind: string;
}

/** 值的类型：内置的种类，加上使用方自己的 X */
export type PropertyType<X extends PropertyKind = never> =
  | {
      readonly kind: 'number';
      /** 最小值 */
      readonly min?: number;
      /** 最大值 */
      readonly max?: number;
      /** 加减按钮、方向键一步，默认 0.1（整数是 1） */
      readonly step?: number;
      /** 单位，写在输入框后面 */
      readonly unit?: string;
      /** 只能是整数 */
      readonly integer?: boolean;
    }
  | { readonly kind: 'bool' }
  | { readonly kind: 'string' }
  | {
      readonly kind: 'enum';
      /** 可选的值 */
      readonly values: readonly string[];
      /** 选项显示的文字（按值），没写的显示值本身 */
      readonly labels?: Readonly<Record<string, string>>;
    }
  | {
      readonly kind: 'vector';
      /** 几个数 */
      readonly size: number;
      /** 单位 */
      readonly unit?: string;
      /** 一步，默认 0.1 */
      readonly step?: number;
    }
  | {
      readonly kind: 'color';
      /** 有 alpha：值是 4 个数，第 4 个另有输入框 */
      readonly alpha?: boolean;
      /** 值里存的是哪种（取色器是 sRGB 的），默认 srgb；渲染用的线性颜色写 linear */
      readonly space?: 'srgb' | 'linear';
    }
  | PropertyListType<X>
  | PropertyObjectType<X>
  | PropertyUnionType<X>
  /** 还没有描述的值：按 JSON 文本改 */
  | { readonly kind: 'json' }
  | X;

/** 列表 */
export interface PropertyListType<X extends PropertyKind = never> {
  /** 种类 */
  readonly kind: 'list';
  /** 每一项的类型 */
  readonly item: PropertyType<X>;
  /** 项可以是 null（显示“默认”） */
  readonly nullableItems?: boolean;
}

/** 对象：一组字段 */
export interface PropertyObjectType<X extends PropertyKind = never> {
  /** 种类 */
  readonly kind: 'object';
  /** 对象的字段 */
  readonly fields: readonly PropertyField<X>[];
}

/** 几种形状之一：tag 那个字段的值说是哪种 */
export interface PropertyUnionType<X extends PropertyKind = never> {
  /** 种类 */
  readonly kind: 'union';
  /** 哪个字段说明是哪种 */
  readonly tag: string;
  /** 每种自己的字段（按 tag 的值） */
  readonly variants: Readonly<Record<string, readonly PropertyField<X>[]>>;
  /** 每种都有的字段 */
  readonly common?: readonly PropertyField<X>[];
}

/** 一个字段 */
export interface PropertyField<X extends PropertyKind = never> {
  /** 在对象里的键 */
  readonly name: string;
  /** 值的类型 */
  readonly type: PropertyType<X>;
  /** 可以不写；不写时用 default（没有 default 的就是“没设”） */
  readonly optional?: boolean;
  /** 可以是 null（没指定） */
  readonly nullable?: boolean;
  /** 不写时的值 */
  readonly default?: unknown;
  /** 显示的名字，默认是 name */
  readonly label?: string;
  /** 说明：悬停在名字上显示 */
  readonly description?: string;
}

/** 值里有没有 PROPERTY_MIXED（多选时这一处有不一样的） */
export function hasMixed(value: unknown): boolean {
  if (value === PROPERTY_MIXED) return true;
  if (value === null || typeof value !== 'object') return false;
  return Object.values(value).some(hasMixed);
}

/**
 * 新加一个值（列表里加一项、换了几种之一的种类、给可以是 null 的设上值）从什么开始：数是 0（有正的下限时是下限），
 * 向量全 0，颜色白色，对象是必填字段的初值。使用方的种类问 custom，没给时是 null。
 */
export function emptyPropertyValue<X extends PropertyKind>(
  type: PropertyType<X>,
  custom: (type: X) => unknown = () => null,
): unknown {
  const builtin = type as PropertyType;
  switch (builtin.kind) {
    case 'number':
      return builtin.min !== undefined && builtin.min > 0 ? builtin.min : 0;
    case 'bool':
      return false;
    case 'string':
      return '';
    case 'enum':
      return builtin.values[0] ?? '';
    case 'vector':
      return new Array<number>(builtin.size).fill(0);
    case 'color':
      return builtin.alpha ? [1, 1, 1, 1] : [1, 1, 1];
    case 'list':
      return [];
    case 'json':
      return null;
    case 'object':
      return requiredValues((type as PropertyObjectType<X>).fields, custom);
    case 'union': {
      const union = type as PropertyUnionType<X>;
      const [tag, fields] = Object.entries(union.variants)[0] ?? [undefined, []];
      return { [union.tag]: tag, ...requiredValues([...(union.common ?? []), ...fields], custom) };
    }
    default:
      return custom(type as X);
  }
}

function requiredValues<X extends PropertyKind>(
  fields: readonly PropertyField<X>[],
  custom: (type: X) => unknown,
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((field) => !field.optional)
      .map((field) => [field.name, field.nullable ? null : emptyPropertyValue(field.type, custom)]),
  );
}

/**
 * 不改原值，把 root 里 path 上的值设成 value（函数时按原来的值算），返回新的根；value 是 undefined 时删掉这个键。
 * 路径上缺的对象、列表按下一段的键补上。
 */
export function setPropertyPath(
  root: unknown,
  path: PropertyPath,
  /** 新值，或按原来的值算的函数（PropertyUpdate） */
  value: unknown,
): unknown {
  if (path.length === 0)
    return typeof value === 'function' ? (value as PropertyUpdate)(root) : value;
  const [key, ...rest] = path as [string | number, ...(string | number)[]];
  const container =
    root !== null && typeof root === 'object' ? root : typeof key === 'number' ? [] : {};
  const copy = (Array.isArray(container) ? container.slice() : { ...container }) as Record<
    string | number,
    unknown
  >;
  const next = setPropertyPath(copy[key], rest, value);
  if (next === undefined && !Array.isArray(copy)) delete copy[key];
  else copy[key] = next;
  return copy;
}

const toSrgb = (linear: number) =>
  linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
const toLinear = (srgb: number) =>
  srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;

/** 颜色的通道（0 到 1，space 是哪种）→ 取色器的 `#rrggbb` */
export function propertyColorToHex(
  color: readonly unknown[],
  space: 'srgb' | 'linear' = 'srgb',
): string {
  const hex = [0, 1, 2].map((i) => {
    const channel = Math.max(0, Math.min(1, typeof color[i] === 'number' ? color[i] : 0));
    const srgb = space === 'linear' ? toSrgb(channel) : channel;
    return Math.round(srgb * 255)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${hex.join('')}`;
}

/** 取色器的 `#rrggbb` → 颜色的通道（space 是哪种，留五位小数）；alpha 照原来的 */
export function hexToPropertyColor(
  hex: string,
  space: 'srgb' | 'linear' = 'srgb',
  previous: readonly unknown[] = [],
): unknown[] {
  const rgb = [1, 3, 5].map((at) => {
    const srgb = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
    return Math.round((space === 'linear' ? toLinear(srgb) : srgb) * 1e5) / 1e5;
  });
  return previous.length > 3 ? [...rgb, previous[3]] : rgb;
}

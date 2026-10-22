/**
 * 放在地址查询参数里的状态（参考 nuqs 的 useQueryState、VueUse 的 useRouteQuery）：刷新、分享链接、后退回来都还在。
 *
 *   let view = _fromRef(useQueryState('view', 'all'));            ?view=mine
 *   const filters = useQueryStates({ keyword: '', year: 2026 });  ?keyword=泵&year=2025
 *
 * - 返回的 Ref 是这一页的状态本身：改了立即生效，随后合并写进地址（replace，不加历史记录）；
 *   地址变了（后退、点了带参数的链接）跟着变
 * - 等于初始值的键从地址里删掉；地址里的值读不出（格式不对）时用初始值
 * - 读写按初始值的类型（queryCodecs）：数字、布尔、字符串数组、对象（JSON），其余按字符串；初始值是 null 时按字符串，
 *   别的类型（数字、日期）写 codec
 * - 路由适配没有 query、replaceQuery（没配路由、服务端渲染）时就是普通的状态
 */
import { shallowRef, watch, type Ref } from 'vue';
import { sameValue } from '../utils/data/equality';
import { useConfig, type QueryPatch, type QueryValues } from './context';

/** 一个值在地址里的写法 */
export interface QueryCodec<T> {
  /** 从地址读回；读不出时返回 undefined，用初始值 */
  parse(value: string | readonly string[]): T | undefined;
  /** 写进地址的文字；数组写成同名的多个参数 */
  serialize(value: T): string | readonly string[];
}

const first = (value: string | readonly string[]) =>
  typeof value === 'string' ? value : (value[0] ?? '');

/** 常用的写法；useQueryState 按初始值的类型自动选 */
export const queryCodecs = {
  /** 原样 */
  string: {
    parse: first,
    serialize: (value) => value ?? '',
  } satisfies QueryCodec<string | null>,
  /** 数字；空着是 null */
  number: {
    parse(value) {
      const text = first(value);
      if (text === '') return null;
      const number = Number(text);
      return Number.isFinite(number) ? number : undefined;
    },
    serialize: (value) => (value == null ? '' : String(value)),
  } satisfies QueryCodec<number | null>,
  /** true / false */
  boolean: {
    parse: (value) =>
      first(value) === 'true' ? true : first(value) === 'false' ? false : undefined,
    serialize: String,
  } satisfies QueryCodec<boolean>,
  /** 几个固定值之一（页签、类型）：别的值读不出，用初始值 */
  oneOf: <const T extends string>(values: readonly T[]): QueryCodec<T> => ({
    parse: (value) => values.find((item) => item === first(value)),
    serialize: (value) => value,
  }),
  /** 字符串数组：同名的多个参数（?tag=a&tag=b） */
  strings: {
    parse: (value) => (typeof value === 'string' ? [value] : [...value]),
    serialize: (value) => value,
  } satisfies QueryCodec<readonly string[]>,
  /** JSON */
  json: {
    parse(value) {
      try {
        return JSON.parse(first(value)) as unknown;
      } catch {
        return undefined;
      }
    },
    serialize: (value) => JSON.stringify(value),
  } satisfies QueryCodec<unknown>,
};

/** 按初始值的类型选写法 */
function codecOf<T>(initial: T): QueryCodec<T> {
  const codec =
    typeof initial === 'number'
      ? queryCodecs.number
      : typeof initial === 'boolean'
        ? queryCodecs.boolean
        : Array.isArray(initial)
          ? queryCodecs.strings
          : typeof initial === 'object' && initial !== null
            ? queryCodecs.json
            : queryCodecs.string;
  return codec as QueryCodec<unknown> as QueryCodec<T>;
}

/** 各键的写法；没写的按初始值的类型 */
export type QueryCodecs<T> = { [K in keyof T]?: QueryCodec<T[K]> };

/** 一个参数：读回来（没有、读不出时是 initial），写进去（等于 initial 时删掉） */
function param<T>(key: string, initial: T, codec: QueryCodec<T>) {
  return {
    read: (query: QueryValues): T => {
      const text = query[key];
      const parsed = text === undefined ? undefined : codec.parse(text);
      return parsed === undefined ? initial : parsed;
    },
    write: (value: T) => (sameValue(value, initial) ? undefined : codec.serialize(value)),
  };
}

/** 地址里的一个参数 ↔ 一个状态（在 setup 里调用；见文件开头） */
export function useQueryState<T>(
  key: string,
  initial: T,
  codec: QueryCodec<T> = codecOf(initial),
): Ref<T> {
  const { read, write } = param(key, initial, codec);
  return useQuerySync(initial, read, (value) => ({ [key]: write(value) }));
}

/** 地址里的几个参数 ↔ 一个对象，键名就是参数名（在 setup 里调用；见文件开头） */
export function useQueryStates<T extends object>(initial: T, codecs: QueryCodecs<T> = {}): Ref<T> {
  const params = (Object.keys(initial) as (keyof T & string)[]).map((key) => ({
    key,
    ...param(key, initial[key], codecs[key] ?? codecOf(initial[key])),
  }));
  return useQuerySync(
    initial,
    (query) => {
      const value = { ...initial };
      for (const { key, read } of params) value[key] = read(query);
      return value;
    },
    (value) => Object.fromEntries(params.map(({ key, write }) => [key, write(value[key])])),
  );
}

/** 状态以本地为准，与地址双向同步 */
function useQuerySync<T>(
  initial: T,
  read: (query: QueryValues) => T,
  write: (value: T) => QueryPatch,
): Ref<T> {
  const router = useConfig().router;
  const query = router?.query;
  const replaceQuery = router?.replaceQuery;
  const state = shallowRef(query ? read(query()) : initial) as Ref<T>;
  if (!query || !replaceQuery) return state;
  // 地址变了：跟着变（自己写进去的那次读回来相等，不再写）
  watch(
    () => read(query()),
    (value) => {
      if (!sameValue(value, state.value)) state.value = value;
    },
  );
  watch(state, (value) => {
    if (!sameValue(read(query()), value)) replaceQuery(write(value));
  });
  return state;
}

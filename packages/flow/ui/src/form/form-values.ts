/**
 * 单据的值在线上（json-wire 还原后）与在表单里的两种形状，按字段清单互换：
 *
 * | 字段类型 | 线上 | 表单里 |
 * | --- | --- | --- |
 * | date | CalendarDate | 'YYYY-MM-DD'（DatePicker 的值） |
 * | datetime | ZonedDateTime | 不带时区的 'YYYY-MM-DDTHH:mm:ss'，按 timeZone 换算 |
 * | select | 选项的值（文字或数字） | 文字（组件库的选项值是文字） |
 * | file | `{ id, name, size, url? }` | Upload 的文件（上传返回的 `{ id, url }` 记在 response 上） |
 *
 * 其余（文字、数字、Decimal、布尔、人员）两边一样。清单里没有的键原样留着。
 */
import {
  parseDateTime,
  type CalendarDate,
  toCalendarDateTime,
  toTimeZone,
  toZoned,
  type ZonedDateTime,
} from '@internationalized/date';
import { typedValue, type FieldDefinition, type FormManifest } from '@zerodep-dev/flow-ts-model';

/** 文字里写了时区（Z、+08:00、[Asia/Shanghai]）：是线上的时刻，不是表单里的本地写法 */
const hasZone = (text: string) => /(?:[zZ]|[+-]\d{2}:?\d{2})(?:\[[^\]]+\])?$/.test(text);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** 一个值从线上换成表单里的 */
function toFormValue(field: FieldDefinition, value: unknown, timeZone: string): unknown {
  if (value === null || value === undefined) return value;
  switch (field.type) {
    case 'date':
      return typeof value === 'string' ? value : (value as CalendarDate).toString();
    case 'decimal':
      // 引擎存的是文字（'12.50'）：表单里是 Decimal（NumberField 按它精确运算）
      return typeof value === 'string' ? typedValue(field, value) : value;
    case 'datetime': {
      // 存的是带时区的文字（'…Z'）或 ZonedDateTime：换算成这个时区的本地时间；已经是本地写法的原样
      const zoned = typeof value === 'string' && hasZone(value) ? typedValue(field, value) : value;
      if (typeof zoned === 'string') return zoned;
      return toCalendarDateTime(toTimeZone(zoned as ZonedDateTime, timeZone)).toString();
    }
    case 'select':
      // 选项的值是文字或数字
      return Array.isArray(value)
        ? value.map((item: string | number) => String(item))
        : String(value as string | number);
    case 'file':
      return Array.isArray(value)
        ? value.map((file: { id: string; name: string; size?: number; url?: string }) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            status: 'done',
            ...(file.url && { url: file.url }),
            response: { id: file.id, url: file.url },
          }))
        : value;
    case 'list':
      return Array.isArray(value)
        ? value.map((row) => toFormValues(field.fields ?? {}, row, timeZone))
        : value;
    default:
      return value;
  }
}

/** 一个值从表单里换成线上的（强类型的读成 Decimal、CalendarDate、ZonedDateTime） */
function fromFormValue(field: FieldDefinition, value: unknown, timeZone: string): unknown {
  if (value === null || value === undefined || value === '') return value;
  switch (field.type) {
    case 'datetime':
      if (typeof value !== 'string') return value;
      // 带时区的文字直接读；表单里的本地写法按 timeZone 换算
      return hasZone(value) ? typedValue(field, value) : toZoned(parseDateTime(value), timeZone);
    case 'select': {
      const options = Array.isArray(field.options) ? field.options : [];
      const original = (item: unknown) =>
        options.find((option) => String(option.value) === item)?.value ?? item;
      return Array.isArray(value) ? value.map(original) : original(value);
    }
    case 'file':
      return Array.isArray(value)
        ? value.map((file: { id: string; name: string; size?: number; response?: unknown }) => {
            const response = isObject(file.response) ? file.response : {};
            return {
              id: typeof response.id === 'string' ? response.id : file.id,
              name: file.name,
              size: file.size ?? 0,
              ...(typeof response.url === 'string' && { url: response.url }),
            };
          })
        : value;
    case 'list':
      return Array.isArray(value)
        ? value.map((row) => fromFormValues(field.fields ?? {}, row, timeZone))
        : value;
    default:
      return typedValue(field, value);
  }
}

/** 单据的值（线上的形状）→ 表单里的；timeZone 是日期时间按哪个时区显示 */
export function toFormValues(
  manifest: FormManifest,
  values: unknown,
  timeZone: string,
): Record<string, unknown> {
  if (!isObject(values)) return {};
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [
      name,
      manifest[name] ? toFormValue(manifest[name], value, timeZone) : value,
    ]),
  );
}

/** 表单里的值 → 单据的值（线上的形状）：交给引擎的发起、处理 */
export function fromFormValues(
  manifest: FormManifest,
  values: unknown,
  timeZone: string,
): Record<string, unknown> {
  if (!isObject(values)) return {};
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [
      name,
      manifest[name] ? fromFormValue(manifest[name], value, timeZone) : value,
    ]),
  );
}

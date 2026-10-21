/**
 * 按语言解析用户输入的数字（NumberField 用；表格筛选、导入等要读数字文本的地方也可以用）：
 * 认当前语言的小数点与千分位、全角数字与负号。
 *
 *   normalizeNumber('1.234,5', 'de-DE') → '1234.5'
 *   parseNumber('１２．５', 'zh-CN')      → 12.5
 */
import { cachedIntl } from './intl-cache';

/** 当前语言的数字符号：小数点、千分位、负号（按语言缓存：每次输入都要用） */
function numberSymbols(locale: string) {
  return cachedIntl(`number-symbols|${locale}`, () => {
    const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6);
    const find = (type: string) => parts.find((part) => part.type === type)?.value;
    return {
      decimal: find('decimal') ?? '.',
      group: find('group') ?? ',',
      minus: find('minusSign') ?? '-',
    };
  });
}

/**
 * 按语言把用户输入规范成十进制文本（'-1234.5'）：去掉千分位与空白，认全角数字；
 * 空字符串为 null，解析不了时为 undefined。不经过浮点数，大整数、长小数不丢精度
 */
export function normalizeNumber(text: string, locale: string): string | null | undefined {
  const { decimal, group, minus } = numberSymbols(locale);
  let normalized = text
    // 全角数字、全角句点与负号（中文输入法）
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[．｡]/g, '.')
    .replace(/[－−]/g, '-')
    .replace(/[\s  ]/g, '');
  if (!normalized) return null;
  if (group !== decimal) normalized = normalized.split(group).join('');
  if (decimal !== '.') normalized = normalized.split(decimal).join('.');
  normalized = normalized.split(minus).join('-');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return undefined;
  // '.5' → '0.5'、'12.' → '12'：Decimal 与 BigInt 都认的写法
  return normalized.replace(/^(-?)\./, '$10.').replace(/\.$/, '');
}

/** 按语言解析用户输入成 number：解析不了时为 NaN，空字符串为 null */
export function parseNumber(text: string, locale: string): number | null {
  const normalized = normalizeNumber(text, locale);
  if (normalized === undefined) return Number.NaN;
  return normalized === null ? null : Number(normalized);
}

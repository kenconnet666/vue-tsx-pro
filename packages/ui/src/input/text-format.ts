/**
 * 输入时自动分组显示的格式：值是去掉分隔的原文（13800001111），输入框里显示分好组的文字（138 0000 1111），
 * 交给 TextField 的 format。手机号、身份证号、银行卡号有现成的，别的用 createGroupedFormat 写。
 *
 *   <TextField value={_bind(phone)} format={phoneFormat} />          // phone === '13800001111'
 *   <TextField value={_bind(card)} format={createGroupedFormat({ groups: [4, 4, 4, 4, 3] })} />
 *
 * 只按位置分组、过滤字符，不校验内容（号段、校验位）：校验写在表单的 schema 里（phoneSchema、idCardSchema）。
 */

/** TextField 的显示格式 */
export interface TextFormat {
  /** 原文 → 显示的文字 */
  format: (raw: string) => string;
  /** 输入框里的文字 → 原文（去掉分隔、过滤掉不接受的字符、截到最长） */
  parse: (text: string) => string;
  /** 手机上弹出的键盘 */
  inputmode?: 'numeric' | 'text' | 'tel';
}

/** createGroupedFormat 的选项 */
export interface GroupedFormatOptions {
  /** 各组的长度：[3, 4, 4] 是 3-4-4；最后一组之后的字符再按最后一组的长度接着分 */
  groups: readonly number[];
  /** 接受的字符，默认数字 */
  accept?: RegExp;
  /** 原文最长几位；默认是各组加起来 */
  maxLength?: number;
  /** 组之间的分隔，默认一个空格 */
  separator?: string;
  /** 字母转成大写（身份证的 X） */
  uppercase?: boolean;
  /** 手机上弹出的键盘，默认 numeric */
  inputmode?: TextFormat['inputmode'];
}

/** 按位置分组的格式 */
export function createGroupedFormat({
  groups,
  accept = /\d/,
  maxLength = groups.reduce((sum, size) => sum + size, 0),
  separator = ' ',
  uppercase = false,
  inputmode = 'numeric',
}: GroupedFormatOptions): TextFormat {
  const one = new RegExp(accept.source, accept.flags.replace('g', ''));
  return {
    inputmode,
    parse: (text) => {
      const kept = Array.from(uppercase ? text.toUpperCase() : text).filter((char) =>
        one.test(char),
      );
      return kept.slice(0, maxLength).join('');
    },
    format: (raw) => {
      const parts: string[] = [];
      let rest = raw;
      for (let index = 0; rest; index++) {
        const size = groups[Math.min(index, groups.length - 1)]!;
        parts.push(rest.slice(0, size));
        rest = rest.slice(size);
      }
      return parts.join(separator);
    },
  };
}

/** 中国大陆手机号：3-4-4，11 位数字 */
export const phoneFormat: TextFormat = {
  ...createGroupedFormat({ groups: [3, 4, 4] }),
  inputmode: 'tel',
};

/** 居民身份证号：6-8-4（地区、出生日期、顺序码与校验位），最后一位可以是 X */
export const idCardFormat: TextFormat = createGroupedFormat({
  groups: [6, 8, 4],
  accept: /[\dXx]/,
  uppercase: true,
  inputmode: 'text',
});

/** 银行卡号：每 4 位一组，最长 19 位 */
export const bankCardFormat: TextFormat = createGroupedFormat({ groups: [4], maxLength: 19 });

/**
 * 原文里第 count 个字符之后，对应显示文字里的位置：重新格式化之后把光标放回原来那个字符的后面
 * （在 1380|0001111 打一个字，光标停在新字符后面，而不是跳到最后）
 */
export function displayPosition(format: TextFormat, raw: string, count: number): number {
  if (count <= 0) return 0;
  const shown = format.format(raw);
  let seen = 0;
  for (let index = 0; index < shown.length; index++) {
    if (format.parse(shown[index]!) !== '') seen++;
    if (seen === count) return index + 1;
  }
  return shown.length;
}

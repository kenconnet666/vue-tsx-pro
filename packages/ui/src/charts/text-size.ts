/**
 * 图表里文字的宽度估算：留坐标轴的边距、决定类目刻度隔几个写一个、地点名字的避让都要在画之前知道文字多宽。
 * 不去量 DOM（服务端渲染、还没挂上时也要算）：中日韩文字、全角符号按一个字号宽，其余按 0.6 个字号宽，
 * 宁宽勿窄（宽了只是多留一点空，窄了会叠在一起）。
 *
 *   estimateTextWidth('华东区 2026', 12)    // 3 × 12 + 5 × 7.2 = 72
 *   truncateText('很长很长的类目名', 60, 12)   // '很长很长…'
 */

/** 按一个字号宽算的字：中日韩文字、全角标点、假名、谚文 */
const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

/** 估算文字的宽度（px）；fontSize 是字号（px），默认 12（主题的 xs） */
export function estimateTextWidth(text: string, fontSize = 12): number {
  let width = 0;
  for (const char of text) width += WIDE.test(char) ? fontSize : fontSize * 0.6;
  return width;
}

/** 文字超过 maxWidth 时截短并加省略号；放得下时原样返回 */
export function truncateText(text: string, maxWidth: number, fontSize = 12): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text;
  const room = maxWidth - fontSize;
  let result = '';
  for (const char of text) {
    if (estimateTextWidth(result + char, fontSize) > room) break;
    result += char;
  }
  return `${result}…`;
}

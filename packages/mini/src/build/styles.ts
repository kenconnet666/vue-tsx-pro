/**
 * app 样式表：运行时没法插规则，构建时把"模块加载时就定下来的"静态规则收集出来——
 * 主题变量组（:root 上的默认值，换成小程序的 page）与关键帧；组合类在渲染时展开成行内样式，不进这里。
 * 规则来自打好的包自己（它导出 styleText），只含真正打进包里的模块。
 */

/** 元素的默认显示方式（运行时的 baseClassOf） */
const BASE = '.vtp-inline{display:inline}\n.vtp-inline-block{display:inline-block}';

/** 引擎收集的规则原文 → app 样式表 */
export function appStyles(styleText: string): string {
  const kept = topLevelRules(styleText).filter(
    (rule) =>
      rule.startsWith(':root') ||
      rule.startsWith('@keyframes') ||
      (rule.startsWith('@media') && rule.includes(':root{')),
  );
  // 小程序的样式表不认 :root；变量写在 page 上，组件里照样继承
  return [BASE, ...kept.map((rule) => rule.replaceAll(':root{', 'page{'))].join('\n');
}

/** 按顶层花括号配平切出规则（@media 等块规则整体算一条） */
function topLevelRules(css: string): string[] {
  const rules: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < css.length; index++) {
    if (css[index] === '{') depth++;
    else if (css[index] === '}' && --depth === 0) {
      rules.push(css.slice(start, index + 1).trim());
      start = index + 1;
    }
  }
  return rules;
}

// “减少动态效果”下元素是否停掉动画：在页面实际的样式表里找 prefers-reduced-motion 媒体查询中命中该元素、
// 把 animation-name 设成 none 的规则。不切换系统设置（会影响并行跑的其他测试文件），直接检查生成的 CSS
function* rulesUnder(rules: CSSRuleList, inReduced: boolean): Generator<CSSStyleRule> {
  for (const rule of rules) {
    if (rule instanceof CSSMediaRule) {
      yield* rulesUnder(
        rule.cssRules,
        inReduced || rule.conditionText.includes('prefers-reduced-motion: reduce'),
      );
    } else if (rule instanceof CSSStyleRule) {
      // 先判断样式规则：Firefox 里它也是 CSSGroupingRule（可以嵌套）
      if (inReduced) yield rule;
    } else if (rule instanceof CSSGroupingRule) {
      yield* rulesUnder(rule.cssRules, inReduced);
    }
  }
}

/** 样式表的规则；跨源的样式表（Firefox 里读 cssRules 会抛错）当作没有 */
function sheetRules(sheet: CSSStyleSheet): CSSRuleList | [] {
  try {
    return sheet.cssRules;
  } catch {
    return [];
  }
}

/** 减少动态效果时，element 的 animation-name 是否被设成 none */
export function stopsAnimationWhenReduced(element: Element): boolean {
  for (const sheet of document.styleSheets) {
    for (const rule of rulesUnder(sheetRules(sheet) as CSSRuleList, false)) {
      if (rule.style.animationName === 'none' && element.matches(rule.selectorText)) return true;
    }
  }
  return false;
}

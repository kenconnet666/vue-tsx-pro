// 组件测试的挂载工具：渲染到一个挂在 document 上的容器里，每个测试结束后自动卸载
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { afterEach } from 'vitest';
import { createApp, type App, type VNodeChild } from 'vue';

const mounted: { app: App; host: HTMLElement }[] = [];

afterEach(() => {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount();
    host.remove();
  }
});

/** 渲染 node，返回容器；组件的根元素是 `host.firstElementChild` */
export function mount(node: () => VNodeChild): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(_component(() => node));
  app.mount(host);
  mounted.push({ app, host });
  return host;
}

/**
 * 元素从样式表得到的声明：选中它某个类的规则（条件块、@ 规则里的也算），键是“条件 + 属性”（类名换成 &）。
 * 与引擎怎么生成类无关（原子类、组合类都行），测试按声明断言样式有没有加上：`styleOf(el).get('&|font-weight')`
 */
export function styleOf(element: Element): Map<string, string> {
  const patterns = [...element.classList].map((name) => new RegExp(`\\.${name}(?![\\w-])`, 'g'));
  const result = new Map<string, string>();
  const visit = (rules: CSSRuleList, wrapper: string) => {
    for (const rule of rules) {
      if ('selectorText' in rule) {
        const style = rule as CSSStyleRule;
        let selector = style.selectorText;
        if (!patterns.some((pattern) => selector.match(pattern))) continue;
        for (const pattern of patterns) selector = selector.replace(pattern, '&');
        // 同一个类重复几次（.c.c）、StyleX 抬特异性的 :not(#\#) 都不影响“是什么条件”
        selector = selector.replace(/&+/g, '&').replace(/:not\(#\\#\)/g, '');
        for (let index = 0; index < style.style.length; index++) {
          const property = style.style[index]!;
          result.set(`${wrapper}${selector}|${property}`, style.style.getPropertyValue(property));
        }
      } else if ('cssRules' in rule) {
        const media = (rule as CSSMediaRule).media?.mediaText ?? '';
        visit((rule as CSSGroupingRule).cssRules, `${wrapper}@${media} `);
      }
    }
  };
  for (const sheet of document.styleSheets) visit(sheet.cssRules, '');
  return result;
}

/**
 * 元素实际得到的样式文本：行内样式加上它的类的规则原文（其中的 var(--x…) 换成元素上的值）。动态样式的值可能写进了类里
 * （一直没变过的属性），也可能在行内变量里，断言取值时用它：`expect(styleTextOf(el)).toContain('repeat(3')`。
 * 用引擎记下的原文（stylex.styleText），不读 CSSOM：happy-dom 会丢掉它不认识的声明（-webkit-line-clamp、color-mix）
 */
export function styleTextOf(element: Element): string {
  const style = (element as HTMLElement).style;
  const patterns = [...element.classList].map((name) => new RegExp(`\\.${name}(?![\\w-])`));
  const rules = stylex
    .styleText()
    .split('\n')
    .filter((rule) => patterns.some((pattern) => pattern.test(rule)))
    .map((rule) =>
      rule.replace(
        /var\((--[\w-]+)\)/g,
        (text, name: string) => style?.getPropertyValue(name) || text,
      ),
    );
  return [element.getAttribute('style') ?? '', ...rules].join('\n');
}

/** element 是否带着 styles 的全部声明（组件按状态加样式时用来断言） */
export function hasStyles(element: Element, styles: StyleXStyles): boolean {
  const probe = document.createElement('div');
  probe.className = stylex.attrs(styles).class ?? '';
  const expected = styleOf(probe);
  const actual = styleOf(element);
  return expected.size > 0 && [...expected].every(([key, value]) => actual.get(key) === value);
}

/** 共用播报区（utils/dom/announcer）里现在的文字；announce 稍后才写入，断言时用 vi.waitFor */
export function announced(politeness: 'polite' | 'assertive' = 'polite'): string {
  return document.querySelector(`[data-live-announcer="${politeness}"]`)?.textContent ?? '';
}

/**
 * 一套主题、或页面上某个元素实际生效的各组 token 取值（CSS 文本，如 radii.md → '0.4em'）：
 * 主题的取值编译成了样式（CSS 变量），要放进页面里量。主题编辑器据此从一套主题出发调整
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { CssVar } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { applyStyleAttrs } from '../utils/props';
import { readToken, themeVariables, type Theme } from '../config/theme/theme';
import { t } from '../config/theme/tokens';
import { tokenCatalog } from './token-catalog';

/** 各组 token 的取值（CSS 文本）：组名 → token 名 → 取值 */
export type ThemeValues = Record<string, Record<string, string>>;

/** 元素上实际生效的各组 token 取值（CSS 文本，如 radii.md → '0.4em'）；元素要已挂载 */
export function elementThemeValues(element: Element): ThemeValues {
  const read = (group: string, token: string) => {
    const vars = t[group as keyof typeof t] as unknown as Record<string, CssVar>;
    return readToken(element, vars[token]!);
  };
  return Object.fromEntries(
    tokenCatalog.map((group) => [
      group.name,
      Object.fromEntries(group.tokens.map((token) => [token.name, read(group.name, token.name)])),
    ]),
  );
}

/** 在 container 里挂一个套着这套主题、不显示的空元素，读完就移除 */
function probeTheme<T>(theme: Theme, container: Element, read: (probe: Element) => T): T {
  const probe = document.createElement('div');
  applyStyleAttrs(probe, css.attrs(...theme.styles));
  for (const [name, value] of Object.entries(themeVariables(theme))) {
    probe.style.setProperty(name, value);
  }
  probe.hidden = true;
  container.append(probe);
  try {
    return read(probe);
  } finally {
    probe.remove();
  }
}

/** 一套主题的各组 token 取值（CSS 文本）：主题的取值编译成了样式，要放进页面里量 */
export function themeValues(theme: Theme, container: Element = document.body): ThemeValues {
  return probeTheme(theme, container, elementThemeValues);
}

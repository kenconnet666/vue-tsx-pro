// 颜色 token 取自 Radix Colors：StyleX 要求取值是字面量，所以写死在源码里，由这里对照色板
import * as radix from '@radix-ui/colors';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** token → [亮色色阶, 暗色色阶]；accentText 不在色板里（Radix 规定 indigo 9 上用白字） */
const steps: Record<string, [string, string]> = {
  background: ['slate1', 'slateDark1'],
  surface: ['slate1', 'slateDark2'],
  surfaceRaised: ['slate1', 'slateDark3'],
  surfaceHover: ['slate4', 'slateDark4'],
  text: ['slate12', 'slateDark12'],
  textMuted: ['slate11', 'slateDark11'],
  border: ['slate7', 'slateDark7'],
  borderStrong: ['slate8', 'slateDark8'],
  accent: ['indigo9', 'indigoDark9'],
  accentHover: ['indigo10', 'indigoDark10'],
  danger: ['red11', 'redDark11'],
  success: ['green11', 'greenDark11'],
  warning: ['amber11', 'amberDark11'],
  focusRing: ['indigo9', 'indigoDark9'],
  overlay: ['blackA6', 'blackA8'],
};

/** slateDark4 → radix.slateDark.slate4（暗色色阶里的键不带 Dark） */
function radixColor(step: string) {
  const scale = step.replace(/\d+$/, '');
  return (radix as unknown as Record<string, Record<string, string>>)[scale]![
    step.replace('Dark', '')
  ];
}

/** 读出源码里某个对象字面量的 `name: 'value'` 键值 */
function literals(file: string, start: string) {
  const source = readFileSync(join(import.meta.dirname, '../src/theme', file), 'utf8');
  const block = source.slice(source.indexOf(start), source.indexOf('});', source.indexOf(start)));
  return Object.fromEntries(
    [...block.matchAll(/^\s+(\w+): '([^']+)',$/gm)].map((m) => [m[1], m[2]]),
  );
}

describe('颜色 token', () => {
  const light = literals('tokens.stylex.ts', 'export const colors');
  const dark = literals('themes.ts', 'const darkColors');

  it('亮色与暗色取值都与 Radix 色阶一致', () => {
    const expected = (index: 0 | 1) =>
      Object.fromEntries(
        Object.entries(steps).map(([token, pair]) => [token, radixColor(pair[index])]),
      );
    const accentText = { accentText: '#ffffff' };
    expect(light).toEqual({ ...expected(0), ...accentText });
    expect(dark).toEqual({ ...expected(1), ...accentText });
  });
});

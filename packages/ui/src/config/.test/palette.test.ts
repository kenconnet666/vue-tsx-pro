// 颜色 token 取自 Radix Colors：StyleX 要求取值是字面量，所以写死在源码里，由这里对照色板
import * as radix from '@radix-ui/colors';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../utils/data/color';
import { paletteColors } from '../theme/palette';

/**
 * 品牌色、中性色之外的 token → [亮色色阶, 暗色色阶]；品牌色与中性色按 palette.ts 的规则从 indigo、slate 生成。
 * 危险色的实色上的文字（dangerContrast）是白色，不在色板里
 */
const steps: Record<string, [string, string]> = {
  // red 9 配白字不到 4.5:1，见 tokens.stylex.ts
  danger: ['red11', 'redDark8'],
  dangerHover: ['red10', 'redDark10'],
  dangerText: ['red11', 'redDark11'],
  dangerSoft: ['red3', 'redDark3'],
  dangerSoftHover: ['red4', 'redDark4'],
  dangerBorder: ['red7', 'redDark7'],
  // 亮色 11 级在 3 级底色上不到 4.5:1，见 tokens.stylex.ts
  successText: ['green12', 'greenDark11'],
  successSoft: ['green3', 'greenDark3'],
  successBorder: ['green7', 'greenDark7'],
  warningText: ['amber12', 'amberDark11'],
  warningSoft: ['amber3', 'amberDark3'],
  warningBorder: ['amber7', 'amberDark7'],
  infoText: ['blue12', 'blueDark11'],
  infoSoft: ['blue3', 'blueDark3'],
  infoBorder: ['blue7', 'blueDark7'],
  overlay: ['blackA6', 'blackA8'],
  highlight: ['amber4', 'amberDark4'],
  codeString: ['green11', 'greenDark11'],
  codeNumber: ['orange11', 'orangeDark11'],
  codeFunction: ['violet11', 'violetDark11'],
  codeType: ['cyan11', 'cyanDark11'],
  codeTag: ['crimson11', 'crimsonDark11'],
  codeAttribute: ['brown11', 'brownDark11'],
  codeInserted: ['green3', 'greenDark3'],
  codeDeleted: ['red3', 'redDark3'],
};

/**
 * 为满足对比度而偏离色阶的取值（scripts/themes/check.mjs 校验）：危险色实色上的白字、悬停态比实色更深，
 * 文字比 11 级深一点
 */
const adjusted: [Record<string, string>, Record<string, string>] = [
  {
    dangerContrast: '#ffffff',
    dangerHover: '#b8272c',
    dangerText: '#b8272c',
    codeString: '#1c7a51',
    codeNumber: '#c24b00',
  },
  {
    dangerContrast: '#ffffff',
    accentHover: '#3758d4',
    dangerHover: '#a33b3e',
  },
];

/** slateDark4 → radix.slateDark.slate4（暗色色阶里的键不带 Dark） */
function radixColor(step: string) {
  const scale = step.replace(/\d+$/, '');
  return (radix as unknown as Record<string, Record<string, string>>)[scale]![
    step.replace('Dark', '')
  ];
}

/** 读出源码里某个对象字面量的 `name: 'value'` 键值 */
function literals(file: string, start: string) {
  const source = readFileSync(join(import.meta.dirname, '../theme', file), 'utf8');
  const block = source.slice(source.indexOf(start), source.indexOf('});', source.indexOf(start)));
  return Object.fromEntries(
    [...block.matchAll(/^\s+(\w+): '([^']+)',$/gm)].map((m) => [m[1], m[2]]),
  );
}

describe('颜色 token', () => {
  const light = literals('tokens.stylex.ts', 'export const colors');
  const dark = literals('dark.ts', 'const darkColors');

  it('亮色与暗色取值都与 Radix 色阶一致：品牌色、中性色按 paletteColors 生成（为对比度调整过的单独列出）', () => {
    const expected = (index: 0 | 1) => ({
      ...paletteColors({
        accent: 'indigo',
        neutral: 'slate',
        appearance: index === 0 ? 'light' : 'dark',
      }),
      ...Object.fromEntries(
        Object.entries(steps).map(([token, pair]) => [token, radixColor(pair[index])]),
      ),
    });
    expect(light).toEqual({ ...expected(0), ...adjusted[0] });
    expect(dark).toEqual({ ...expected(1), ...adjusted[1] });
  });
});

describe('paletteColors', () => {
  it('换品牌色：整组按同样的级别替换；实色上的文字按对比度选白字或深色字', () => {
    const crimson = paletteColors({ accent: 'crimson', appearance: 'light' });
    expect(crimson.accent).toBe(radix.crimson.crimson9);
    expect(crimson.accentText).toBe(radix.crimson.crimson11);
    // 实色上的文字：白字够 4.5:1 就用白字（indigo），不够时换对比度更高的深色（亮黄）。
    // 中间亮度的色阶两者都可能不到 4.5:1，主题编辑器会提示
    expect(paletteColors({ accent: 'indigo', appearance: 'light' }).accentContrast).toBe('#ffffff');
    expect(paletteColors({ accent: 'yellow', appearance: 'light' }).accentContrast).not.toBe(
      '#ffffff',
    );
    for (const accent of ['crimson', 'yellow', 'teal'] as const) {
      const colors = paletteColors({ accent, appearance: 'light' });
      const chosen = contrastRatio(colors.accentContrast!, colors.accent!);
      const ratios = ['#ffffff', '#1c2024'].map((text) => contrastRatio(text, colors.accent!));
      expect(chosen >= 4.5 || chosen === Math.max(...ratios)).toBe(true);
    }
    // 只给品牌色时不动中性色
    expect(crimson.background).toBeUndefined();
  });
});

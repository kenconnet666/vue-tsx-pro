// 分段（css.layers）：每组一个类、各进一层级联层，合并语义与合成一个类逐字相同（fragment.ts 的说明）
import { describe, expect, it } from 'vitest';
import {
  declarations,
  merge,
  type Declarations,
  type StyleObject,
} from '../src/styles/declarations';
import { fragment, segmentTable, type Fragment } from '../src/styles/fragment';
import { recipe } from '../src/styles/recipe';
import { attrs, create, layers, styleText } from '../src/styles/runtime';
import { LAYER_ORDER, renderStyleTag } from '../src/styles/sheet';

/** 一个类的规则原文（styleText 记的，带层） */
const textsOf = (name: string) =>
  styleText()
    .split('\n')
    .filter((line) => new RegExp(`\\.${name}(?![\\w-])`).test(line));

const classes = (value: { class?: string }) => value.class?.split(' ') ?? [];

describe('分段', () => {
  it('不分段时一个类、类名与以前相同；分段时每组一个类，各在自己的层里', () => {
    const styles = create({ base: { color: 'rgb(1, 1, 1)' }, user: { marginTop: 3 } });
    const single = classes(attrs(styles.base, styles.user));
    expect(single).toHaveLength(1);
    expect(textsOf(single[0]!)[0]).toMatch(/^@layer vtp\.s0\{/);
    const [first, second] = classes(attrs(layers(styles.base, styles.user)));
    expect(textsOf(first!)[0]).toMatch(/^@layer vtp\.s0\{/);
    expect(textsOf(second!)[0]).toMatch(/^@layer vtp\.s1\{\.x\w+\{margin-top:3px\}\}$/);
    // 空的组不算：只剩一组时就是不分段的那个类
    expect(attrs(layers(undefined, styles.base, false))).toEqual(attrs(styles.base));
  });

  it('后面的段只带它改到的属性族：组件的组合与使用方的覆盖相加而不是相乘', () => {
    const tones = create({
      a: { color: 'rgb(2, 0, 0)', padding: 1 },
      b: { color: 'rgb(3, 0, 0)', padding: 1 },
      c: { color: 'rgb(4, 0, 0)', padding: 1 },
    });
    const overrides = create({ m1: { marginTop: 11 }, m2: { marginTop: 12 } });
    const seen = new Set<string>();
    for (const tone of [tones.a, tones.b, tones.c])
      for (const user of [overrides.m1, overrides.m2])
        classes(attrs(layers(tone, user))).forEach((name) => seen.add(name));
    // 3 + 2 个类，而不是 3 × 2 个各带全部声明的组合类
    expect(seen.size).toBe(5);
  });

  it('后段的普通值整体替换（含前面的条件值）；条件对象逐条件合并时带上前面没改的条件', () => {
    const base = fragmentOf({ color: { default: 'blue', ':hover': 'green', ':focus': 'navy' } });
    const plain = segmentTable([[base], [fragmentOf({ color: 'red' })]], 1);
    expect([...plain.get('color')!.values]).toEqual([['', ['red']]]);
    const merged = segmentTable([[base], [fragmentOf({ color: { default: 'red' } })]], 1);
    expect(Object.fromEntries(merged.get('color')!.values)).toEqual({
      '': ['red'],
      ':hover': ['green'],
      ':focus': ['navy'],
    });
  });

  it('属性族一起带：前段在条件里写简写、后段写长属性时，后段带上那条简写', () => {
    const ring = fragmentOf({ outline: { default: 'none', ':focus-visible': '2px solid blue' } });
    const table = segmentTable([[ring], [fragmentOf({ outlineColor: 'red' })]], 1);
    expect(Object.fromEntries(table.get('outline')!.values)).toEqual({
      '': ['none'],
      ':focus-visible': ['2px solid blue'],
    });
    expect([...table.keys()].sort()).toEqual(['outline', 'outline-color']);
    // 不相干的属性不带
    const other = segmentTable(
      [[ring, fragmentOf({ display: 'flex' })], [fragmentOf({ marginTop: 1 })]],
      1,
    );
    expect([...other.keys()]).toEqual(['margin-top']);
  });

  it('后段去掉的属性、只剩条件取值的属性补一条 revert，挡住低层的规则', () => {
    const removed = segmentTable(
      [[fragmentOf({ color: 'blue' })], [fragmentOf({ color: null })]],
      1,
    );
    expect([...removed.get('color')!.values]).toEqual([['', ['revert']]]);
    // 前段只在 @media 里写，后段先去掉再只写悬停：单个组合类里 @media 的值已经没了，层叠时不能从低层漏上来
    const media = fragmentOf({ marginTop: { default: null, '@media (min-width: 1px)': 3 } });
    const table = segmentTable(
      [
        [media],
        [
          fragmentOf({ marginTop: null }),
          fragmentOf({ marginTop: { default: null, ':hover': 4 } }),
        ],
      ],
      1,
    );
    expect(Object.fromEntries(table.get('margin-top')!.values)).toEqual({
      '': ['revert'],
      ':hover': ['4px'],
    });
  });

  it('配方有扩展时组件自己的一段、每个扩展一段；没有扩展时一个类', () => {
    const tag = recipe({
      name: 'Tag',
      parts: ['root'],
      base: { root: { display: 'inline-flex', color: 'rgb(9, 9, 9)' } },
      variants: { size: { sm: { root: { fontSize: 12 } } } },
    });
    expect(classes(attrs(tag({ size: 'sm' }).root))).toHaveLength(1);
    const theme = { base: { root: { letterSpacing: '1px' } } };
    const inner = { base: { root: { letterSpacing: '2px' } } };
    const [own, outer, innerClass] = classes(attrs(tag({ size: 'sm' }, theme, inner).root));
    expect(textsOf(own!).join('')).toContain('display:inline-flex');
    expect(textsOf(outer!).join('')).toMatch(/vtp\.s1.*letter-spacing:1px/);
    expect(textsOf(innerClass!).join('')).toMatch(/vtp\.s2.*letter-spacing:2px/);
  });

  it('服务端渲染的样式表最前面声明层的顺序', () => {
    const name = classes(attrs(create({ x: { color: 'rgb(5, 6, 7)' } }).x))[0]!;
    const tag = renderStyleTag(`<div class="${name}"></div>`);
    expect(tag).toContain(`>${LAYER_ORDER}\n`);
    expect(tag).toContain(`@layer vtp.s0{.${name}{color:rgb(5, 6, 7)}}`);
  });
});

describe('分段与热更新、绑定', () => {
  it('热更新换了前段的片段：带入过它的后段按原类名一起改写', async () => {
    const { hotStyles } = await import('../src/styles/runtime');
    const first = hotStyles(
      'layers.ts#ring',
      create({
        ring: { outline: { default: 'none', ':focus-visible': '2px solid rgb(1, 1, 1)' } },
      }),
    );
    const user = create({ color: { outlineColor: 'rgb(9, 9, 9)' } });
    const [, second] = classes(attrs(layers(first.ring, user.color)));
    expect(textsOf(second!).join('')).toContain('2px solid rgb(1, 1, 1)');
    hotStyles(
      'layers.ts#ring',
      create({
        ring: { outline: { default: 'none', ':focus-visible': '3px solid rgb(2, 2, 2)' } },
      }),
    );
    expect(textsOf(second!).join('')).toContain('3px solid rgb(2, 2, 2)');
    expect(textsOf(second!).join('')).not.toContain('rgb(1, 1, 1)');
  });

  it('按状态选样式（select）在后面的段里：状态变化只换那一段的类，组件不重新渲染', async () => {
    const { createApp, h, nextTick, ref } = await import('vue');
    const { select } = await import('../src/styles/runtime');
    const styles = create({
      root: { display: 'flex', color: 'rgb(10, 0, 0)' },
      gap: { gap: 4 },
      wide: { gap: 8 },
    });
    const wide = ref(false);
    let renders = 0;
    const host = document.createElement('div');
    document.body.append(host);
    createApp({
      render: () => {
        renders++;
        return h(
          'div',
          attrs(layers(styles.root, [styles.gap, select(() => wide.value && styles.wide)])),
        );
      },
    }).mount(host);
    const element = host.firstElementChild as HTMLElement;
    const [own, before] = [...element.classList];
    wide.value = true;
    await nextTick();
    const [ownAfter, after] = [...element.classList];
    expect(ownAfter).toBe(own);
    expect(after).not.toBe(before);
    expect(textsOf(after!).join('')).toContain('gap:8px');
    expect(renders).toBe(1);
  });
});

describe('分段与合成一个类等价（随机）', () => {
  const PROPERTIES = ['color', 'margin-top', 'outline', 'outline-color'];
  const CONDITIONS = [':hover', ':focus', '@media (min-width: 1px)'];

  it('任意分段、任意状态下，每个属性按层叠选出的值与合成一个类时相同', () => {
    const random = seeded(20261106);
    const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
    for (let round = 0; round < 400; round++) {
      const fragments = Array.from({ length: 2 + Math.floor(random() * 4) }, () =>
        fragmentOf(randomStyle(random, pick)),
      );
      const segments = randomSplit(fragments, random);
      const single = merge(fragments.map(tableOf));
      const layered = segments.map((_, index) => segmentTable(segments, index));
      for (const state of subsets(CONDITIONS)) {
        for (const property of PROPERTIES) {
          const expected = valueIn(single, property, state);
          // 层叠：最高的、对这个属性在这个状态下有规则的层说了算
          let actual: string | undefined;
          for (let index = layered.length - 1; index >= 0; index--) {
            actual = valueIn(layered[index]!, property, state);
            if (actual !== undefined) break;
          }
          if (actual === 'revert') actual = undefined;
          expect(actual, `第 ${round} 轮 ${property} @ [${state.join(',')}]`).toBe(expected);
        }
      }
    }
  });

  /** 一段随机样式：几个属性，各是普通值、null，或条件对象（条件里可以有 null） */
  function randomStyle(random: () => number, pick: <T>(list: readonly T[]) => T): StyleObject {
    const style: Record<string, unknown> = {};
    for (const property of PROPERTIES) {
      const roll = random();
      if (roll < 0.4) continue;
      const camel = property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      if (roll < 0.55) style[camel] = null;
      else if (roll < 0.75) style[camel] = `v${Math.floor(random() * 5)}`;
      else {
        const object: Record<string, unknown> = {
          default: random() < 0.3 ? null : `d${Math.floor(random() * 5)}`,
        };
        for (const condition of CONDITIONS)
          if (random() < 0.5)
            object[condition] = random() < 0.2 ? null : `c${Math.floor(random() * 5)}`;
        if (random() < 0.3) object[pick(CONDITIONS)] = { default: 'n1', [pick(CONDITIONS)]: 'n2' };
        style[camel] = object;
      }
    }
    return style as StyleObject;
  }
});

const tableOf = (part: Fragment) =>
  (part as unknown as Record<symbol, Declarations>)[Object.getOwnPropertySymbols(part)[0]!]!;

function fragmentOf(style: StyleObject): Fragment {
  return fragment(declarations(style));
}

/** 状态（成立的条件）下这一层声明表里这个属性的值：条件链都成立的规则里条件优先级最高的（同 serialize 的排序） */
function valueIn(table: Declarations, property: string, state: readonly string[]) {
  const entry = table.get(property);
  if (!entry) return undefined;
  let best: { weight: number; value: string } | undefined;
  for (const [chain, values] of entry.values) {
    const parts = chain ? chain.split('\0') : [];
    if (!parts.every((part) => state.includes(part))) continue;
    const weight = parts.length;
    if (!best || weight >= best.weight) best = { weight, value: values.join(',') };
  }
  return best?.value;
}

function randomSplit(fragments: readonly Fragment[], random: () => number): Fragment[][] {
  const segments: Fragment[][] = [[]];
  for (const part of fragments) {
    if (segments.at(-1)!.length && random() < 0.5) segments.push([]);
    segments.at(-1)!.push(part);
  }
  return segments;
}

function subsets<T>(list: readonly T[]): T[][] {
  return list.reduce<T[][]>((all, item) => [...all, ...all.map((set) => [...set, item])], [[]]);
}

/** 可复现的随机数（mulberry32） */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 运行时样式引擎：片段惰性、一次 attrs 合成一个类、合并语义、缓存命中返回同一个对象、动态样式只改变量、
// 变量组、主题、标记、token 短写与关键帧；配方按档位组合缓存
import { describe, expect, it } from 'vitest';
import { recipe } from '../src/stylex/recipe';
import {
  attrs,
  create,
  createTheme,
  defineMarker,
  defineTokens,
  defineVars,
  keyframes,
  styleText,
  when,
} from '../src/stylex/runtime';

/** 某个类的全部规则文本（每条规则压成一行） */
const rulesOf = (className: string | undefined) =>
  [...document.querySelector<HTMLStyleElement>('style[data-vue-tsx-pro]')!.sheet!.cssRules]
    .map((rule) => rule.cssText.replace(/\s+/g, ' '))
    .filter((rule) => className && rule.includes(`.${className}`))
    .join('\n');

describe('create 与 attrs', () => {
  it('create 不插规则；attrs 把几个片段合成一个类，同样的组合只插一次、返回同一个对象', () => {
    const before = styleText();
    const styles = create({ a: { color: 'rgb(1, 2, 3)', paddingTop: 4 }, b: { marginTop: 2 } });
    expect(styleText()).toBe(before);
    const first = attrs(styles.a, styles.b);
    expect(first.class!.split(' ')).toHaveLength(1);
    expect(rulesOf(first.class)).toMatch(
      /color: rgb\(1, 2, 3\).*padding-top: 4px.*margin-top: 2px/,
    );
    expect(attrs(styles.a, false, null, [styles.b])).toBe(first);
  });

  it('后面的普通值整体替换（含前面的条件值）；条件对象逐项合并，条件里的 null 表示不改', () => {
    const styles = create({
      base: { color: { default: 'rgb(10, 0, 0)', ':hover': 'rgb(20, 0, 0)' } },
      plain: { color: 'rgb(30, 0, 0)' },
      hoverOnly: { color: { default: null, ':hover': 'rgb(40, 0, 0)' } },
    });
    const replaced = rulesOf(attrs(styles.base, styles.plain).class);
    expect(replaced).toContain('rgb(30, 0, 0)');
    expect(replaced).not.toContain(':hover');
    const merged = rulesOf(attrs(styles.base, styles.hoverOnly).class);
    expect(merged).toContain('rgb(10, 0, 0)');
    expect(merged).toMatch(/:hover \{ color: rgb\(40, 0, 0\)/);
    expect(merged).not.toContain('rgb(20, 0, 0)');
  });

  it('简写在前、长属性在后；条件块按 :hover < @media 排，@media 里重复类名压过伪类', () => {
    const styles = create({
      box: {
        paddingTop: 1,
        padding: 2,
        color: { default: 'red', '@media (min-width: 1px)': 'blue', ':hover': 'green' },
      },
    });
    const name = attrs(styles.box).class!;
    const rules = rulesOf(name);
    // 简写排在前面，长属性的值留下来（与书写顺序无关）
    // （CSSOM 可能把它们合回一个简写：上边 1px、其余 2px）
    expect(rules).toMatch(/padding: 1px 2px 2px|padding-top: 1px/);
    expect(rules.indexOf(':hover')).toBeLessThan(rules.indexOf('@media'));
    expect(rules).toContain(`.${name}.${name} { color: blue; }`);
  });

  it('条件别名换成 aria / data 选择器；属性选择器包成 :is(…)，顶层条件块也行；写错的条件直接报错', () => {
    const styles = create({ tab: { color: { default: 'gray', _selected: 'black' } } });
    expect(rulesOf(attrs(styles.tab).class)).toContain('[aria-selected="true"]');
    const flags = create({
      row: { color: { default: 'gray', '[data-hot]': 'red' }, '[data-dense]': { padding: 2 } },
    });
    const rules = rulesOf(attrs(flags.row).class);
    expect(rules).toMatch(/:is\(\[data-hot\]\) \{ color: red/);
    expect(rules).toMatch(/:is\(\[data-dense\]\) \{ padding: 2px/);
    const wrong = create({ tab: { color: { default: 'gray', 'data-x': 'black' } } });
    expect(() => attrs(wrong.tab)).toThrow(/不是伪类/);
  });

  it('动态样式：没变过的属性写进类里，变过的转成变量；转成变量后值再变，类不变、不插新规则', () => {
    const styles = create({ size: (width: number) => ({ width, height: 6 }) });
    const first = attrs(styles.size(120));
    expect(first.style).toBeUndefined();
    expect(rulesOf(first.class)).toContain('width: 120px');
    const second = attrs(styles.size(80));
    expect(second.style).toEqual({ '--x-width': '80px' });
    const rules = rulesOf(second.class);
    expect(rules).toContain('width: var(--x-width)');
    expect(rules).toContain('height: 6px');
    const text = styleText();
    const third = attrs(styles.size(60));
    expect(third.class).toBe(second.class);
    expect(third.style).toEqual({ '--x-width': '60px' });
    expect(styleText()).toBe(text);
  });

  it('when.ancestor 生成 :where 选择器，类名多重复一次；标记放进 attrs 挂上它的类', () => {
    const marker = defineMarker('xmarker');
    expect(attrs(marker).class).toBe('xmarker');
    const styles = create({
      link: { opacity: { default: 0, [when.ancestor(':hover', marker)]: 1 } },
    });
    const name = attrs(styles.link).class!;
    expect(styleText()).toContain(`.${name}.${name}:where(.xmarker:hover *)`);
  });
});

describe('变量组、主题、token 与关键帧', () => {
  it('defineVars：变量名由组名与键决定，条件值进 @ 规则；同名再定义换成新值', () => {
    const vars = defineVars('test-vars', {
      textMuted: '#666',
      speed: { default: '200ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    });
    expect(vars).toEqual({
      textMuted: 'var(--test-vars-text-muted)',
      speed: 'var(--test-vars-speed)',
    });
    expect(styleText()).toContain(':root{--test-vars-text-muted:#666;--test-vars-speed:200ms}');
    expect(styleText()).toContain(
      '@media (prefers-reduced-motion: reduce){:root{--test-vars-speed:0ms}}',
    );
    defineVars('test-vars', { textMuted: '#777', speed: '1ms' });
    expect(styleText()).toContain(':root{--test-vars-text-muted:#777;--test-vars-speed:1ms}');
    expect(styleText()).not.toContain('#666');
  });

  it('变量组的 token 作为键：设置那个变量', () => {
    const vars = defineVars('test-glow', { glow: 'red' });
    const styles = create({ box: { [vars.glow]: 'blue' } });
    expect(rulesOf(attrs(styles.box).class)).toContain('--test-glow-glow: blue');
  });

  it('token 短写：按属性找组，带组名的任何属性都能用；写错时报错', () => {
    defineTokens({
      space: defineVars('test-space', { md: '1em' }),
      colors: defineVars('test-colors', { fg: '#111' }),
    });
    const styles = create({
      box: { padding: '_md', outlineColor: '_colors.fg', width: '_space.md' },
      bad: { padding: '_nope' },
      noGroup: { zIndex: '_md' },
    });
    const rules = rulesOf(attrs(styles.box).class);
    expect(rules).toContain('padding: var(--test-space-md)');
    expect(rules).toContain('outline-color: var(--test-colors-fg)');
    expect(rules).toContain('width: var(--test-space-md)');
    expect(() => styles.bad).toThrow(/找不到 token '_nope'/);
    expect(() => styles.noGroup).toThrow(/带组名/);
    expect(() => create({ calc: { margin: 'calc(-1 * _md)' } }).calc).toThrow(/t.组.md/);
    expect(rulesOf(attrs(create({ font: { fontFamily: 'my_font, sans' } }).font).class)).toContain(
      'my_font',
    );
  });

  it('主题类只改变量，和片段一起放进 attrs 时单独挂上；同一变量组后者覆盖前者', () => {
    const vars = defineVars('xaccent-group', { accent: 'black' });
    const green = createTheme(vars, { accent: 'rgb(0, 128, 0)' });
    const red = createTheme(vars, { accent: 'rgb(128, 0, 0)' });
    expect(styleText()).toContain('--xaccent-group-accent:rgb(0, 128, 0)');
    const styles = create({ box: { color: vars.accent } });
    const classes = attrs(green, styles.box, red).class!.split(' ');
    expect(classes).toHaveLength(2);
    expect(rulesOf(classes[1])).toContain('rgb(128, 0, 0)');
  });

  it('关键帧：返回动画名，规则只插一次', () => {
    const name = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
    expect(keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })).toBe(name);
    expect(styleText()).toContain(`@keyframes ${name}`);
  });
});

describe('recipe', () => {
  const button = recipe({
    parts: ['root', 'icon'],
    base: { root: { display: 'inline-flex' }, icon: { flexShrink: 0 } },
    variants: {
      size: { sm: { root: { fontSize: 12 } }, md: { root: { fontSize: 14 } } },
      block: { true: { root: { width: '100%' } } },
    },
    compound: [{ when: { size: 'sm', block: true }, root: { paddingInline: 0 } }],
    defaults: { size: 'md' },
  });

  it('默认值、档位、组合档位按顺序排进每个部件；同一组合返回同一个结果', () => {
    const md = button();
    expect(md.root).toHaveLength(2);
    expect(md.icon).toHaveLength(1);
    const small = button({ size: 'sm', block: true });
    expect(small.root).toHaveLength(4);
    expect(button({ size: 'sm', block: true })).toBe(small);
    const rules = rulesOf(attrs(small.root).class);
    for (const text of ['display: inline-flex', 'font-size: 12px', 'width: 100%']) {
      expect(rules).toContain(text);
    }
  });
});

describe('bind', () => {
  it('属性第一次变化时组件重新渲染一次换成变量版的类，之后参数变化只改元素上的变量', async () => {
    const { createApp, h, nextTick, ref } = await import('vue');
    const { bind } = await import('../src/stylex/runtime');
    const styles = create({ bar: (width: number) => ({ width, height: 6 }) });
    const width = ref(10);
    let renders = 0;
    const host = document.createElement('div');
    document.body.append(host);
    createApp({
      render() {
        renders++;
        return h('div', attrs(bind(styles.bar, () => [width.value] as [number])));
      },
    }).mount(host);
    const element = host.firstElementChild as HTMLElement;
    expect(rulesOf(element.className)).toContain('width: 10px');
    width.value = 30;
    await nextTick();
    await nextTick();
    expect(rulesOf(element.className)).toContain('width: var(--x-width)');
    expect(rulesOf(element.className)).toContain('height: 6px');
    expect(element.style.getPropertyValue('--x-width')).toBe('30px');
    expect(renders).toBe(2);
    for (const value of [12, 10, 50]) {
      width.value = value;
      await nextTick();
      expect(element.style.getPropertyValue('--x-width')).toBe(`${value}px`);
    }
    expect(renders).toBe(2);
  });
});

describe('bind 与重新渲染', () => {
  it('组件因为别的状态重新渲染时复用元素上的 effect，不会越积越多；卸载后不再更新', async () => {
    const { createApp, h, nextTick, ref } = await import('vue');
    const { bind } = await import('../src/stylex/runtime');
    const styles = create({ bar: (width: number) => ({ width }) });
    // 先让 width 转成变量：之后挂上的元素一开始就是变量版的类，不会因为换类重新渲染
    attrs(styles.bar(1));
    attrs(styles.bar(2));
    const width = ref(10);
    const other = ref(0);
    let reads = 0;
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      render() {
        void other.value;
        return h(
          'div',
          attrs(
            bind(styles.bar, () => {
              reads++;
              return [width.value] as [number];
            }),
          ),
        );
      },
    });
    app.mount(host);
    for (let i = 0; i < 3; i++) {
      other.value++;
      await nextTick();
    }
    reads = 0;
    width.value = 40;
    await nextTick();
    expect(reads).toBe(1);
    app.unmount();
    reads = 0;
    width.value = 50;
    await nextTick();
    expect(reads).toBe(0);
  });
});

describe('bind 与同一元素上的其他动态样式', () => {
  it('绑定的 effect 只改自己的变量，不动同一元素上普通动态样式写的变量', async () => {
    const { createApp, h, nextTick, ref } = await import('vue');
    const { bind } = await import('../src/stylex/runtime');
    const styles = create({
      bottom: (value: string) => ({ bottom: value }),
      height: (value: string) => ({ height: value }),
    });
    // 两个属性都先转成变量
    attrs(styles.bottom('1%'), styles.height('1%'));
    attrs(styles.bottom('2%'), styles.height('2%'));
    const height = ref('30%');
    const host = document.createElement('div');
    document.body.append(host);
    createApp({
      render: () =>
        h(
          'div',
          attrs(
            styles.bottom('10%'),
            bind(styles.height, () => [height.value] as [string]),
          ),
        ),
    }).mount(host);
    const element = host.firstElementChild as HTMLElement;
    height.value = '40%';
    await nextTick();
    expect(element.style.getPropertyValue('--x-height')).toBe('40%');
    expect(element.style.getPropertyValue('--x-bottom')).toBe('10%');
  });
});

describe('hotStyles（热更新原地生效）', () => {
  it('同一 id 再登记：返回旧对象，已用过的组合类按原类名改写规则', async () => {
    const { hotStyles } = await import('../src/stylex/runtime');
    const first = hotStyles('hot.ts#styles', create({ box: { color: 'rgb(1, 1, 1)' } }));
    const name = attrs(first.box).class!;
    const second = hotStyles(
      'hot.ts#styles',
      create({ box: { color: 'rgb(2, 2, 2)' }, extra: { margin: 0 } }),
    );
    expect(second).toBe(first);
    expect(attrs(second.box).class).toBe(name);
    expect(rulesOf(name)).toContain('rgb(2, 2, 2)');
    expect(rulesOf(name)).not.toContain('rgb(1, 1, 1)');
    expect('extra' in second).toBe(true);
  });

  it('配方：同一段的片段不变、声明换新；新加的档位可用', async () => {
    const { hotStyles } = await import('../src/stylex/runtime');
    const make = (color: string) =>
      recipe({
        parts: ['root'],
        base: { root: { color } },
        variants: { size: { sm: { root: { fontSize: 12 } } } },
      });
    const first = hotStyles('hot.ts#chip', make('rgb(3, 3, 3)'));
    const name = attrs(first().root).class!;
    const second = hotStyles(
      'hot.ts#chip',
      recipe({
        parts: ['root'],
        base: { root: { color: 'rgb(4, 4, 4)' } },
        variants: { size: { sm: { root: { fontSize: 12 } }, lg: { root: { fontSize: 18 } } } },
      }),
    );
    expect(second).toBe(first);
    expect(attrs(second().root).class).toBe(name);
    expect(rulesOf(name)).toContain('rgb(4, 4, 4)');
    expect(rulesOf(attrs(second({ size: 'lg' } as never).root).class)).toContain('18px');
  });
});

describe('稳定的绑定', () => {
  it('重新渲染时只换读取函数、不重跑 effect；之后参数变化照样只改变量', async () => {
    const { createApp, h, nextTick, ref } = await import('vue');
    const { bind } = await import('../src/stylex/runtime');
    const styles = create({ bar: (width: number) => ({ width }) });
    attrs(styles.bar(1));
    attrs(styles.bar(2));
    const width = ref(10);
    const other = ref(0);
    let reads = 0;
    const host = document.createElement('div');
    document.body.append(host);
    createApp({
      render() {
        void other.value;
        const getter = () => {
          reads++;
          return [width.value] as [number];
        };
        return h('div', attrs(bind(styles.bar, getter, true)));
      },
    }).mount(host);
    const element = host.firstElementChild as HTMLElement;
    reads = 0;
    other.value++;
    await nextTick();
    // 只有渲染时取的那一次
    expect(reads).toBe(1);
    width.value = 70;
    await nextTick();
    expect(element.style.getPropertyValue('--x-width')).toBe('70px');
  });
});

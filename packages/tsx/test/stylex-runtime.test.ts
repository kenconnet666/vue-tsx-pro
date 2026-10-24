// 运行时的 StyleX：create 惰性展开成原子类、条件与别名、按属性合并、动态样式、主题、关键帧；配方按档位组合缓存
import { props } from '@stylexjs/stylex';
import { describe, expect, it } from 'vitest';
import { recipe } from '../src/stylex/recipe';
import { create, createTheme, keyframes, when } from '../src/stylex/runtime';

/** 注入的全部规则文本 */
const injected = () =>
  [...document.querySelectorAll<HTMLStyleElement>('style')]
    .flatMap((style) => [...(style.sheet?.cssRules ?? [])].map((rule) => rule.cssText))
    .join('\n');

describe('create', () => {
  it('第一次读到命名空间才生成原子类；同样的属性与值只生成一个类', () => {
    const styles = create({
      a: { color: 'rgb(1, 2, 3)', paddingTop: 4 },
      b: { color: 'rgb(1, 2, 3)' },
    });
    expect(injected()).not.toContain('rgb(1, 2, 3)');
    const a = styles.a as unknown as Record<string, string>;
    const b = styles.b as unknown as Record<string, string>;
    expect(a.$$css).toBe(true);
    expect(a.color).toBe(b.color);
    expect(injected()).toContain('padding-top: 4px');
  });

  it('条件对象：伪类、@media 各一个类；别名 _selected 换成 aria/data 选择器；null 不生成', () => {
    const styles = create({
      tab: {
        color: { default: 'rgb(10, 0, 0)', ':hover': 'rgb(20, 0, 0)', _selected: 'rgb(30, 0, 0)' },
        opacity: { default: null, '@media (forced-colors: active)': 0.5 },
      },
    });
    const tab = styles.tab as unknown as Record<string, string>;
    expect(tab.color!.split(' ')).toHaveLength(3);
    expect(tab.opacity!.split(' ')).toHaveLength(1);
    const css = injected();
    expect(css).toMatch(/:hover/);
    expect(css).toContain('aria-selected="true"');
    expect(css).toContain('@media (forced-colors: active)');
  });

  it('按属性合并：后者覆盖前者的同名属性，其余保留', () => {
    const styles = create({
      base: { color: 'rgb(40, 0, 0)', marginTop: 1 },
      override: { color: 'rgb(50, 0, 0)' },
    });
    const merged = props(styles.base as never, styles.override as never).className!.split(' ');
    const base = styles.base as unknown as Record<string, string>;
    const override = styles.override as unknown as Record<string, string>;
    expect(merged).toContain(override.color);
    expect(merged).not.toContain(base.color);
    expect(merged).toContain(base.marginTop);
  });

  it('动态样式：固定的类引用变量，值进行内样式（数字补 px），变量注册为不继承', () => {
    const styles = create({ size: (width: number) => ({ width }) });
    const [compiled, inline] = styles.size(120) as unknown as [
      Record<string, string>,
      Record<string, string>,
    ];
    const [again] = styles.size(80) as unknown as [Record<string, string>];
    expect(compiled.width).toBe(again!.width);
    expect(inline['--x-width']).toBe('120px');
    expect(injected()).toContain('width: var(--x-width)');
  });

  it('when.ancestor 生成 :where 选择器，类名多重复一次（同编译版）', () => {
    const marker = { xmarker: 'xmarker', $$css: true } as const;
    const styles = create({
      link: { opacity: { default: 0, [when.ancestor(':hover', marker)]: 1 } },
    });
    const link = (styles.link as unknown as Record<string, string>).opacity!.split(' ')[1]!;
    expect(injected()).toContain(`.${link}.${link}:where(.xmarker:hover *)`);
  });
});

describe('createTheme 与 keyframes', () => {
  it('主题类只改变量；返回 { 变量组哈希: 主题类 变量组哈希 }', () => {
    const vars = { accent: 'var(--xaccent)', __varGroupHash__: 'xgroup' };
    const theme = createTheme(vars, { accent: 'rgb(0, 128, 0)' }) as Record<string, string>;
    expect(theme.xgroup).toMatch(/^x\w+ xgroup$/);
    expect(injected()).toContain('--xaccent: rgb(0, 128, 0)');
  });

  it('关键帧：返回动画名，规则只注入一次', () => {
    const name = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
    expect(keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })).toBe(name);
    expect(injected()).toContain(`@keyframes ${name}`);
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
    const className = props(...(small.root as never[])).className!;
    expect(className.split(' ').length).toBeGreaterThanOrEqual(4);
  });
});

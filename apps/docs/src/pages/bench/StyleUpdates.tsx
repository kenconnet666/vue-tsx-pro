/**
 * 样式更新基准（不进导航，scripts/docs/style-updates.mjs 驱动）：状态变化时样式层到底动了什么。
 *
 *   /bench/style-updates?mode=sx        1000 行连续值，css.create 的动态样式；hot 是条件类（item.hot && styles.hot，编译成 css.select）
 *   /bench/style-updates?mode=attr      同 sx，但 hot 写在 DOM 属性上（data-hot + '[data-hot]' 条件），类固定
 *   /bench/style-updates?mode=emotion   同样的声明交给 Emotion（每个新值一个新类）
 *   /bench/style-updates?mode=vars      手写：固定的类 + 元素上的变量（理论下限）
 *
 * 页面上还有 Tabs、Button、Badge 与主题切换。场景由 window.__bench.run(名字, 次数) 触发：每次改状态后等 Vue 更新、
 * 再强制布局，统计耗时、DOM 改动（按属性名）、CSSOM 改动（insertRule / deleteRule / 改规则文本）与行组件的渲染次数。
 */
import { css as emotion } from '@emotion/css';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  darkTheme,
  Flex,
  lightTheme,
  Provider,
  t,
  Tab,
  TabList,
  Tabs,
} from '@vue-tsx-pro/ui';
import { nextTick } from 'vue';

type Mode = 'sx' | 'attr' | 'emotion' | 'vars';
interface Item {
  id: number;
  width: number;
  hot: boolean;
}

const ROWS = 1000;
const mode = (new URLSearchParams(location.search).get('mode') ?? 'sx') as Mode;

/** 行组件的渲染次数（每次渲染加一） */
let renders = 0;

const styles = css.create({
  row: { display: 'flex', alignItems: 'center', gap: 8, height: 14, fontSize: 11 },
  hot: { color: '_dangerText' },
  track: { flexGrow: 1, height: 6, backgroundColor: '_fill', borderRadius: 3 },
  bar: (width: number) => ({ width, height: 6, backgroundColor: '_accent', borderRadius: 3 }),
  // attr 组：hot 写在 DOM 属性上，类固定
  flaggedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 14,
    fontSize: 11,
    color: { default: null, '[data-hot]': '_dangerText' },
  },
});

// 手写对照：固定的类，宽度走元素上的变量。三组的颜色都用同样的主题变量，比的只是样式层
const handStyle = document.createElement('style');
handStyle.textContent =
  '.b-row{display:flex;align-items:center;gap:8px;height:14px;font-size:11px}' +
  `.b-hot{color:${t.colors.dangerText}}` +
  `.b-track{flex-grow:1;height:6px;background-color:${t.colors.fill};border-radius:3px}` +
  `.b-bar{width:var(--w);height:6px;background-color:${t.colors.accent};border-radius:3px}`;
document.head.append(handStyle);

const SxRow = _component(({ item }: { item: Item }) => () => {
  renders++;
  return (
    <div {...css.attrs(styles.row, item.hot && styles.hot)}>
      <span>{item.id}</span>
      <div {...css.attrs(styles.track)}>
        <div {...css.attrs(styles.bar(item.width))} />
      </div>
    </div>
  );
});

const AttrRow = _component(({ item }: { item: Item }) => () => {
  renders++;
  return (
    <div {...css.attrs(styles.flaggedRow)} data-hot={item.hot || undefined}>
      <span>{item.id}</span>
      <div {...css.attrs(styles.track)}>
        <div {...css.attrs(styles.bar(item.width))} />
      </div>
    </div>
  );
});

const EmotionRow = _component(({ item }: { item: Item }) => () => {
  renders++;
  return (
    <div
      class={emotion({
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 14,
        fontSize: 11,
        color: item.hot ? t.colors.dangerText : undefined,
      })}
    >
      <span>{item.id}</span>
      <div
        class={emotion({ flexGrow: 1, height: 6, backgroundColor: t.colors.fill, borderRadius: 3 })}
      >
        <div
          class={emotion({
            width: item.width,
            height: 6,
            backgroundColor: t.colors.accent,
            borderRadius: 3,
          })}
        />
      </div>
    </div>
  );
});

const VarsRow = _component(({ item }: { item: Item }) => () => {
  renders++;
  return (
    <div class={item.hot ? 'b-row b-hot' : 'b-row'}>
      <span>{item.id}</span>
      <div class="b-track">
        <div class="b-bar" style={{ '--w': `${item.width}px` }} />
      </div>
    </div>
  );
});

const Row = { sx: SxRow, attr: AttrRow, emotion: EmotionRow, vars: VarsRow }[mode];

/** 一次场景的统计 */
interface Probe {
  /** 各属性被改的次数（class、style、aria-selected…），childList 是增删子节点 */
  mutations: Record<string, number>;
  /** CSSOM 改动：insertRule、deleteRule、规则文本被改 */
  cssom: Record<string, number>;
}

const probe: Probe = { mutations: {}, cssom: {} };
const count = (table: Record<string, number>, key: string) => (table[key] = (table[key] ?? 0) + 1);
for (const method of ['insertRule', 'deleteRule', 'replaceSync'] as const) {
  const original = CSSStyleSheet.prototype[method] as (...args: unknown[]) => unknown;
  CSSStyleSheet.prototype[method] = function (this: CSSStyleSheet, ...args: unknown[]) {
    count(probe.cssom, method);
    return original.apply(this, args);
  } as never;
}
const cssText = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText')!;
Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', {
  ...cssText,
  set(value: string) {
    // 只算样式表里的规则（元素的 style.cssText 由 DOM 改动统计）
    if (this.parentRule) count(probe.cssom, 'ruleText');
    cssText.set!.call(this, value);
  },
});

export default _component(() => {
  const items = _state<Item[]>(
    Array.from({ length: ROWS }, (_, id) => ({ id, width: (id * 7) % 200, hot: id % 10 === 0 })),
  );
  let unrelated = _state(0);
  let tab = _state('a');
  let disabled = _state(false);
  let tone = _state<'accent' | 'success'>('accent');
  let dark = _state(false);

  const scenarios: Record<string, () => void> = {
    /** 每行宽度加一（连续值） */
    widths: () => items.forEach((item) => (item.width = (item.width + 1) % 240)),
    /** 一行的宽度变化 */
    oneWidth: () => (items[0]!.width = (items[0]!.width + 1) % 240),
    /** 每行切换一次 hot（有限状态） */
    hot: () => items.forEach((item) => (item.hot = !item.hot)),
    /** 与样式无关的状态 */
    unrelated: () => unrelated++,
    tabs: () => (tab = tab === 'a' ? 'b' : 'a'),
    disabled: () => (disabled = !disabled),
    tone: () => (tone = tone === 'accent' ? 'success' : 'accent'),
    theme: () => (dark = !dark),
  };

  let root: HTMLElement | undefined;
  (window as unknown as { __bench: unknown }).__bench = {
    mode,
    rules: () =>
      [...document.styleSheets].reduce((sum, sheet) => sum + (sheet.cssRules?.length ?? 0), 0),
    async run(name: string, times: number) {
      const observer = new MutationObserver((records) => {
        for (const record of records) count(probe.mutations, record.attributeName ?? record.type);
      });
      observer.observe(root!, { subtree: true, attributes: true, childList: true });
      // 往 head 里加 style、改 style 的文本（Emotion 开发模式这样插规则）也算 CSSOM 改动
      const head = new MutationObserver((records) =>
        records.forEach(() => count(probe.cssom, 'styleTag')),
      );
      head.observe(document.head, { subtree: true, childList: true, characterData: true });
      probe.mutations = {};
      probe.cssom = {};
      renders = 0;
      const start = performance.now();
      for (let i = 0; i < times; i++) {
        scenarios[name]!();
        await nextTick();
        void root!.offsetHeight;
      }
      const ms = performance.now() - start;
      observer
        .takeRecords()
        .forEach((record) => count(probe.mutations, record.attributeName ?? record.type));
      observer.disconnect();
      head.takeRecords().forEach(() => count(probe.cssom, 'styleTag'));
      head.disconnect();
      return { ms, renders, mutations: { ...probe.mutations }, cssom: { ...probe.cssom } };
    },
  };

  return () => (
    <Provider theme={dark ? darkTheme : lightTheme}>
      <div ref={(element) => (root = element as HTMLElement)}>
        <Flex gap="md" align="center">
          <span>无关状态 {unrelated}</span>
          <Tabs _value={_bind(tab)}>
            <TabList aria-label="基准">
              <Tab value="a">甲</Tab>
              <Tab value="b">乙</Tab>
            </TabList>
          </Tabs>
          <Button disabled={disabled}>按钮</Button>
          <Badge tone={tone}>标记</Badge>
        </Flex>
        {items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </div>
    </Provider>
  );
});

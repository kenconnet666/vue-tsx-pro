// 主题与语言：Provider 嵌套合并、响应式切换、应用级 createUi、格式化
import { afterEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '@internationalized/date';
import Decimal from 'decimal.js';
import { createApp, nextTick, ref, type App, type VNodeChild } from 'vue';
import { _component } from '@vue-tsx-pro/tsx';
import {
  createUi,
  darkTheme,
  defineTheme,
  enUS,
  lightTheme,
  Provider,
  useFormat,
  useLang,
} from '../src';
import { colors } from '../src/config/theme/tokens.stylex';

const apps: App[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});
function mount(render: () => VNodeChild, setup?: (app: App) => void) {
  const el = document.createElement('div');
  const app = createApp(_component(() => render));
  setup?.(app);
  apps.push(app);
  app.mount(el);
  return el;
}

const Texts = _component(() => {
  const lang = useLang();
  return () => (
    <i>
      {lang.confirm}/{lang.timeZone ?? '-'}/{lang.paginationTotal(3)}
    </i>
  );
});

describe('Provider', () => {
  it('没有任何配置时使用默认值（简体中文）', () => {
    expect(mount(() => <Texts />).textContent).toBe('确定/-/共 3 条');
  });

  it('嵌套时内层只覆盖写到的字段', () => {
    const el = mount(() => (
      <Provider lang={enUS}>
        <Provider lang={{ timeZone: 'Asia/Tokyo' }}>
          <Texts />
        </Provider>
      </Provider>
    ));
    expect(el.textContent).toBe('OK/Asia/Tokyo/3 items');
    expect(el.querySelector('[lang]')!.getAttribute('lang')).toBe('en-US');
  });

  it('切换语言与主题时立即更新', async () => {
    const english = ref(false);
    const dark = ref(false);
    const el = mount(() => (
      <Provider theme={dark.value ? darkTheme : lightTheme} lang={english.value ? enUS : {}}>
        <Texts />
      </Provider>
    ));
    const root = el.firstElementChild as HTMLElement;
    expect([root.dataset.theme, el.textContent]).toEqual(['light', '确定/-/共 3 条']);
    english.value = true;
    dark.value = true;
    await nextTick();
    expect([root.dataset.theme, el.textContent]).toEqual(['dark', 'OK/-/3 items']);
    expect(root.style.getPropertyValue('color-scheme')).toBe('dark');
  });

  it('defineTheme 的局部修改写成容器上的 CSS 变量', () => {
    const brand = defineTheme(lightTheme, { colors: { accent: '#e5484d' } }, { name: 'brand' });
    const el = mount(() => <Provider theme={brand}>x</Provider>);
    const root = el.firstElementChild as HTMLElement;
    const variable = String(colors.accent).slice(4, -1);
    expect(root.style.getPropertyValue(variable)).toBe('#e5484d');
    expect(root.dataset.theme).toBe('brand');
  });
});

describe('createUi', () => {
  it('应用级提供语言，主题挂在根元素上，切换后撤销旧主题', async () => {
    const theme = ref(darkTheme);
    const el = mount(
      () => <Texts />,
      (app) => app.use(createUi({ theme, lang: { confirm: '好' } })),
    );
    expect(el.textContent).toBe('好/-/共 3 条');
    expect(document.documentElement.dataset.theme).toBe('dark');
    theme.value = lightTheme;
    await nextTick();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('light');
  });
});

describe('useFormat', () => {
  const Formatted = _component(() => {
    const format = useFormat();
    return () => (
      <i>
        {format.number(1234.5)}|{format.currency(new Decimal('0.1').plus('0.2'))}|
        {format.date(new CalendarDate(2026, 10, 18), { dateStyle: 'long' })}
      </i>
    );
  });

  it('按当前语言格式化数字、金额（十进制精确）与日期', () => {
    expect(mount(() => <Formatted />).textContent).toBe('1,234.5|¥0.30|2026年10月18日');
    const english = mount(() => (
      <Provider lang={{ ...enUS, timeZone: 'UTC' }}>
        <Formatted />
      </Provider>
    ));
    expect(english.textContent).toBe('1,234.5|$0.30|October 18, 2026');
  });
});

describe('useLang', () => {
  it('展开与 Object.keys 拿到当前语言的完整字段', () => {
    let keys: string[] = [];
    const Spread = _component(() => {
      const lang = useLang();
      return () => {
        keys = Object.keys({ ...lang });
        return <i>{lang.confirm}</i>;
      };
    });
    mount(() => <Spread />);
    expect(keys).toContain('confirm');
    expect(keys).toContain('paginationTotal');
  });
});

describe('defineTheme', () => {
  it('按分组合并：未提到的 token 沿用基础主题', () => {
    const base = defineTheme(lightTheme, { colors: { accent: '#111111', danger: '#222222' } });
    const next = defineTheme(base, { colors: { accent: '#333333' }, fonts: { size: '16px' } });
    expect(next.overrides).toEqual({
      colors: { accent: '#333333', danger: '#222222' },
      fonts: { size: '16px' },
    });
    expect(base.overrides.colors?.accent).toBe('#111111');
  });
});

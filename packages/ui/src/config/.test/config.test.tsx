// 主题与语言：Provider 嵌套合并、响应式切换、应用级 createUi、组件默认值、格式化
import { afterEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '@internationalized/date';
import Decimal from 'decimal.js';
import { createApp, nextTick, ref, type App, type VNodeChild } from 'vue';
import { _component } from '@vue-tsx-pro/tsx';
import {
  createUi,
  darkTheme,
  defineLang,
  defineTheme,
  Empty,
  enUS,
  Indicator,
  lightTheme,
  Link,
  Progress,
  Provider,
  Result,
  useDefaults,
  useFormat,
  useLang,
  useMessages,
  type DataTableOptions,
  type LangMessages,
  type MessageTable,
} from '../..';
import { docsKitMessages } from '../../docs-kit';
import { colors } from '../theme/tokens.stylex';

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

describe('useDefaults', () => {
  const Probe = _component(({ density, variant, striped }: DataTableOptions) => {
    const resolved = useDefaults('DataTable', () => ({ density, variant, striped }), {
      variant: 'surface',
    });
    return () => <i>{JSON.stringify(resolved())}</i>;
  });

  it('逐项合并：显式 prop > 最近的 Provider > createUi > fallback', () => {
    const el = mount(
      () => (
        <>
          <Provider defaults={{ DataTable: { density: 'comfortable' } }}>
            <Probe variant="ghost" />
          </Provider>
          <Probe />
        </>
      ),
      (app) =>
        app.use(createUi({ defaults: { DataTable: { density: 'compact', striped: true } } })),
    );
    const [inner, outer] = [...el.querySelectorAll('i')].map((i) => JSON.parse(i.textContent!));
    expect(inner).toEqual({ density: 'comfortable', variant: 'ghost', striped: true });
    expect(outer).toEqual({ density: 'compact', variant: 'surface', striped: true });
  });

  it('没有 fallback、也没有配置的项是 undefined（如没写的 density）', () => {
    expect(mount(() => <Probe />).textContent).toBe('{"variant":"surface"}');
  });

  it('Link、Progress、Indicator、Empty、Result 读默认值：与显式写 prop 的结果相同', () => {
    const samples = (look: 'defaults' | 'explicit') => {
      const own = look === 'explicit';
      return (
        <div class={look}>
          <Link href="/a" {...(own ? { tone: 'neutral', underline: 'none' } : {})}>
            链接
          </Link>
          <Progress
            value={40}
            aria-label="进度"
            {...(own ? { tone: 'success', radius: 'none' } : {})}
          />
          <Indicator count={3} {...(own ? { tone: 'accent' } : {})}>
            <span>消息</span>
          </Indicator>
          <Empty title="空" {...(own ? { size: 'sm' } : {})} />
          <Result title="完成" {...(own ? { size: 'lg' } : {})} />
        </div>
      );
    };
    const el = mount(() => (
      <>
        <Provider
          defaults={{
            Link: { tone: 'neutral', underline: 'none' },
            Progress: { tone: 'success', radius: 'none' },
            Indicator: { tone: 'accent' },
            Empty: { size: 'sm' },
            Result: { size: 'lg' },
          }}
        >
          {samples('defaults')}
        </Provider>
        {samples('explicit')}
      </>
    ));
    const classes = (root: Element, look: string) =>
      [...root.querySelectorAll(`.${look} *`)].map((node) => node.getAttribute('class'));
    expect(classes(el, 'defaults')).toEqual(classes(el, 'explicit'));
    // 没有 Provider 时是各自的默认外观，不同于上面
    expect(
      classes(
        mount(() => samples('defaults')),
        'defaults',
      ),
    ).not.toEqual(classes(el, 'defaults'));
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

  it('数字可以缩放、带单位文字；金额不写币种时用语言的币种', () => {
    const Amounts = _component(() => {
      const format = useFormat();
      const wan = { scale: 10_000, maximumFractionDigits: 2, suffix: '万元' };
      return () => (
        <i>
          {[
            format.number(155353.2, wan),
            format.number(new Decimal('12345678901234567890.12'), { scale: 10_000 }),
            format.number('19.9', { style: 'currency' }),
            format.number(1500, { scale: 1000, suffix: 'k' }),
            format.number(30, { scale: 3, maximumFractionDigits: 0 }),
          ].join('|')}
        </i>
      );
    });
    expect(mount(() => <Amounts />).textContent).toBe(
      '15.54 万元|1,234,567,890,123,456.789|¥19.90|1.5 k|10',
    );
  });

  it('文件大小按 1000 进位取单位', () => {
    const Sizes = _component(() => {
      const format = useFormat();
      return () => <i>{[0, 999, 1_234_567].map((bytes) => format.fileSize(bytes)).join('|')}</i>;
    });
    expect(mount(() => <Sizes />).textContent).toBe('0 B|999 B|1.2 MB');
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

describe('useMessages', () => {
  const table: MessageTable<LangMessages['docsKit']> = {
    'zh-CN': { ...docsKitMessages['zh-CN'], name: '名称' },
    'en-US': { ...docsKitMessages['en-US'], name: 'Name' },
  };
  const Name = _component(() => {
    const messages = useMessages('docsKit', table);
    return () => <i>{messages.name}</i>;
  });

  it('按语言代码取；没有这种语言时先找同一语种，再用英文', () => {
    const el = mount(() => (
      <>
        <Name />
        <Provider lang={enUS}>
          <Name />
        </Provider>
        <Provider lang={{ code: 'zh-TW' }}>
          <Name />
        </Provider>
        <Provider lang={{ code: 'ja-JP' }}>
          <Name />
        </Provider>
      </>
    ));
    expect([...el.querySelectorAll('i')].map((i) => i.textContent)).toEqual([
      '名称',
      'Name',
      '名称',
      'Name',
    ]);
  });

  it('Lang.messages 覆盖表里的字段；嵌套的 Provider 按组件合并', () => {
    const el = mount(() => (
      <Provider lang={{ code: 'ja-JP', messages: { docsKit: { name: '名前' } } }}>
        <Provider lang={{ messages: { docsKit: { type: '型' } } }}>
          <Name />
        </Provider>
      </Provider>
    ));
    expect(el.textContent).toBe('名前');
    expect(
      defineLang(defineLang(enUS, { messages: { docsKit: { name: 'a' } } }), {
        messages: { docsKit: { type: 'b' } },
      }).messages?.docsKit,
    ).toEqual({ name: 'a', type: 'b' });
  });
});

describe('defineTheme', () => {
  it('按分组合并：未提到的 token 沿用基础主题', () => {
    const base = defineTheme(lightTheme, { colors: { accent: '#111111', danger: '#222222' } });
    const next = defineTheme(base, { colors: { accent: '#333333' }, fontSizes: { md: '16px' } });
    expect(next.overrides).toEqual({
      colors: { accent: '#333333', danger: '#222222' },
      fontSizes: { md: '16px' },
    });
    expect(base.overrides.colors?.accent).toBe('#111111');
  });
});

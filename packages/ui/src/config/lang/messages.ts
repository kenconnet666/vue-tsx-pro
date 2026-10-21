/**
 * 页面级组件（主题编辑器、文档站组件）自带的文案：每个组件一张表，每种语言一份，不放进 Lang。
 * 新增一种语言只翻 Lang；这些组件没有这种语言时先找同一语种（zh-TW 用 zh-CN 的），再用英文
 * （同 React Aria 各组件包自带文案的做法）。Lang.messages 里写的字段覆盖表里的：
 *
 *   createUi({ lang: { ...jaJP, messages: { docsKit: { name: '名前' } } } })
 */
import { computed } from 'vue';
import { useConfig } from '../context';
import type { LangMessages } from './lang';

/** 一张文案表：语言代码 → 这种语言的全部文案，英文必须有 */
export type MessageTable<T> = { readonly 'en-US': T } & { readonly [code: string]: T };

/**
 * 当前语言下组件的文案：`const messages = useMessages('docsKit', docsKitMessages)`。
 * 返回的对象转发到最新的语言，在渲染函数里读取即可随 Provider 切换
 */
export function useMessages<K extends keyof LangMessages>(
  name: K,
  table: MessageTable<LangMessages[K]>,
): LangMessages[K] {
  const config = useConfig();
  const messages = computed(() => {
    const { code, messages: overrides } = config.lang;
    const own = table[code] ?? sameLanguage(table, code) ?? table['en-US'];
    const override = overrides?.[name];
    return override ? { ...own, ...override } : own;
  });
  return new Proxy({} as LangMessages[K], { get: (_, key) => Reflect.get(messages.value, key) });
}

function sameLanguage<T>(table: MessageTable<T>, code: string): T | undefined {
  const language = code.split('-')[0];
  const found = Object.keys(table).find((key) => key.split('-')[0] === language);
  return found === undefined ? undefined : table[found];
}

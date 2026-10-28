// 元素 ref 的合并：JSX 里展开 css.attrs 再写 ref（或反过来）时，样式绑定的 ref 与使用方的 ref 都拿到元素
import { describe, expect, it } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import { compile } from '../src/compiler';
import { mergeJsxProps, mergeRefs } from '../src/runtime/refs';
import { attrs, create, select } from '../src/styles/runtime';

const styles = create({ row: { display: 'flex' }, hot: { color: 'red' } });

/** 挂一个元素：样式按 hot 选，使用方的 ref 写在展开的 attrs 前面或后面 */
function mount(order: 'ref-last' | 'ref-first') {
  const hot = ref(false);
  const own = ref<Element | null>(null);
  const host = document.createElement('div');
  document.body.append(host);
  createApp({
    render: () => {
      // 编译产物是 JS，交给 mergeJsxProps 的就是这个对象；类型上 attrs 的 ref 写法与 Vue 的 VNodeRef 不同，这里按普通属性对象传
      const styled = attrs(
        styles.row,
        select(() => hot.value && styles.hot),
      ) as Record<string, unknown>;
      const props =
        order === 'ref-last'
          ? mergeJsxProps(styled, { ref: own })
          : mergeJsxProps({ ref: own }, styled);
      return h('div', props);
    },
  }).mount(host);
  return { hot, own, element: host.firstElementChild! };
}

describe('mergeJsxProps', () => {
  it.each(['ref-last', 'ref-first'] as const)(
    '%s：样式绑定照常换类，使用方的 ref 也拿到元素',
    async (order) => {
      const { hot, own, element } = mount(order);
      expect(own.value).toBe(element);
      hot.value = true;
      await nextTick();
      await nextTick();
      expect(element.className).toBe(attrs(styles.row, styles.hot).class);
    },
  );

  it('只有一层带 ref、或有字符串 ref 时与 Vue 的 mergeProps 相同', () => {
    const one = () => {};
    expect(mergeJsxProps({ ref: one }, { id: 'a' }).ref).toBe(one);
    expect(mergeJsxProps({ ref: one }, { ref: 'name' }).ref).toBe('name');
  });

  it('mergeRefs：回调与 Ref 都拿到元素，卸载时都拿到 null', () => {
    const seen: unknown[] = [];
    const box = ref<unknown>(undefined);
    const merged = mergeRefs([(element) => seen.push(element), box]) as (element: unknown) => void;
    merged('el');
    merged(null);
    expect(seen).toEqual(['el', null]);
    expect(box.value).toBeNull();
  });
});

it('编译：Vue JSX 生成的 mergeProps 换成从本包导入的 mergeJsxProps，本地名不变', async () => {
  const result = await compile(
    `import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
const styles = css.create({ row: { display: 'flex' } });
export const X = () => <div {...css.attrs(styles.row)} ref={(e) => e} />;`,
    { filename: '/src/X.tsx', runes: false },
  );
  expect(result!.code).toContain(
    'import { mergeJsxProps as _mergeProps } from "@zerodep-dev/vue-tsx-pro-tsx"',
  );
  expect(result!.code).not.toMatch(/mergeProps as _mergeProps[^\n]*from "vue"/);
});

// 开发模式下元素上的样式绑定更新记到 devtools 的时间线：记下所在组件、换了什么类、改了哪些变量；挂载时不记
import { describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

const recorded: { name?: string; change: unknown }[] = [];
vi.mock('../src/styles/devtools', () => ({
  DEV: true,
  recordBindingUpdate: (
    instance: { type: { name?: string } } | null,
    _element: Element,
    change: unknown,
  ) => recorded.push({ name: instance?.type.name, change }),
}));

const { attrs, bind, create, select } = await import('../src/styles/runtime');

describe('devtools 时间线', () => {
  it('select 换类、bind 改变量各记一条，带上组件名；挂载与没变的不记', async () => {
    const styles = create({
      base: { display: 'block' },
      hot: { color: 'red' },
      bar: (width: number) => ({ width }),
    });
    // 先让 width 转成变量：之后只改变量、不换类
    attrs(styles.bar(1));
    attrs(styles.bar(2));
    const hot = ref(false);
    const width = ref(10);
    const host = document.createElement('div');
    createApp(
      defineComponent({
        name: 'Row',
        render: () =>
          h(
            'div',
            attrs(
              styles.base,
              select(() => hot.value && styles.hot),
              bind(styles.bar, () => [width.value] as [number]),
            ),
          ),
      }),
    ).mount(host);
    expect(recorded).toEqual([]);

    hot.value = true;
    await nextTick();
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ name: 'Row', change: { variables: {} } });
    const [before, after] = (recorded[0]!.change as { className: [string, string] }).className;
    expect(before).not.toBe(after);

    width.value = 20;
    await nextTick();
    expect(recorded[1]).toEqual({ name: 'Row', change: { variables: { '--x-width': '20px' } } });
  });
});

// 小程序渲染的性能基准（17.2.7）：1000 行的单元格列表，首屏、改一行、按住一行时 setData 的次数与体积。
// 用页面选项直接挂（同测试工具），自己记下每次 setData；数字打印出来，并按预算断言，变差时测试失败
import { pageOptions } from '@zerodep-dev/vue-tsx-pro-mini';
import { applySetData } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { Cell, CellGroup } from '../display/Cell';

type Data = Record<string, unknown>;

/** 挂一个页面，记下每次 setData 的体积（JSON 字符数） */
function mount(component: ReturnType<typeof defineComponent>) {
  const options = pageOptions(component);
  const sizes: number[] = [];
  const page = {
    data: structuredClone(options.data) as Data,
    setData(payload: Data, callback?: () => void) {
      sizes.push(JSON.stringify(payload).length);
      applySetData(page.data, payload);
      callback?.();
    },
  };
  const started = performance.now();
  options.onLoad.call(page, {});
  return {
    started,
    sizes,
    options,
    page,
    async settle() {
      for (let round = 0; round < 3; round++) {
        await nextTick();
        await Promise.resolve();
      }
    },
    /** 从这一刻起的 setData */
    take() {
      return sizes.splice(0);
    },
  };
}

const kb = (chars: number) => `${(chars / 1024).toFixed(1)} KB`;

describe('setData 基准：1000 行单元格', () => {
  it('首屏、改一行、按住一行', async () => {
    const rows = ref(Array.from({ length: 1000 }, (_, index) => `第 ${index} 行`));
    const Demo = defineComponent(() => () => (
      <CellGroup>
        {rows.value.map((title, index) => (
          <Cell title={title} value={index % 3 ? '已发货' : '待付款'} arrow onClick={() => {}} />
        ))}
      </CellGroup>
    ));
    const view = mount(Demo);
    await view.settle();
    const firstMs = performance.now() - view.started;
    const first = view.take();

    rows.value[500] = '改过的第 500 行';
    await view.settle();
    const update = view.take();

    // 按住第 10 行：:active 的样式只改它（与祖先）
    const findCell = (node: Data): string | undefined => {
      for (const child of (node.cn as Data[] | undefined) ?? []) {
        if (
          JSON.stringify(child).includes('"v":"第 10 行"') &&
          ((view.page.data.ss as Record<string, string>)[child.st as string] ?? '').includes(
            'min-height',
          )
        )
          return child.s as string;
        const found = findCell(child);
        if (found) return found;
      }
      return undefined;
    };
    const sid = findCell(view.page.data.root as Data)!;
    view.options.eh.call(view.page, { type: 'touchstart', currentTarget: { dataset: { s: sid } } });
    await view.settle();
    const press = view.take();

    // 体积的构成：行内样式占多少、有几种不同的样式
    // 节点的 st 是样式字典（ss）的编号
    const dictionary = view.page.data.ss as Record<string, string>;
    const styles: string[] = [];
    const collect = (node: Data) => {
      if (typeof node.st === 'string') styles.push(dictionary[node.st]!);
      for (const child of (node.cn as Data[] | undefined) ?? []) collect(child);
    };
    collect(view.page.data.root as Data);
    console.log(
      `样式：${styles.length} 个节点带行内样式，展开共 ${kb(styles.join('').length)}；字典里 ${Object.keys(dictionary).length} 种，${kb(JSON.stringify(dictionary).length)}`,
    );
    console.log(
      [
        `首屏：${first.length} 次 setData，${kb(first.reduce((a, b) => a + b, 0))}，${firstMs.toFixed(0)} ms（Node 里）`,
        `改一行：${update.length} 次，${kb(update.reduce((a, b) => a + b, 0))}`,
        `按住一行：${press.length} 次，${kb(press.reduce((a, b) => a + b, 0))}`,
      ].join('\n'),
    );
    // 预算：首屏一次发完、不到 384 KB（微信单次 setData 的上限是 1 MB；样式字典之前是 1.9 MB）；改一行只发那一行的文字；
    // 按住只发按着的几个节点的样式编号
    expect(first).toHaveLength(1);
    expect(first[0]).toBeLessThan(384 * 1024);
    expect(update.reduce((a, b) => a + b, 0)).toBeLessThan(200);
    expect(press.reduce((a, b) => a + b, 0)).toBeLessThan(1024);
  });
});

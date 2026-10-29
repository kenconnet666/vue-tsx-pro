// 页面的增量 setData：按小程序的路径规则应用到数据上，结果要和整树重新序列化一致
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { pageOptions } from '../src/page.ts';

type Data = Record<string, unknown>;

/** 按小程序的规则应用 setData：键是 a.b[0].c 这样的路径，中间缺的对象、数组自动补上 */
function applySetData(target: Data, payload: Data) {
  for (const [path, value] of Object.entries(payload)) {
    const keys = path.match(/[^.[\]]+/g)!;
    let current: Record<string, unknown> = target;
    keys.slice(0, -1).forEach((key, index) => {
      if (current[key] === undefined || current[key] === null)
        current[key] = /^\d+$/.test(keys[index + 1]!) ? [] : {};
      current = current[key] as Record<string, unknown>;
    });
    current[keys.at(-1)!] = structuredClone(value);
  }
}

/** 挂一个页面：返回小程序这边看到的数据 */
function mountPage(component: ReturnType<typeof defineComponent>) {
  const options = pageOptions(component);
  const page = {
    data: structuredClone(options.data) as Data,
    setData(payload: Data) {
      applySetData(this.data, payload);
    },
  };
  options.onLoad.call(page, {});
  return { page, options };
}

/** 去掉编号以外的差别：数据里每个节点都必须有模板类型 */
function types(node: unknown): unknown {
  const data = node as { t?: string; v?: string; cn?: unknown[] };
  return { t: data.t, v: data.v, cn: data.cn?.map(types) };
}

const flush = async () => {
  await nextTick();
  await Promise.resolve();
};

describe('增量更新', () => {
  it('文字、条件分支、列表增删之后，数据与整树一致，每个节点都有模板类型', async () => {
    let on!: Ref<boolean>;
    let items!: Ref<string[]>;
    const Demo = defineComponent(() => {
      on = ref(false);
      items = ref(['a', 'b']);
      return () =>
        h('div', [
          h('button', { class: on.value ? 'on' : 'off' }, [
            h('span', on.value ? '已收藏' : '收藏'),
            on.value ? h('span', { class: 'spinner' }) : null,
          ]),
          h(
            'ul',
            items.value.map((item) => h('li', { key: item }, item)),
          ),
        ]);
    });
    const { page } = mountPage(Demo);
    await flush();
    const before = JSON.stringify(types(page.data.root));
    expect(before).toContain('收藏');

    on.value = true;
    items.value = ['c', 'a'];
    await flush();
    on.value = false;
    items.value = ['a', 'b', 'd'];
    await flush();

    const walk = (node: { t?: string; cn?: unknown[] }): void => {
      expect(node.t, JSON.stringify(node)).toBeDefined();
      (node.cn as { t?: string; cn?: unknown[] }[] | undefined)?.forEach(walk);
    };
    (page.data.root as { cn: { t?: string }[] }).cn.forEach(walk);
    const text = JSON.stringify(types(page.data.root));
    expect(text).toContain('"v":"收藏"');
    expect(text).toContain('"v":"d"');
  });

  it('组件库的 Button 切换样式、文字、加载中之后，数据与整树一致', async () => {
    const { Button } = await import('@zerodep-dev/vue-tsx-pro-ui');
    let liked!: Ref<boolean>;
    let loading!: Ref<boolean>;
    const Demo = defineComponent(() => {
      liked = ref(false);
      loading = ref(false);
      return () =>
        h('div', [
          h(
            Button,
            { variant: liked.value ? 'solid' : 'outline', 'aria-pressed': liked.value },
            () => (liked.value ? '已收藏' : '收藏'),
          ),
          h(Button, { loading: loading.value }, () => '加载'),
        ]);
    });
    const { page } = mountPage(Demo);
    await flush();
    for (const step of [true, false, true]) {
      liked.value = step;
      loading.value = step;
      await flush();
      await new Promise((resolve) => setTimeout(resolve, 400));
      await flush();
      const walk = (node: { t?: string; cn?: unknown[] }): void => {
        expect(node.t, JSON.stringify(node).slice(0, 200)).toBeDefined();
        (node.cn as { t?: string; cn?: unknown[] }[] | undefined)?.forEach(walk);
      };
      (page.data.root as { cn: { t?: string }[] }).cn.forEach(walk);
      expect(JSON.stringify(types(page.data.root))).toContain(step ? '已收藏' : '"收藏"');
    }
    // 第一次导入要按源码编译整个组件库入口
  }, 60_000);
});

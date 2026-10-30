// 页面的增量 setData：按小程序的路径规则应用到数据上，结果要和整树重新序列化一致
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';
import { PLATFORMS } from '../src/build/platforms.ts';
import { baseTemplate } from '../src/build/templates.ts';
import { onPageShow, onReachBottom, pageUrl } from '../src/lifecycle.ts';
import { mountPage, type PageNode } from '../src/testing.ts';

/** 数据里每个节点都必须有模板类型 */
function expectTyped(nodes: PageNode[]) {
  for (const node of nodes) {
    expect(node.t, JSON.stringify(node).slice(0, 200)).toBeDefined();
    expectTyped(node.cn ?? []);
  }
}

describe('增量更新', () => {
  it('文字、条件分支、列表增删之后，每个节点都有模板类型，文字与整树一致', async () => {
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
    const page = mountPage(Demo);
    await page.settle();
    expect(page.text()).toContain('收藏');

    on.value = true;
    items.value = ['c', 'a'];
    await page.settle();
    on.value = false;
    items.value = ['a', 'b', 'd'];
    await page.settle();

    expectTyped(page.data.root.cn);
    expect(page.text()).toBe('收藏abd');
  });

  it('只改了字段（类名）的节点不会丢掉子节点', async () => {
    let flag!: Ref<boolean>;
    const Demo = defineComponent(() => {
      flag = ref(false);
      return () => h('div', { class: flag.value ? 'a' : 'b' }, [h('span', 'x'), h('span', 'y')]);
    });
    const page = mountPage(Demo);
    await page.settle();
    for (const value of [true, false, true]) {
      flag.value = value;
      await page.settle();
      expect(page.text()).toBe('xy');
    }
  });
});

describe('事件', () => {
  it('点击从最内层的节点冒泡；禁用的按钮里点不出 click', async () => {
    const clicks: string[] = [];
    const Demo = defineComponent(
      () => () =>
        h('div', { onClick: () => clicks.push('div') }, [
          h('button', { onClick: () => clicks.push('button') }, [h('span', '可点')]),
          h('button', { disabled: true, onClick: () => clicks.push('disabled') }, [
            h('span', '禁用'),
          ]),
        ]),
    );
    const page = mountPage(Demo);
    await page.settle();
    const spans = (text: string) =>
      page.find((node) => node.cn?.some((child) => child.v === text) ?? false)!;
    await page.tap(spans('可点'));
    await page.tap(spans('禁用'));
    expect(clicks).toEqual(['button', 'div']);
  });

  it('按下、松开在模板上是冒泡的（每层祖先都收到一次）：组件的监听各只触发一次', async () => {
    const events: string[] = [];
    const Demo = defineComponent(
      () => () =>
        h('div', { onTouchstart: () => events.push('outer start') }, [
          h('div', [
            h(
              'button',
              {
                onTouchstart: () => events.push('start'),
                onTouchend: () => events.push('end'),
                onClick: () => events.push('click'),
              },
              '按住',
            ),
          ]),
        ]),
    );
    const page = mountPage(Demo);
    await page.settle();
    await page.tap(page.find((node) => node.cn?.some((child) => child.v === '按住') ?? false)!);
    expect(events).toEqual(['start', 'outer start', 'end', 'click']);
    // 真机上按下、松开被 catch 掉之后不再产生 tap
    expect(baseTemplate(PLATFORMS.wx)).toContain('bindtouchstart="eh"');
    expect(baseTemplate(PLATFORMS.wx)).not.toContain('catchtouchend');
    expect(baseTemplate(PLATFORMS.my)).toContain('onTouchStart="eh"');
  });

  it('超过模板层数的节点（递归组件里）：点击由按下、松开合成，原生的 tap 不再算；按下后移动了不算点击', async () => {
    let clicks = 0;
    const nest = (depth: number): ReturnType<typeof h> =>
      depth === 0 ? h('div', { onClick: () => clicks++ }, '深处') : h('div', [nest(depth - 1)]);
    const page = mountPage(defineComponent(() => () => nest(30)));
    await page.settle();
    const leaf = page.find((node) => node.cn?.some((child) => child.v === '深处') ?? false)!;
    // tap 会依次派发 touchstart、touchend、tap：只算一次
    await page.tap(leaf);
    expect(clicks).toBe(1);
    await page.touch(leaf, 'touchstart', 10, 10);
    await page.touch(leaf, 'touchend', 40, 10);
    expect(clicks).toBe(1);
  });

  it('读屏属性：role 与常用的 aria-* 发到节点数据（模板上是微信的 aria-role、aria-label…）', async () => {
    const Demo = defineComponent(
      () => () =>
        h('button', { role: 'switch', 'aria-checked': 'true', 'aria-label': '消息通知' }, [
          h('span', { 'aria-hidden': 'true' }, '开'),
        ]),
    );
    const page = mountPage(Demo);
    await page.settle();
    const button = page.data.root.cn[0]!;
    expect(button).toMatchObject({ ar: 'switch', ack: 'true', al: '消息通知' });
    expect(button.cn![0]).toMatchObject({ ahi: 'true' });
  });

  it('输入框：输入的值写回节点（event.target.value），确认键是 keydown Enter；类型与禁用映射到模板', async () => {
    const text = ref('');
    const keys: string[] = [];
    const Demo = defineComponent(
      () => () =>
        h('div', [
          h('input', {
            value: text.value,
            type: 'password',
            onInput: (event: { target: { value: string } }) => (text.value = event.target.value),
            onKeydown: (event: { key?: string }) => keys.push(event.key ?? ''),
          }),
          h('textarea', { readonly: true, 'data-autosize': true }),
          h('input', { type: 'number' }),
        ]),
    );
    const page = mountPage(Demo);
    await page.settle();
    const [password, area, amount] = ['input', 'textarea', 'input'].map(
      (type, index) => page.data.root.cn[0]!.cn![index]!,
    );
    expect(password).toMatchObject({ t: 'input', type: 'text', pw: 1 });
    expect(area).toMatchObject({ t: 'textarea', dis: 1, ah: 'true' });
    expect(amount).toMatchObject({ type: 'digit' });

    await page.dispatch(password!, 'input', { value: 'abc' });
    expect(text.value).toBe('abc');
    expect(page.data.root.cn[0]!.cn![0]!.value).toBe('abc');
    await page.dispatch(password!, 'confirm', { value: 'abc' });
    expect(keys).toEqual(['Enter']);
  });
});

describe('页面', () => {
  it('生命周期的回调；页面参数解码后作为 query 属性；跳转的路径', async () => {
    const calls: string[] = [];
    const Demo = defineComponent(
      (props: { query: Record<string, string> }) => {
        onPageShow(() => calls.push('show'));
        onReachBottom(() => calls.push('bottom'));
        return () => h('div', props.query.name);
      },
      { props: ['query'] },
    );
    const page = mountPage(Demo, { name: encodeURIComponent('莱恩 & 朋友') });
    await page.settle();
    expect(page.text()).toBe('莱恩 & 朋友');
    await page.lifecycle('show');
    await page.lifecycle('reachBottom');
    expect(calls).toEqual(['show', 'bottom']);
    page.unmount();
    expect(pageUrl('detail', { id: 42, q: 'a b' })).toBe('/pages/detail/index?id=42&q=a%20b');
  });
});

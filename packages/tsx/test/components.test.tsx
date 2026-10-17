import { afterEach, describe, it, expect } from 'vitest';
import { createApp, nextTick, ref } from 'vue';
import type { NodeChild } from 'vue-jsx';
import * as stylex from '@stylexjs/stylex';
import { _component } from '../src';
import { Toggle } from './fixtures/Toggle';
import { Card, cardSetupCount } from './fixtures/Card';
import { TextField } from './fixtures/TextField';

/** 把一个 render 函数挂载到新容器上 */
const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});
function mount(render: () => NodeChild) {
  const el = document.createElement('div');
  const app = createApp(_component(() => render));
  apps.push(app);
  app.mount(el);
  return el;
}

const pressed = (btn: Element) => btn.getAttribute('aria-pressed');

describe('双向绑定（_bindable + v-model）', () => {
  it('不绑定 checked 时，每个实例拥有独立的本地状态', async () => {
    const el = mount(() => (
      <>
        <Toggle>a</Toggle>
        <Toggle>b</Toggle>
      </>
    ));
    const [a, b] = el.querySelectorAll('button');
    a.click();
    await nextTick();
    expect(pressed(a)).toBe('true');
    expect(pressed(b)).toBe('false');
  });

  it('子组件写入后父级同步更新', async () => {
    const on = ref(false);
    const el = mount(() => (
      <>
        <Toggle v-model:checked={on.value}>x</Toggle>
        <p>{String(on.value)}</p>
      </>
    ));
    el.querySelector('button')!.click();
    await nextTick();
    expect(on.value).toBe(true);
    expect(el.querySelector('p')!.textContent).toBe('true');
  });

  it('普通值 prop 保持响应；回调 prop 取代 emit', async () => {
    const busy = ref(true);
    const got: boolean[] = [];
    const el = mount(() => (
      <Toggle disabled={busy.value} onChange={(v) => got.push(v)}>
        x
      </Toggle>
    ));
    const btn = el.querySelector('button')!;
    expect(btn.disabled).toBe(true);
    busy.value = false;
    await nextTick();
    expect(btn.disabled).toBe(false);
    btn.click();
    await nextTick();
    expect(got).toEqual([true]);
  });
});

describe('children 与具名内容', () => {
  it('默认插槽映射为 children；setup 只执行一次，内容随父级更新', async () => {
    const text = ref('hi'),
      title = ref('T');
    const before = cardSetupCount;
    const el = mount(() => <Card title={title.value}>{text.value}</Card>);
    expect(el.querySelector('.body')!.textContent).toBe('hi');
    text.value = 'yo';
    title.value = 'U';
    await nextTick();
    expect(el.querySelector('.body')!.textContent).toBe('yo');
    expect(el.querySelector('h2')!.textContent).toBe('U');
    expect(cardSetupCount - before).toBe(1);
  });

  it('具名内容直接以 JSX 作为 prop 传入', async () => {
    const n = ref(1);
    const el = mount(() => <Card header={<b>{n.value}</b>}>x</Card>);
    n.value = 2;
    await nextTick();
    expect(el.querySelector('h2')!.innerHTML).toBe('<b>2</b>');
  });
});

describe('原生输入', () => {
  it('组件内原生 v-model 经 v-model:value 写回父级；未声明属性经 ...rest 透传', async () => {
    const name = ref('a');
    const el = mount(() => (
      <>
        <TextField v-model:value={name.value} aria-label="名字" />
        <p>{name.value}</p>
      </>
    ));
    const input = el.querySelector('input')!;
    expect(input.value).toBe('a');
    expect(input.getAttribute('aria-label')).toBe('名字');
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(name.value).toBe('abc');
    expect(el.querySelector('p')!.textContent).toBe('abc');
    name.value = 'z';
    await nextTick();
    expect(input.value).toBe('z');
  });
});

describe('StyleX', () => {
  const page = stylex.create({
    danger: {
      color: { default: 'crimson', ':hover': 'white' },
      backgroundColor: { default: 'transparent', ':hover': 'crimson' },
    },
  });

  it('外部 sx 按属性整体替换内部样式，不残留旧 :hover', () => {
    const el = mount(() => (
      <>
        <Toggle>a</Toggle>
        <Toggle sx={page.danger}>b</Toggle>
      </>
    ));
    const [a, b] = el.querySelectorAll('button');
    const only = (x: string[], y: string[]) => x.filter((c) => !y.includes(c));
    const aOnly = only(a.className.split(' '), b.className.split(' '));
    const bOnly = only(b.className.split(' '), a.className.split(' '));
    // a 独有 = base 的 color / :hover color / backgroundColor / :hover backgroundColor 被替换掉的类
    // b 独有 = danger 对应的类；数量一致说明是逐属性替换而非叠加
    expect(aOnly.length).toBeGreaterThan(0);
    expect(bOnly.length).toBe(aOnly.length);
  });

  it('动态值编译为 CSS 变量与行内 style', () => {
    const el = mount(() => <Card width={120}>x</Card>);
    expect(el.querySelector('section')!.getAttribute('style')).toContain('120px');
  });
});

// 类型测试：由 tsc 检查。@ts-expect-error 标注的行如果没有报错，tsc 会失败
import { ref, Transition } from 'vue';
import { Toggle } from './fixtures/Toggle';
import { Card } from './fixtures/Card';
import { List } from './fixtures/List';

const on = ref(false);
const text = ref('');

// 双向绑定与普通 prop
export const validModel = (
  <Toggle _checked={on.value} disabled onChange={(value) => value.valueOf()}>
    x
  </Toggle>
);
export const validOneWay = <Toggle _checked={true}>x</Toggle>;
// @ts-expect-error _bind 的值按 prop 类型检查：checked 需要 boolean
export const invalidModel = <Toggle _checked={text.value} />;
export const nativeModel = <input _value={_bind.trim(text.value)} />;

// children 与具名内容
export const validChildren = <Card title="t">正文</Card>;
export const validContent = <Card header={<b>h</b>} />;
// @ts-expect-error title 是 string
export const invalidTitle = <Card title={1} />;

// Vue 内置组件的子节点照常走默认插槽
export const transition = (
  <Transition name="fade">
    <p>x</p>
  </Transition>
);

// 原生事件的 currentTarget 是具体的元素类型
export const typedEvent = <input onInput={(event) => event.currentTarget.value.trim()} />;
// @ts-expect-error currentTarget 是 HTMLInputElement，没有 href
export const wrongEvent = <input onInput={(event) => event.currentTarget.href} />;

// children 渲染函数：参数类型从 items 推导
export const validRender = <List items={[{ id: 1 }]}>{(item) => <i>{item.id.toFixed()}</i>}</List>;
// @ts-expect-error item 被推导为 { id: number }，没有 name
export const invalidRender = <List items={[{ id: 1 }]}>{(item) => <i>{item.name}</i>}</List>;

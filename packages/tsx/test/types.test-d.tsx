// 类型测试：由 tsc 检查。@ts-expect-error 标注的行如果没有报错，tsc 会失败
import { Switch } from './fixtures/Switch';

let on = _state(false);
let label = _state('x');
const size = _derived(label.length);

export const ok = (
  <Switch v-model:checked={on} disabled={size > 3}>
    {label}
  </Switch>
);
on = true;

// @ts-expect-error v-model:checked 需要 boolean
export const wrongModel = <Switch v-model:checked={label} />;

// @ts-expect-error label 是 string
label = 1;

// @ts-expect-error disabled 是 boolean
export const wrongProp = <Switch disabled={'yes'} />;

// _from 解构只接受 Ref 属性；函数等非 Ref 属性变成 never，需要从原对象单独解构
declare function useCounter(): { count: import('vue').Ref<number>; increment: () => void };
const { count, increment } = _from(useCounter());
export const doubled: number = count * 2;
// @ts-expect-error increment 不是 Ref，应从 useCounter() 单独解构
increment();

// 泛型组件：类型参数从属性推导，并传到回调参数
import type { VNodeChild } from 'vue';
import { _component } from '../src';
const List = _component(
  <T,>({ items, renderItem }: { items: T[]; renderItem: (item: T) => VNodeChild }) =>
    () => <ul>{items.map(renderItem)}</ul>,
);
export const typedList = (
  <List items={[{ id: 1 }]} renderItem={(item) => <li>{item.id.toFixed()}</li>} />
);
// @ts-expect-error item 被推导为 { id: number }，没有 name
export const wrongField = <List items={[{ id: 1 }]} renderItem={(item) => <li>{item.name}</li>} />;

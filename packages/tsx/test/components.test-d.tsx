// 类型测试：由 tsc 检查。@ts-expect-error 标注的行如果没有报错，tsc 会失败
import { ref } from 'vue';
import { _component } from '../src';
import { Toggle } from './fixtures/Toggle';
import { Card } from './fixtures/Card';

const on = ref(false);

// 双向绑定与普通 prop
export const validModel = (
  <Toggle v-model:checked={on.value} disabled onChange={(value) => value.valueOf()}>
    x
  </Toggle>
);
export const validOneWay = <Toggle checked={true}>x</Toggle>;
// @ts-expect-error v-model:checked 需要 boolean
export const invalidModel = <Toggle v-model:checked={'x'} />;

// children 与具名内容
export const validChildren = <Card title="t">正文</Card>;
export const validContent = <Card header={<b>h</b>} />;
// @ts-expect-error title 是 string
export const invalidTitle = <Card title={1} />;

// 没有用 _bindable 的普通 prop 也能写 v-model:K（父级会收到 update 事件，子组件不写回时等同单向）
const Plain = _component(({ checked = false }: { checked?: boolean }) => () => <i>{checked}</i>);
export const plainModel = <Plain v-model:checked={on.value} />;
// @ts-expect-error v-model:checked 保持 prop 的 boolean 类型
export const invalidPlainModel = <Plain v-model:checked={'x'} />;
export const nativeModel = <input v-model={on.value} />;

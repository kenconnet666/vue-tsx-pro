import { computed, readonly, ref, toRef } from 'vue';
import { component } from '../src';
import { Toggle } from './fixtures/Toggle';
import { Card } from './fixtures/Card';

const on = ref(false);
export const validRef = <Toggle checked={on} disabled onChange={(value) => value.valueOf()}>x</Toggle>;
export const validChildren = <Card title="t">正文</Card>;
export const validContent = <Card header={<b>h</b>} />;
// @ts-expect-error checked requires a Ref.
export const invalidRef = <Toggle checked={true} />;
// @ts-expect-error checked requires a boolean Ref.
export const invalidRefValue = <Toggle checked={ref('x')} />;
// @ts-expect-error title requires a string.
export const invalidTitle = <Card title={1} />;

// TypeScript structural assignability does not reject these read-only Ref sources.
export const readonlyComputed = <Toggle checked={computed(() => true)} />;
export const readonlyProxy = <Toggle checked={readonly(on)} />;
export const readonlyGetter = <Toggle checked={toRef(() => on.value)} />;

const Plain = component(({ checked = false }: { checked?: boolean }) => () => <i>{checked}</i>);
export const plainModel = <Plain v-model:checked={on.value} />;
// @ts-expect-error The model prop retains its boolean type.
export const invalidPlainModel = <Plain v-model:checked={'x'} />;
export const nativeModel = <input v-model={on.value} />;

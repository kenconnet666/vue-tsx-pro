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

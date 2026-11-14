// 类型：组件的可绑定属性只有它自己声明的那个——Switch、Checkbox 是 _checked，写成 _value 报错（之前能通过，开关却不跟状态走）
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
import { TextField } from '../TextField';

export const right = (on: boolean, text: string) => (
  <>
    <Switch _checked={on} />
    <Checkbox _checked={on} />
    <TextField _value={text} />
  </>
);

export const wrong = (on: boolean) => (
  <>
    {/* @ts-expect-error Switch 的绑定是 _checked */}
    <Switch _value={on} />
    {/* @ts-expect-error Checkbox 的绑定是 _checked */}
    <Checkbox _value={on} />
    {/* @ts-expect-error TextField 的绑定是 _value */}
    <TextField _checked={on} />
  </>
);

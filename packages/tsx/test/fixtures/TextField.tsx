import { _component } from '../../src';

interface TextFieldProps {
  /** 输入值：父级写 v-model:value 即双向同步，不绑定时作为组件本地状态 */
  value?: string;
  placeholder?: string;
}

export const TextField = _component(
  ({ value = _bindable(''), placeholder = '', ...rest }: TextFieldProps) => {
    // ...rest 由宏转换为 useAttrs()：aria-*、id、name 等未声明属性显式透传到 input
    // v-model 复用 Vue 的原生输入处理（输入法组合、checkbox/radio/select 等）
    return () => <input {...rest} placeholder={placeholder} v-model={value} />;
  },
);

import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';

interface NameFieldProps {
  /** 双向绑定：父级写 _value={x} */
  _value?: string;
}

/** 演示双向绑定的最小组件 */
export const NameField = _component(({ _value: value = _bindable('') }: NameFieldProps) => {
  return () => <input class="name-field" _value={value} />;
});

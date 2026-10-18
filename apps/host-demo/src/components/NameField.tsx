import { _component } from '@vue-tsx-pro/tsx';

interface NameFieldProps {
  /** 双向绑定：父级写 value={_bind(x)} */
  value?: string;
}

/** 演示双向绑定的最小组件 */
export const NameField = _component(({ value = _bindable('') }: NameFieldProps) => {
  return () => <input class="name-field" value={_bind(value)} />;
});

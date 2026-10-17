import { _component } from '@vue-tsx-pro/tsx';

interface NameFieldProps {
  /** 双向绑定：父级写 v-model:value */
  value?: string;
}

export const NameField = _component(({ value = _bindable('') }: NameFieldProps) => {
  return () => <input class="name-field" v-model={value} />;
});

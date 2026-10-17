import type { NodeChild } from 'vue-jsx';
import { component } from '../../src';

interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  children?: NodeChild;
}

export const Switch = component(
  ({ checked = _bindable(false), disabled = false, onChange, children }: SwitchProps) => {
    // 写起来就是普通变量；编译后是 defineModel 返回的 Ref
    function toggle() {
      if (disabled) return;
      checked = !checked;
      onChange?.(checked); // 同步读到的是新值
    }

    return () => (
      <button aria-pressed={checked} disabled={disabled} onClick={toggle}>
        {children}
      </button>
    );
  },
);

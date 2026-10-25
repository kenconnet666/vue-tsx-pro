import * as css from '@vue-tsx-pro/tsx/styles';
import type { SxStyles } from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { _component } from '../../src';

const styles = css.create({
  base: {
    // 布局
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5em',

    // 尺寸 / 间距
    paddingBlock: '0.5em',
    paddingInline: '1em',

    // 外观：默认描边按钮，悬停时反色
    color: { default: 'navy', ':hover': 'white' },
    backgroundColor: { default: 'transparent', ':hover': 'navy' },
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'navy',
  },
  // 选中态覆盖背景与文字；写在 base 之后，同属性后者生效
  on: {
    color: 'white',
    backgroundColor: 'navy',
  },
});

interface ToggleProps {
  /** 双向绑定：父级写 _checked={x}，不绑定时作为组件本地状态 */
  _checked?: boolean;
  /** 单向配置：普通值即可，父级传 busy.value 也保持响应 */
  disabled?: boolean;
  /** 通知：普通函数 prop，取代 emit */
  onChange?: (checked: boolean) => void;
  /** 外部样式覆盖，取代 class 透传 */
  sx?: SxStyles;
  /** 内容：默认插槽映射而来 */
  children?: VNodeChild;
}

export const Toggle = _component(
  ({
    _checked: checked = _bindable(false),
    disabled = false,
    onChange,
    sx,
    children,
  }: ToggleProps) => {
    // 这里的代码只在创建时执行一次
    function toggle() {
      if (disabled) return;
      checked = !checked;
      onChange?.(checked);
    }

    // 返回的函数是 render，每次依赖变化都会重新执行
    return () => (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        {...css.attrs(styles.base, checked && styles.on, sx)}
        onClick={toggle}
      >
        {children}
      </button>
    );
  },
);

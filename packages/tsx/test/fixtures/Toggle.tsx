import { ref, type Ref } from 'vue'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { NodeChild } from 'vue-jsx'
import { component } from '../../src'

const styles = stylex.create({
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
})

interface ToggleProps {
  /** 共享可写状态：直接传父级的 Ref，组件内直接改 .value */
  checked?: Ref<boolean>
  /** 单向配置：普通值即可，父级传 busy.value 也保持响应 */
  disabled?: boolean
  /** 通知：普通函数 prop，取代 emit */
  onChange?: (checked: boolean) => void
  /** 外部样式覆盖，取代 class 透传 */
  sx?: StyleXStyles
  /** 内容：默认插槽映射而来 */
  children?: NodeChild
}

export const Toggle = component(
  ({ checked = ref(false), disabled = false, onChange, sx, children }: ToggleProps) => {
    // ↑ 解构默认值 ref(false)：未传入时每个实例拥有自己的 Ref（需宏补丁，见 README）

    // 这里的代码只在创建时执行一次
    function toggle() {
      if (disabled) return
      checked.value = !checked.value
      onChange?.(checked.value)
    }

    // 返回的函数是 render，每次依赖变化都会重新执行
    return () => (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked.value}
        {...stylex.attrs(styles.base, checked.value && styles.on, sx)}
        onClick={toggle}
      >
        {children}
      </button>
    )
  },
)

/**
 * 开关：两种状态之间切换，立刻生效（消息通知、深色模式）。要提交了才生效的选项用 Checkbox。
 *
 *   <Switch _checked={notify} aria-label="消息通知" />
 *   <Switch _checked={autoRenew} loading={saving} onChange={(on) => save(on)} />
 *
 * 大小随所在文字（em），整体缩放写 sx 的 fontSize。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Loading } from '../feedback/Loading';
import { useForm } from './context';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';

/** 角色与状态由组件管理 */
export type SwitchManaged = 'role' | 'aria-checked' | 'type' | 'disabled';

/** 未声明的属性落到按钮上 */
export interface SwitchProps extends Omit<PartProps<'button', SwitchManaged>, 'onChange'> {
  /** 是否打开；双向绑定写 `_checked={x}` */
  _checked?: boolean;
  /**
   * 打开时的色调
   * @default 'accent'
   */
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  /** 加载中：圆点里转圈，不能切换 */
  loading?: boolean;
  /** 禁用；在 Form 里时随 Form */
  disabled?: boolean;
  /** 切换了 */
  onChange?: (checked: boolean) => void;
  /** 圆点的部件属性 */
  propsThumb?: PartProps<'span'>;
}

/** Switch 的样式：root、各色调、thumb、spinner */
export const switchStyles = css.create({
  root: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'inline-block',
    flex: 'none',
    width: '3.1em',
    height: '1.85em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: '_full',
    verticalAlign: 'middle',
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
    opacity: { default: 1, '[data-disabled]': '_disabled' },
    transitionProperty: 'background-color',
    transitionDuration: '_md',
  },
  accent: { backgroundColor: { default: '_fillActive', '[aria-checked="true"]': '_accent' } },
  success: { backgroundColor: { default: '_fillActive', '[aria-checked="true"]': '_success' } },
  warning: { backgroundColor: { default: '_fillActive', '[aria-checked="true"]': '_warning' } },
  danger: { backgroundColor: { default: '_fillActive', '[aria-checked="true"]': '_danger' } },
  thumb: {
    boxSizing: 'border-box',
    position: 'absolute',
    insetBlockStart: '0.15em',
    insetInlineStart: '0.15em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.55em',
    height: '1.55em',
    borderRadius: '_full',
    // 圆点在亮暗两套主题里都是白的（同系统的开关）
    backgroundColor: '#fff',
    boxShadow: '_sm',
    color: '_accent',
    fontSize: '1em',
    transform: { default: 'none', '[data-checked]': 'translateX(1.25em)' },
    transitionProperty: 'transform',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
});

/** 开关（button[role=switch] > 圆点） */
export const Switch = _component(
  ({
    _checked: checked = _bindable(false),
    tone = 'accent',
    loading = false,
    disabled,
    onChange,
    propsThumb,
    ...rest
  }: SwitchProps) => {
    const form = useForm();
    return () => {
      const off = disabled ?? form?.disabled ?? false;
      return (
        <button
          {...mergeAttrs<'button'>({ sx: [switchStyles.root, switchStyles[tone]] }, rest, {
            type: 'button',
            role: 'switch',
            'aria-checked': checked ? 'true' : 'false',
            'aria-busy': loading ? 'true' : undefined,
            disabled: off,
            onClick: () => {
              if (loading || form?.readonly) return;
              checked = !checked;
              onChange?.(checked);
            },
            ...dataAttrs({ 'data-disabled': off }),
          })}
        >
          <span
            {...mergeAttrs<'span'>(
              { sx: switchStyles.thumb },
              propsThumb,
              dataAttrs({ 'data-checked': checked }),
            )}
          >
            {loading && <Loading size={14} />}
          </span>
        </button>
      );
    };
  },
);

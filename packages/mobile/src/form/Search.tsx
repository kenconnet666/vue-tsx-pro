/**
 * 搜索框：圆角的灰底输入框，前面放大镜，有内容时可清除，右边可带“取消”。按键盘的搜索键时 onSearch。
 *
 *   <Search _value={keyword} onSearch={(text) => load(text)} />
 *   <Search _value={keyword} showAction onCancel={() => back()} placeholder="搜索商品" />
 */
import { CircleX, Search as SearchIcon } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useConfig } from '../config/context';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { fieldStyles } from './Field';

/** 输入框的属性由组件管理 */
export type SearchInputManaged = 'value' | 'type' | 'disabled' | 'placeholder' | 'enterkeyhint';

/** 未声明的属性落到根元素（div）上 */
export interface SearchProps extends Omit<PartProps<'div', 'role'>, 'onInput'> {
  /** 搜索的文字；双向绑定写 `_value={x}` */
  _value?: string;
  /** 占位文字；不给时用语言包的“搜索” */
  placeholder?: string;
  /**
   * 形状：方角或胶囊
   * @default 'round'
   */
  shape?: 'round' | 'square';
  /**
   * 有内容时显示清除按钮
   * @default true
   */
  clearable?: boolean;
  /** 右边显示“取消” */
  showAction?: boolean;
  /** 右边的内容；不给时是语言包的“取消” */
  action?: VNodeChild;
  /** 禁用 */
  disabled?: boolean;
  /** 按了键盘的搜索键 */
  onSearch?: (value: string) => void;
  /** 点了取消：默认清空文字 */
  onCancel?: () => void;
  /** 点了清除按钮 */
  onClear?: () => void;
  /** 输入框的部件属性 */
  propsInput?: PartProps<'input', SearchInputManaged>;
  /** 灰底的输入区的部件属性 */
  propsBox?: PartProps<'div'>;
  /** 取消按钮的部件属性 */
  propsAction?: PartProps<'button'>;
}

/** Search 的样式：root、box、square、icon、action */
export const searchStyles = css.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_md',
    paddingBlock: '0.55em',
    paddingInline: '_md',
    fontSize: '_md',
    lineHeight: '1.5',
    backgroundColor: '_surface',
  },
  box: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    height: '2.3em',
    paddingInline: '0.8em',
    borderRadius: '_full',
    backgroundColor: '_fill',
    opacity: { default: 1, '[data-disabled]': '_disabled' },
  },
  square: { borderRadius: '_sm' },
  icon: { flex: 'none', fontSize: '1.1em', color: '_textMuted' },
  action: {
    flex: 'none',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_text', ':active': '_textMuted' },
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    cursor: 'pointer',
  },
});

/** 搜索框（div > 输入区 + 取消） */
export const Search = _component(
  ({
    _value: value = _bindable(''),
    placeholder,
    shape = 'round',
    clearable = true,
    showAction = false,
    action,
    disabled = false,
    onSearch,
    onCancel,
    onClear,
    propsInput,
    propsBox,
    propsAction,
    ...rest
  }: SearchProps) => {
    const config = useConfig();
    let input: HTMLInputElement | null = null;
    let composing = false;
    return () => (
      <div {...mergeAttrs<'div'>({ sx: searchStyles.root }, rest, { role: 'search' })}>
        <div
          {...mergeAttrs<'div'>(
            { sx: [searchStyles.box, shape === 'square' && searchStyles.square] },
            propsBox,
            dataAttrs({ 'data-disabled': disabled }),
          )}
        >
          <Icon icon={SearchIcon} sx={searchStyles.icon} />
          <input
            {...mergeAttrs<'input'>({ sx: fieldStyles.input }, propsInput, {
              value,
              // 不用 type=search：WebKit 会再画一个自带的清除按钮
              type: 'text',
              enterkeyhint: 'search',
              disabled,
              placeholder: placeholder ?? config.lang.search,
              onInput: (event: Event) => {
                if (!composing) value = (event.target as HTMLInputElement).value;
              },
              onCompositionstart: () => (composing = true),
              onCompositionend: (event: Event) => {
                composing = false;
                value = (event.target as HTMLInputElement).value;
              },
              onKeydown: (event: KeyboardEvent) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                onSearch?.(value);
              },
            })}
            ref={(node: unknown) => (input = node as HTMLInputElement | null)}
          />
          {clearable && !disabled && value !== '' && (
            <button
              {...mergeAttrs<'button'>({ sx: fieldStyles.clear })}
              type="button"
              aria-label={config.lang.clear}
              onMousedown={(event: Event) => event.preventDefault()}
              onClick={() => {
                value = '';
                onClear?.();
                input?.focus();
              }}
            >
              <Icon icon={CircleX} />
            </button>
          )}
        </div>
        {showAction && (
          <button
            {...mergeAttrs<'button'>({ sx: searchStyles.action }, propsAction, {
              type: 'button',
              onClick: () => {
                value = '';
                onCancel?.();
              },
            })}
          >
            {action ?? config.lang.cancel}
          </button>
        )}
      </div>
    );
  },
);

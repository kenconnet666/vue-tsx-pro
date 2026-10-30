/**
 * 下拉菜单：列表上方的一排筛选（排序、分类、价格），点一项从这一排下面展开选项，选了就收起；同一时间只展开一个。
 *
 *   <DropdownMenu>
 *     <DropdownItem _value={sort} options={[{ text: '综合排序', value: 'default' }, { text: '销量优先', value: 'sales' }]} />
 *     <DropdownItem title="筛选">…自定义内容（开关、按钮）…</DropdownItem>
 *   </DropdownMenu>
 *
 * 展开的面板与遮罩渲染到浮层根，从这一排的下沿开始（宿主量它的位置），遮罩只盖住下面的部分。
 */
import { Check, ChevronDown } from '@lucide/icons';
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Teleport, onBeforeUnmount, shallowReactive, type VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useConfig } from '../config/context';
import { useLockScroll } from '../overlay/Overlay';
import { useHost } from '../utils/host';
import { usePresence } from '../utils/presence';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';
import type { PickerOption } from './PickerColumn';

/** 一项登记给菜单的 */
interface DropdownEntry {
  readonly title: VNodeChild;
  readonly disabled: boolean;
}

/** 菜单提供给各项的 */
interface DropdownState {
  /** 展开的是第几项；-1 是都收着 */
  readonly open: number;
  /** 面板的上沿（px，菜单这一排的下沿） */
  readonly top: number;
  register(entry: DropdownEntry): { index: () => number; unregister: () => void };
  close(): void;
}

const DropdownContext = createContext<DropdownState>('DropdownMenu');

/** 未声明的属性落到菜单这一排（div）上 */
export interface DropdownMenuProps extends PartProps<'div', 'role'> {
  /** 各个 DropdownItem */
  children?: VNodeChild;
}

/** DropdownMenu、DropdownItem 的样式 */
export const dropdownStyles = css.create({
  bar: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    height: '3em',
    backgroundColor: '_surface',
    boxShadow: '_sm',
  },
  title: {
    flex: '1 1 0',
    minWidth: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.2em',
    margin: 0,
    paddingInline: '_sm',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: {
      default: '_text',
      '[aria-expanded="true"]': '_accentText',
      '[disabled]': '_textDisabled',
    },
    fontFamily: 'inherit',
    fontSize: '_md',
    whiteSpace: 'nowrap',
    cursor: { default: 'pointer', '[disabled]': 'not-allowed' },
  },
  titleText: { overflow: 'hidden', textOverflow: 'ellipsis' },
  arrow: {
    flex: 'none',
    fontSize: '0.9em',
    transform: { default: 'none', '[data-open]': 'rotate(180deg)' },
    transitionProperty: 'transform',
    transitionDuration: '_md',
  },
  overlay: {
    position: 'fixed',
    insetInline: 0,
    insetBlockEnd: 0,
    zIndex: 2000,
    backgroundColor: '_overlay',
    opacity: { default: 0, '[data-state="open"]': 1 },
    transitionProperty: 'opacity',
    transitionDuration: '_md',
  },
  // 面板外面一层裁掉面板滑出来之前的部分
  clip: { position: 'fixed', insetInline: 0, zIndex: 2001, overflow: 'hidden' },
  panel: {
    maxHeight: '60vh',
    overflowY: 'auto',
    backgroundColor: '_surface',
    borderEndStartRadius: '_lg',
    borderEndEndRadius: '_lg',
    transform: { default: 'translateY(-100%)', '[data-state="open"]': 'none' },
    transitionProperty: 'transform',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '_control',
    paddingInline: '_lg',
    fontSize: '_md',
    color: {
      default: '_text',
      '[aria-selected="true"]': '_accentText',
      '[data-disabled]': '_textDisabled',
    },
    backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_fillActive' },
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
  },
});

/** 下拉菜单（div > 各项的标题；展开的面板在浮层根） */
export const DropdownMenu = _component(({ children, ...rest }: DropdownMenuProps) => {
  const host = useHost();
  const entries = shallowReactive<DropdownEntry[]>([]);
  let open = _state(-1);
  let top = _state(0);
  let bar: unknown = null;
  const toggle = async (index: number) => {
    if (open === index) return void (open = -1);
    const rect = await host.measure(bar);
    top = rect ? rect.top + rect.height : 0;
    open = index;
  };
  DropdownContext.provide({
    get open() {
      return open;
    },
    get top() {
      return top;
    },
    register(entry) {
      entries.push(entry);
      return {
        index: () => entries.indexOf(entry),
        unregister: () => void entries.splice(entries.indexOf(entry), 1),
      };
    },
    close: () => (open = -1),
  });
  return () => (
    <div
      {...mergeAttrs<'div'>({ sx: dropdownStyles.bar }, rest, { role: 'menubar' })}
      ref={(node: unknown) => (bar = node)}
    >
      {entries.map((entry, index) => (
        <button
          {...mergeAttrs<'button'>({ sx: dropdownStyles.title })}
          type="button"
          aria-expanded={open === index ? 'true' : 'false'}
          aria-haspopup="true"
          disabled={entry.disabled}
          onClick={() => void toggle(index)}
        >
          <span {...mergeAttrs<'span'>({ sx: dropdownStyles.titleText })}>{entry.title}</span>
          <Icon
            icon={ChevronDown}
            sx={dropdownStyles.arrow}
            {...dataAttrs({ 'data-open': open === index })}
          />
        </button>
      ))}
      {children}
    </div>
  );
});

/** 未声明的属性落到面板（div）上 */
export interface DropdownItemProps extends Omit<PartProps<'div', 'title' | 'role'>, 'onChange'> {
  /** 选中的值；双向绑定写 `_value={x}` */
  _value?: string | number;
  /** 选项（与 children 二选一） */
  options?: PickerOption[];
  /** 标题；不给时显示选中的选项 */
  title?: VNodeChild;
  /** 不能展开 */
  disabled?: boolean;
  /** 选了另一项 */
  onChange?: (value: string | number) => void;
  /** 自定义的面板内容（代替选项） */
  children?: VNodeChild;
}

/** 下拉菜单的一项：标题由菜单画，这里画展开的面板 */
export const DropdownItem = _component(
  ({
    _value: value = _bindable<string | number | undefined>(undefined),
    options = [],
    title,
    disabled = false,
    onChange,
    children,
    ...rest
  }: DropdownItemProps) => {
    const menu = DropdownContext.inject();
    const host = useHost();
    const config = useConfig();
    // 标题在这里算好：菜单的渲染只读这个派生值，不去读这一项可双向绑定的 _value
    const label = _derived(
      title ?? options.find((option) => option.value === value)?.text ?? options[0]?.text,
    );
    const handle = menu.register({
      get title() {
        return label;
      },
      get disabled() {
        return disabled;
      },
    });
    onBeforeUnmount(handle.unregister);
    const isOpen = () => menu.open === handle.index();
    const presence = usePresence(isOpen);
    useLockScroll(isOpen);

    const choose = (option: PickerOption) => {
      if (option.disabled) return;
      if (option.value !== value) {
        value = option.value;
        onChange?.(option.value);
      }
      menu.close();
    };

    return () => {
      if (!presence.mounted) return null;
      const state = dataAttrs({ 'data-state': presence.visible ? 'open' : 'closed' });
      return (
        <Teleport to={host.overlayRoot() as never}>
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [config.rootSx, dropdownStyles.overlay],
                style: { insetBlockStart: `${menu.top}px` },
              },
              state,
            )}
            onClick={() => menu.close()}
            {...dataAttrs({ 'data-scroll-lock': true })}
          />
          <div
            {...mergeAttrs<'div'>({
              sx: [config.rootSx, dropdownStyles.clip],
              style: { insetBlockStart: `${menu.top}px` },
            })}
          >
            <div
              {...mergeAttrs<'div'>({ sx: dropdownStyles.panel }, rest, { role: 'menu', ...state })}
            >
              {hasContent(children)
                ? children
                : options.map((option) => {
                    const selected = option.value === value;
                    return (
                      <div
                        {...mergeAttrs<'div'>({ sx: dropdownStyles.option })}
                        role="menuitemradio"
                        aria-checked={selected ? 'true' : 'false'}
                        aria-selected={selected ? 'true' : 'false'}
                        {...dataAttrs({ 'data-disabled': option.disabled })}
                        onClick={() => choose(option)}
                      >
                        <span>{option.text}</span>
                        {selected && <Icon icon={Check} />}
                      </div>
                    );
                  })}
            </div>
          </div>
        </Teleport>
      );
    };
  },
);

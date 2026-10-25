/**
 * 右键菜单（div）：在一块区域里右键（或键盘的 Shift+F10、菜单键）时，从指针位置弹出菜单。
 * 菜单项与 Menu 完全相同（MenuItem、MenuCheckboxItem、MenuSub…），菜单本身就是一个以指针位置为锚点的 Menu。
 *
 *   <ContextMenu menu={<><MenuItem onAction={rename}>重命名</MenuItem><MenuItem tone="danger" onAction={remove}>删除</MenuItem></>}>
 *     <FileCard file={file} />
 *   </ContextMenu>
 *
 * 键盘打开时（contextmenu 事件不带指针坐标）从获得焦点的元素左下角弹出；关闭后焦点回到打开前的元素。
 * 区域本身不可聚焦：键盘用户要能打开，里面得有可聚焦的元素（同 Radix ContextMenu）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { nextTick, watch, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Menu, type MenuProps } from './Menu';

/** 未声明的属性落到区域的 div 上 */
export interface ContextMenuProps extends PartProps<'div'>, OpenChangeProps {
  /** 菜单是否打开：父级可以写 _open={_bind(x)} */
  _open?: boolean;
  /** 菜单项：同 Menu 的 children */
  menu: VNodeChild;
  /** 菜单的名称，默认取语言包（更多操作） */
  label?: string;
  /** 不弹出（浏览器自己的右键菜单照常出现） */
  disabled?: boolean;
  /** 菜单（Menu）的部件属性 */
  propsMenu?: Partial<MenuProps>;
  /** 区域里的内容 */
  children?: VNodeChild;
}

/** 右键菜单：区域 + 从指针位置弹出的 Menu */
export const ContextMenu = _component(
  ({
    _open: open = _bindable(false),
    onOpenChange,
    menu,
    label,
    disabled = false,
    propsMenu,
    children,
    ...rest
  }: ContextMenuProps) => {
    const lang = useLang();
    let point = _state.raw<{ x: number; y: number } | undefined>(undefined);
    // 打开前焦点所在的元素：关闭后还给它
    let origin: HTMLElement | null = null;
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    function onContextmenu(event: MouseEvent) {
      const target = event.target as HTMLElement;
      // 菜单渲染在区域里：在菜单上右键不再打开
      if (disabled || target.closest('[role="menu"]')) return;
      event.preventDefault();
      origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      // 键盘打开时没有指针坐标：从获得焦点的元素左下角弹出
      if (event.clientX === 0 && event.clientY === 0) {
        const rect = target.getBoundingClientRect();
        point = { x: rect.left, y: rect.bottom };
      } else point = { x: event.clientX, y: event.clientY };
      // 已经开着时先关再开，菜单换到新的位置（仍算开着，不通知）
      if (open) {
        open = false;
        void nextTick(() => (open = true));
      } else setOpen(true, 'trigger', event);
    }

    watch(
      () => open,
      (next) => {
        if (next) return;
        const active = document.activeElement;
        if (!active || active === document.body || active.closest('[role="menu"]')) origin?.focus();
      },
      { flush: 'post' },
    );

    return () => (
      <div
        {...mergeAttrs<'div'>({}, rest, { onContextmenu })}
        data-state={open ? 'open' : 'closed'}
      >
        {children}
        <Menu
          {...mergePartProps<MenuProps>(
            { trigger: () => null, 'aria-label': label ?? lang.contextMenuLabel },
            propsMenu,
            { point },
          )}
          _open={_bind(open)}
          onOpenChange={onOpenChange}
        >
          {menu}
        </Menu>
      </div>
    );
  },
);

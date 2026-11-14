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
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { nextTick, onScopeDispose, watch, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Menu, type MenuProps } from './Menu';

/** 未声明的属性落到区域的 div 上 */
export interface ContextMenuProps extends PartProps<'div'>, OpenChangeProps {
  /** 菜单是否打开：父级可以写 _open={x} */
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

/** 触屏、触控笔按住多久算长按（ms） */
const LONG_PRESS = 700;
/** 长按期间手指挪动超过多少（px）就不算 */
const PRESS_SLOP = 10;

/** 右键菜单：区域 + 从指针位置弹出的 Menu（桌面右键、键盘的菜单键、触屏长按） */
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

    /** 在这个位置（视口坐标）打开 */
    function openAt(at: { x: number; y: number }, event: Event) {
      origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      point = at;
      // 已经开着时先关再开，菜单换到新的位置（仍算开着，不通知）
      if (open) {
        open = false;
        void nextTick(() => (open = true));
      } else setOpen(true, 'trigger', event);
    }

    function onContextmenu(event: MouseEvent) {
      const target = event.target as HTMLElement;
      // 浏览器自己发了 contextmenu（桌面的右键、Android 的长按）：不用等下面的长按计时
      clearTimeout(press);
      // 菜单渲染在区域里：在菜单上右键不再打开；里层的区域（嵌套的 ContextMenu）或使用方已经处理过的也不再打开
      if (event.defaultPrevented || disabled || target.closest('[role="menu"]')) return;
      event.preventDefault();
      // 键盘打开时没有指针坐标：从获得焦点的元素左下角弹出
      if (event.clientX === 0 && event.clientY === 0) {
        const rect = target.getBoundingClientRect();
        openAt({ x: rect.left, y: rect.bottom }, event);
      } else openAt({ x: event.clientX, y: event.clientY }, event);
    }

    // 长按：iOS 的 Safari 长按不发 contextmenu，触屏、触控笔按住不动一会儿当作右键（同 Radix 的 ContextMenu）
    let press: ReturnType<typeof setTimeout> | undefined;
    let pressAt = { x: 0, y: 0 };
    onScopeDispose(() => clearTimeout(press));

    function onPointerdown(event: PointerEvent) {
      clearTimeout(press);
      const target = event.target as HTMLElement;
      if (event.pointerType === 'mouse' || disabled || target.closest('[role="menu"]')) return;
      pressAt = { x: event.clientX, y: event.clientY };
      press = setTimeout(() => {
        // 里层的区域（嵌套的 ContextMenu）已经用这次长按打开了：外层不再打开
        if (!event.defaultPrevented) {
          event.preventDefault();
          openAt(pressAt, event);
        }
      }, LONG_PRESS);
    }

    /** 手指挪开了（在滚动、拖动）、抬起来了：不算长按 */
    function onPointermove(event: PointerEvent) {
      if (Math.hypot(event.clientX - pressAt.x, event.clientY - pressAt.y) > PRESS_SLOP)
        clearTimeout(press);
    }
    const endPress = () => clearTimeout(press);

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
        {...mergeAttrs<'div'>(
          // 长按时 iOS 不弹出自己的预览、拷贝菜单
          { style: { WebkitTouchCallout: 'none' } },
          rest,
          {
            onContextmenu,
            onPointerdown,
            onPointermove,
            onPointerup: endPress,
            onPointercancel: endPress,
          },
        )}
        data-state={open ? 'open' : 'closed'}
      >
        {children}
        <Menu
          {...mergePartProps<MenuProps>(
            { trigger: () => null, 'aria-label': label ?? lang.contextMenuLabel },
            propsMenu,
            { point },
          )}
          _open={open}
          onOpenChange={onOpenChange}
        >
          {menu}
        </Menu>
      </div>
    );
  },
);

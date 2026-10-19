// 试点组件：验证原生 popover + floating-ui 定位、焦点进入与恢复、触发器透传，不进组件库
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  anchorFloating,
  elementProps,
  floatingStyles,
  focusFirst,
  mergeProps,
  returnFocus,
  toElement,
  transitions,
  type Anchored,
  type FloatingPlacement,
  type PartProps,
  type TriggerProps,
} from '@vue-tsx-pro/ui';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';

/** 交给触发器的属性：在展开收起的通用属性上，加上弹层需要的 id、ref 与 aria-haspopup */
export interface PopoverTriggerProps extends TriggerProps {
  /** 弹出层默认以触发器的文字作为无障碍名称（aria-labelledby） */
  id: string;
  /** 取得触发器元素：定位的参照、关闭后焦点回到这里 */
  ref: (element: unknown) => void;
  /** 告诉读屏这个按钮会打开对话框类的弹层 */
  'aria-haspopup': 'dialog';
}

/** 未声明的属性落到弹出层的 div 上 */
export interface PopoverProps extends PartProps<'div', 'id' | 'popover' | 'role'> {
  /** 是否打开：父级写 open={_bind(x)}；Esc 与点击外部会关闭并写回 */
  open?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 触发器：`(props) => <Button {...props}>更多</Button>` */
  trigger: (props: PopoverTriggerProps) => VNodeChild;
  children?: VNodeChild;
}

const styles = stylex.create({
  panel: {
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surfaceRaised',
    color: '_text',
    boxShadow: '_lg',
  },
});

/** 试点弹出层：原生 popover + floating-ui 定位，打开时焦点进入、关闭后回到触发器 */
export const Popover = _component(
  ({
    open = _bindable(false),
    placement = 'bottom-start',
    trigger,
    children,
    ...rest
  }: PopoverProps) => {
    const id = useId();
    const triggerId = `${id}-trigger`;
    let anchor = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    let anchored: Anchored | undefined;
    let visible = false;

    function show() {
      if (!anchor || !panel || panel.matches(':popover-open')) return;
      visible = true;
      panel.showPopover();
      anchored = anchorFloating(anchor, panel, { placement });
      // 不可见的元素不能获得焦点，所以等第一次定位、显示出来之后再把焦点移进去
      const target = panel;
      void anchored.ready.then(() => focusFirst(target));
    }

    // Esc 与点击外部由浏览器先关掉弹层，这里仍要收尾：停止定位、把焦点还给触发器
    function hide() {
      if (!visible || !panel) return;
      visible = false;
      anchored?.stop();
      anchored = undefined;
      if (panel.matches(':popover-open')) panel.hidePopover();
      returnFocus(panel, anchor);
    }

    // 原生 popover="auto" 自带 Esc 与点击外部关闭（light dismiss），这里把结果写回 open
    function onToggle(event: Event) {
      const opened = (event as ToggleEvent).newState === 'open';
      if (opened !== open) open = opened;
      if (!opened) hide();
    }

    // DOM 更新后执行（首次在挂载后，anchor 与 panel 已就位）：open 变化时显示或隐藏
    _effect(() => {
      if (open) show();
      else hide();
    });
    onBeforeUnmount(hide);

    return () => (
      <>
        {trigger({
          ref: (value) => (anchor = toElement(value)),
          onClick: () => (open = !open),
          'aria-expanded': open,
          id: triggerId,
          'aria-controls': id,
          'aria-haspopup': 'dialog',
        })}
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [floatingStyles.anchored, styles.panel, transitions.scale],
                'aria-labelledby': triggerId,
              },
              rest,
              {
                ref: _toRef(panel),
                id,
                popover: 'auto',
                role: 'dialog',
                onToggle,
              },
            ),
          )}
        >
          {children}
        </div>
      </>
    );
  },
);

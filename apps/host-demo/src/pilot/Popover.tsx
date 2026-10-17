// 试点组件：验证原生 popover + floating-ui 定位、焦点进入与恢复、触发器透传，不进组件库
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { elementProps, mergeProps, type PartProps } from '@vue-tsx-pro/ui';
import { colors, shadows, sizes } from '@vue-tsx-pro/ui/tokens.stylex';
import { tabbable } from 'tabbable';
import { nextTick, onBeforeUnmount, useId, watch, type VNodeChild } from 'vue';

/** 交给触发器的属性：展开到任意可聚焦元素上 */
export interface TriggerProps {
  ref: (element: unknown) => void;
  onClick: () => void;
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-haspopup': 'dialog';
}

export interface PopoverProps extends PartProps<'div', 'id' | 'popover' | 'role'> {
  /** 是否打开：父级写 open={_bind(x)}；Esc 与点击外部会关闭并写回 */
  open?: boolean;
  placement?: Placement;
  /** 触发器：`(props) => <Button {...props}>更多</Button>` */
  trigger: (props: TriggerProps) => VNodeChild;
  children?: VNodeChild;
}

const styles = stylex.create({
  panel: {
    // 原生 popover 默认居中显示，这里改为由 floating-ui 计算的位置
    position: 'fixed',
    inset: 'auto',
    margin: 0,
    padding: '0.75em',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    borderRadius: sizes.radiusLg,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    boxShadow: shadows.popover,
  },
});

/** ref 落在组件上时拿到的是组件实例，取它的根元素 */
function toElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value;
  const root = (value as { $el?: unknown } | null)?.$el;
  return root instanceof HTMLElement ? root : null;
}

export const Popover = _component(
  ({
    open = _bindable(false),
    placement = 'bottom-start',
    trigger,
    children,
    ...rest
  }: PopoverProps) => {
    const id = useId();
    let anchor = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    let stopPositioning: (() => void) | undefined;

    function position() {
      if (!anchor || !panel) return;
      void computePosition(anchor, panel, {
        placement,
        strategy: 'fixed',
        middleware: [offset(6), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => panel && Object.assign(panel.style, { left: `${x}px`, top: `${y}px` }));
    }

    function show() {
      if (!anchor || !panel || panel.matches(':popover-open')) return;
      panel.showPopover();
      stopPositioning = autoUpdate(anchor, panel, position);
      tabbable(panel)[0]?.focus();
    }

    function hide() {
      stopPositioning?.();
      stopPositioning = undefined;
      if (!panel?.matches(':popover-open')) return;
      const focusInside = panel.contains(document.activeElement);
      panel.hidePopover();
      if (focusInside) anchor?.focus();
    }

    // 原生 popover="auto" 自带 Esc 与点击外部关闭（light dismiss），这里把结果写回 open
    function onToggle(event: Event) {
      const opened = (event as ToggleEvent).newState === 'open';
      if (opened !== open) open = opened;
      if (!opened) hide();
    }

    watch(_ref(open), (value) => void nextTick(() => (value ? show() : hide())), {
      immediate: true,
    });
    onBeforeUnmount(hide);

    return () => (
      <>
        {trigger({
          ref: (value) => (anchor = toElement(value)),
          onClick: () => (open = !open),
          'aria-expanded': open,
          'aria-controls': id,
          'aria-haspopup': 'dialog',
        })}
        <div
          {...elementProps(
            mergeProps({ sx: styles.panel }, rest, {
              ref: _ref(panel),
              id,
              popover: 'auto',
              role: 'dialog',
              onToggle,
            }),
          )}
        >
          {children}
        </div>
      </>
    );
  },
);

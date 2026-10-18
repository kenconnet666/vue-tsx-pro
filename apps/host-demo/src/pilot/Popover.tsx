// 试点组件：验证原生 popover + floating-ui 定位、焦点进入与恢复、触发器透传，不进组件库
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  elementProps,
  focusFirst,
  mergeProps,
  returnFocus,
  toElement,
  transitions,
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

/** 弹出位置：主方向 + 对齐方式（start 对齐触发器的起始边，end 对齐结束边）；空间不够时自动翻转 */
export interface PopoverPlacements {
  /** 上方居中 */
  top: unknown;
  /** 上方，与触发器起始边对齐 */
  'top-start': unknown;
  /** 上方，与触发器结束边对齐 */
  'top-end': unknown;
  /** 下方居中 */
  bottom: unknown;
  /** 下方，与触发器起始边对齐（默认） */
  'bottom-start': unknown;
  /** 下方，与触发器结束边对齐 */
  'bottom-end': unknown;
  /** 左侧居中 */
  left: unknown;
  /** 左侧，与触发器顶边对齐 */
  'left-start': unknown;
  /** 左侧，与触发器底边对齐 */
  'left-end': unknown;
  /** 右侧居中 */
  right: unknown;
  /** 右侧，与触发器顶边对齐 */
  'right-start': unknown;
  /** 右侧，与触发器底边对齐 */
  'right-end': unknown;
}

/** 未声明的属性落到弹出层的 div 上 */
export interface PopoverProps extends PartProps<'div', 'id' | 'popover' | 'role'> {
  /** 是否打开：父级写 open={_bind(x)}；Esc 与点击外部会关闭并写回 */
  open?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: keyof PopoverPlacements & Placement;
  /** 触发器：`(props) => <Button {...props}>更多</Button>` */
  trigger: (props: PopoverTriggerProps) => VNodeChild;
  children?: VNodeChild;
}

type Side = 'top' | 'right' | 'bottom' | 'left';

/** 进出场缩放的原点：朝触发器那一侧（弹出在下方时从上边缘展开） */
const TRANSFORM_ORIGIN: Record<Side, string> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

const styles = stylex.create({
  panel: {
    // 原生 popover 默认居中显示，这里改为由 floating-ui 计算的位置
    position: 'fixed',
    inset: 'auto',
    margin: 0,
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
    let stopPositioning: (() => void) | undefined;
    let focusAfterPositioning = false;
    let visible = false;

    function position() {
      if (!anchor || !panel) return;
      void computePosition(anchor, panel, {
        placement,
        strategy: 'fixed',
        middleware: [offset(6), flip(), shift({ padding: 8 })],
      }).then(({ x, y, placement: final }) => {
        if (!panel) return;
        Object.assign(panel.style, {
          left: `${x}px`,
          top: `${y}px`,
          visibility: '',
          transformOrigin: TRANSFORM_ORIGIN[final.split('-')[0] as Side],
        });
        // 不可见的元素不能获得焦点，所以等第一次定位、显示出来之后再把焦点移进去
        if (focusAfterPositioning) focusFirst(panel);
        focusAfterPositioning = false;
      });
    }

    function show() {
      if (!anchor || !panel || panel.matches(':popover-open')) return;
      // 位置是异步算出的，算好之前先不显示，避免在默认位置闪一下
      panel.style.visibility = 'hidden';
      focusAfterPositioning = true;
      visible = true;
      panel.showPopover();
      stopPositioning = autoUpdate(anchor, panel, position);
    }

    // Esc 与点击外部由浏览器先关掉弹层，这里仍要收尾：停止定位、把焦点还给触发器
    function hide() {
      if (!visible || !panel) return;
      visible = false;
      stopPositioning?.();
      stopPositioning = undefined;
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
              { sx: [styles.panel, transitions.scale], 'aria-labelledby': triggerId },
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

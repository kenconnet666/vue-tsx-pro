/**
 * 锚定浮层：Popover、Tooltip、Menu、Select 的弹出层贴着触发器显示。位置由 floating-ui 计算，
 * 显示、隐藏、Esc、点击外部仍交给原生 popover（见 utils/overlay）；createAnchoredPopover 把两者串成打开、关闭的流程。
 *
 *   const anchored = anchorFloating(trigger, panel, { placement: 'bottom-start' });
 *   await anchored.ready;   // 第一次定位完成、已经可见：这时才能把焦点移进去
 *   anchored.stop();        // 关闭时停止跟随
 *   sx: [floatingStyles.anchored, …]   // 浮层自己的样式：去掉原生 popover 默认的居中与外边距
 *
 * - 第一次算好位置之前浮层是 visibility: hidden，不会在默认位置闪一下；
 * - 空间不够时翻到另一侧（flip）、贴着视口边缘挪回来（shift），滚动、缩放、锚点变化时自动重新定位（autoUpdate）；
 * - start / end 对齐是逻辑方向，从右到左排版下自动镜像（floating-ui 读浮层的 direction）；
 * - 最终方向写到 data-side / data-align，缩放原点（transform-origin）朝向锚点，进出场的 scale 过渡从锚点那侧展开。
 */
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type Middleware,
  type Placement,
} from '@floating-ui/dom';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, watchPostEffect } from 'vue';
import { returnFocus } from './focus';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';

/** 弹出位置：主方向 + 对齐方式（start 对齐锚点的起始边，end 对齐结束边）；空间不够时自动翻转 */
export interface FloatingPlacements {
  /** 上方居中 */
  top: unknown;
  /** 上方，与锚点起始边对齐 */
  'top-start': unknown;
  /** 上方，与锚点结束边对齐 */
  'top-end': unknown;
  /** 下方居中 */
  bottom: unknown;
  /** 下方，与锚点起始边对齐 */
  'bottom-start': unknown;
  /** 下方，与锚点结束边对齐 */
  'bottom-end': unknown;
  /** 左侧居中 */
  left: unknown;
  /** 左侧，与锚点顶边对齐 */
  'left-start': unknown;
  /** 左侧，与锚点底边对齐 */
  'left-end': unknown;
  /** 右侧居中 */
  right: unknown;
  /** 右侧，与锚点顶边对齐 */
  'right-start': unknown;
  /** 右侧，与锚点底边对齐 */
  'right-end': unknown;
}

/** 弹出位置 */
export type FloatingPlacement = keyof FloatingPlacements & Placement;

/** anchorFloating 的选项 */
export interface FloatingOptions {
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 与锚点的距离（px），默认 6 */
  offset?: number;
  /** 至少与锚点一样宽：下拉框、组合框的选项列表 */
  matchWidth?: boolean;
  /** 最大高度限制在视口剩余空间内（浮层自己设 overflow 滚动）：菜单、选项列表 */
  fitHeight?: boolean;
}

/** anchorFloating 的返回值 */
export interface Anchored {
  /** 第一次定位完成、浮层已可见时完成；在这之前就 stop 时不会完成 */
  readonly ready: Promise<void>;
  /** 停止跟随锚点；关闭浮层时调用，重复调用无副作用 */
  stop(): void;
}

type Side = 'top' | 'right' | 'bottom' | 'left';

/** 缩放原点朝向锚点：弹出在下方时从上边缘展开 */
const TRANSFORM_ORIGIN: Record<Side, string> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

// 写明类型：导出的 stylex.create 结果若靠推导，类型声明里会引用 StyleX 内部无法命名的类型
/** 锚定浮层的基础样式：定位与表面 */
export const floatingStyles: Readonly<Record<'anchored' | 'surface', StyleXStyles>> = stylex.create(
  {
    /** 原生 popover 默认居中显示、带外边距，改为由 anchorFloating 写入的 left / top 定位 */
    anchored: { position: 'fixed', inset: 'auto', margin: 0 },
    /** 浮起的表面：边框、圆角、阴影（Popover、Menu、选项列表）；内边距各自定 */
    surface: {
      boxSizing: 'border-box',
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: '_border',
      borderRadius: '_lg',
      backgroundColor: '_surfaceRaised',
      color: '_text',
      boxShadow: '_lg',
    },
  },
);

/** 与视口边缘至少留出的距离（px） */
const VIEWPORT_PADDING = 8;

/** 把 floating 定位到 anchor 旁边并持续跟随；floating 需要已经显示（如 showPopover 之后） */
export function anchorFloating(
  anchor: HTMLElement,
  floating: HTMLElement,
  { placement = 'bottom-start', offset: distance = 6, matchWidth, fitHeight }: FloatingOptions = {},
): Anchored {
  const middleware: Middleware[] = [
    offset(distance),
    flip({ padding: VIEWPORT_PADDING }),
    shift({ padding: VIEWPORT_PADDING }),
  ];
  if (matchWidth || fitHeight) {
    middleware.push(
      size({
        padding: VIEWPORT_PADDING,
        apply({ rects, availableHeight, elements }) {
          if (matchWidth) elements.floating.style.minWidth = `${rects.reference.width}px`;
          if (fitHeight) elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
        },
      }),
    );
  }

  let stopped = false;
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => (resolveReady = resolve));
  floating.style.visibility = 'hidden';

  const update = () =>
    void computePosition(anchor, floating, { placement, strategy: 'fixed', middleware }).then(
      ({ x, y, placement: final }) => {
        if (stopped) return;
        const [side, align = 'center'] = final.split('-') as [Side, string?];
        Object.assign(floating.style, {
          left: `${x}px`,
          top: `${y}px`,
          visibility: '',
          transformOrigin: TRANSFORM_ORIGIN[side],
        });
        floating.dataset.side = side;
        floating.dataset.align = align;
        resolveReady();
      },
    );
  const cleanup = autoUpdate(anchor, floating, update);

  return {
    ready,
    stop() {
      if (stopped) return;
      stopped = true;
      cleanup();
    },
  };
}

/** createAnchoredPopover 的返回值：一个原生 popover 浮层的打开与关闭 */
export interface AnchoredPopover {
  /** 是否显示着（show 之后、hide 之前） */
  readonly visible: boolean;
  /** 显示 panel（showPopover）并贴着 anchor 定位；返回第一次定位完成、可以移入焦点的 Promise。已显示时不重复 */
  show(anchor: HTMLElement, panel: HTMLElement, options?: FloatingOptions): Promise<void>;
  /** 停止定位并隐藏；restoreFocus（默认 true）时焦点还在浮层里或已丢失则还给锚点。未显示时什么也不做 */
  hide(options?: { restoreFocus?: boolean }): void;
}

/**
 * 锚定浮层的生命周期（Popover、Menu、Tooltip 共用）：显示 → 定位 → 关闭时停止定位、归还焦点。
 * 原生 popover="auto" 被 Esc、点击外部关闭（light dismiss）时浏览器先隐藏了它，组件在 toggle 事件里调用 hide 收尾。
 */
export function createAnchoredPopover(): AnchoredPopover {
  let current: { anchor: HTMLElement; panel: HTMLElement; anchored: Anchored } | undefined;
  let ready: Promise<void> = Promise.resolve();
  return {
    get visible() {
      return current != null;
    },
    show(anchor, panel, options) {
      if (current) return ready;
      if (!panel.matches(':popover-open')) panel.showPopover();
      const anchored = anchorFloating(anchor, panel, options);
      current = { anchor, panel, anchored };
      ready = anchored.ready;
      return ready;
    },
    hide({ restoreFocus = true } = {}) {
      if (!current) return;
      const { anchor, panel, anchored } = current;
      current = undefined;
      anchored.stop();
      if (panel.matches(':popover-open')) panel.hidePopover();
      if (restoreFocus) returnFocus(panel, anchor);
    },
  };
}

/** useAnchoredPopover 每次渲染后读取的状态 */
export interface AnchoredPopoverState {
  /** 是否打开 */
  open: boolean;
  /** 锚点（触发器或输入框外壳） */
  anchor: HTMLElement | null;
  /** 浮层（popover 元素） */
  panel: HTMLElement | null;
  /** 定位选项 */
  floating?: FloatingOptions;
  /** 关闭时把焦点还给锚点，默认 true；焦点一直在锚点上的组件（Select、Combobox）设 false */
  restoreFocus?: boolean;
}

/** useAnchoredPopover 的回调 */
export interface AnchoredPopoverEvents {
  /** 浏览器关掉了浮层（Esc、点击外部）：组件把 open 写回 false */
  close: () => void;
  /** 浮层打开并第一次定位完成（可见）：移入焦点等 */
  shown?: (panel: HTMLElement) => void;
}

/**
 * 原生 popover="auto" 的锚定浮层接到组件的 open 上（Popover、Menu、Select、Combobox 共用）：
 * open 变化时显示或隐藏（DOM 更新之后），浏览器的 light dismiss 写回 open，卸载时收起。
 * 返回要放到浮层元素上的 onToggle。在组件 setup 里调用。
 *
 *   const { onToggle } = useAnchoredPopover(
 *     () => ({ open, anchor, panel, floating: { placement } }),
 *     { close: () => (open = false), shown: focusFirst },
 *   );
 */
export function useAnchoredPopover(
  read: () => AnchoredPopoverState,
  events: AnchoredPopoverEvents,
): { onToggle: (event: Event) => void } {
  const layer = createAnchoredPopover();

  watchPostEffect(() => {
    const { open, anchor, panel, floating, restoreFocus = true } = read();
    if (!open) {
      layer.hide({ restoreFocus });
      return;
    }
    if (!anchor || !panel) return;
    // 已经显示着（只是定位选项变了）时不再触发 shown，焦点不会被拉回第一项
    const opening = !layer.visible;
    const ready = layer.show(anchor, panel, floating);
    if (opening && events.shown) void ready.then(() => events.shown!(panel));
  });
  onBeforeUnmount(() => layer.hide({ restoreFocus: read().restoreFocus ?? true }));

  return {
    onToggle(event) {
      if ((event as ToggleEvent).newState === 'open') return;
      const state = read();
      if (state.open) events.close();
      layer.hide({ restoreFocus: state.restoreFocus ?? true });
    },
  };
}

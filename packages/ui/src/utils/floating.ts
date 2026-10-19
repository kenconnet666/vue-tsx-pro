/**
 * 锚定浮层的定位：Popover、Tooltip、Menu、Select 的弹出层贴着触发器显示。只算位置（floating-ui），
 * 显示、隐藏、Esc、点击外部仍交给原生 popover（见 utils/overlay）。
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
/** 锚定浮层的基础样式 */
export const floatingStyles: Readonly<Record<'anchored', StyleXStyles>> = stylex.create({
  /** 原生 popover 默认居中显示、带外边距，改为由 anchorFloating 写入的 left / top 定位 */
  anchored: { position: 'fixed', inset: 'auto', margin: 0 },
});

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

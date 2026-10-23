/**
 * 拖动工具：在 pointerdown 里调用 startMove，之后的移动、松开、取消都由它跟踪（COMPONENTS.md §7 拖动工具）。
 * 参考 React Aria 的 useMove，直接基于 Pointer Events，不用手势库：
 *   - setPointerCapture：指针移出元素、移出窗口也能继续拖
 *   - pointercancel、失去捕获（系统手势、弹窗打断）按结束处理，不会卡在拖动状态
 *   - 拖动期间禁止选中文字；拖动超过阈值后吞掉随后的 click，拖完不会误触发点击
 *   - 只响应主按钮（鼠标左键、触摸、笔尖）
 * 元素自己要设 touch-action（如 none），否则触摸拖动会被浏览器当成页面滚动。
 * 键盘替代由组件自己提供（WCAG 2.5.7）。
 *
 *   onPointerdown={(event) => startMove(event, { onMove: ({ deltaX }) => … })}
 */

/** 一次移动的位置：clientX/Y 是当前位置，deltaX/Y 是相对按下时的位移（px） */
export interface MovePoint {
  /** 当前位置（视口坐标） */
  readonly clientX: number;
  /** 当前位置（视口坐标） */
  readonly clientY: number;
  /** 相对按下位置的横向位移 */
  readonly deltaX: number;
  /** 相对按下位置的纵向位移 */
  readonly deltaY: number;
}

/** startMove 的回调与选项 */
export interface MoveOptions {
  /** 指针移动（位移超过 threshold 之后才开始报告） */
  onMove: (point: MovePoint, event: PointerEvent) => void;
  /** 结束：松开、取消或失去捕获；moved 表示是否真的拖动过（超过阈值） */
  onEnd?: (point: MovePoint & { readonly moved: boolean; readonly cancelled: boolean }) => void;
  /** 位移超过多少 px 才算拖动，默认 0（按下即开始）；需要区分点击与拖动时设 3 左右 */
  threshold?: number;
  /**
   * 捕获指针、接收后续事件的元素，默认是按下的元素（event.currentTarget）。
   * 拖动中会被移动的元素（排序时 Vue 重排 DOM）要换成不动的祖先：元素一离开文档就失去捕获，拖动会被当成取消
   */
  captureTarget?: Element;
}

/** 按下时调用：开始跟踪这个指针，返回提前结束的函数（组件卸载时调用）。不是主按钮时什么也不做 */
export function startMove(event: PointerEvent, options: MoveOptions): () => void {
  if (event.button !== 0 || !(event.currentTarget instanceof Element)) return () => {};
  const target = options.captureTarget ?? event.currentTarget;
  const { pointerId, clientX: startX, clientY: startY } = event;
  const threshold = options.threshold ?? 0;
  let moved = threshold === 0;
  let finished = false;
  let last: MovePoint = { clientX: startX, clientY: startY, deltaX: 0, deltaY: 0 };

  // 捕获失败（指针已经松开、元素不在文档里）时照常用元素上的事件，只是移出元素后收不到
  try {
    target.setPointerCapture(pointerId);
  } catch {}
  const root = document.documentElement;
  const userSelect = root.style.userSelect;
  root.style.userSelect = 'none';

  const onMove = (move: PointerEvent) => {
    if (move.pointerId !== pointerId) return;
    last = {
      clientX: move.clientX,
      clientY: move.clientY,
      deltaX: move.clientX - startX,
      deltaY: move.clientY - startY,
    };
    if (!moved && Math.hypot(last.deltaX, last.deltaY) < threshold) return;
    moved = true;
    options.onMove(last, move);
  };
  const finish = (cancelled: boolean) => {
    if (finished) return;
    finished = true;
    target.removeEventListener('pointermove', onMove as EventListener);
    target.removeEventListener('pointerup', onUp as EventListener);
    target.removeEventListener('pointercancel', onCancel as EventListener);
    target.removeEventListener('lostpointercapture', onCancel as EventListener);
    root.style.userSelect = userSelect;
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
    // 拖过之后的 click 不算点击（阈值为 0 时按下即拖动，不吞）
    if (moved && threshold > 0) {
      const swallow = (click: Event) => click.stopPropagation();
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }));
    }
    options.onEnd?.({ ...last, moved, cancelled });
  };
  const onUp = (up: PointerEvent) => up.pointerId === pointerId && finish(false);
  const onCancel = (cancel: PointerEvent) => cancel.pointerId === pointerId && finish(true);

  target.addEventListener('pointermove', onMove as EventListener);
  target.addEventListener('pointerup', onUp as EventListener);
  target.addEventListener('pointercancel', onCancel as EventListener);
  target.addEventListener('lostpointercapture', onCancel as EventListener);
  return () => finish(true);
}

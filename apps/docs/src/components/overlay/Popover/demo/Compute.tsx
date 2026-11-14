// computePlacement 是定位规则的纯函数：给锚点的矩形、浮层的大小和边界，算出浮层的左上角、最后落在哪一侧、箭头的位置。
// 拖动锚点（或聚焦后按方向键）看它翻面、贴边；这里的“视口”就是虚线框，坐标全是框里的坐标——画布、舞台里也能这样用
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ButtonBase,
  clamp,
  computePlacement,
  Flex,
  Select,
  Small,
  Switch,
  useResizeObserver,
  type FloatingPlacement,
} from '@zerodep-dev/vue-tsx-pro-ui';

const placements: FloatingPlacement[] = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];
const ANCHOR = { width: 64, height: 32 };
const PANEL = { width: 148, height: 72 };
const ARROW = 10;
/** 方向键一次挪多少 */
const STEP = 12;

const styles = css.create({
  stage: {
    position: 'relative',
    height: '17rem',
    borderWidth: '_xs',
    borderStyle: 'dashed',
    borderColor: '_border',
    borderRadius: '_md',
    overflow: 'hidden',
    // 在框里拖动锚点时不滚动页面
    touchAction: 'none',
  },
  anchor: {
    position: 'absolute',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '_sm',
    backgroundColor: '_accentSoft',
    color: '_accentText',
    fontSize: '_xs',
    cursor: 'grab',
    userSelect: 'none',
  },
  panel: {
    position: 'absolute',
    boxSizing: 'border-box',
    display: 'grid',
    placeItems: 'center',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surfaceRaised',
    boxShadow: '_lg',
    fontSize: '_sm',
    pointerEvents: 'none',
  },
  arrow: {
    position: 'absolute',
    borderRadius: '_full',
    backgroundColor: '_accentText',
  },
});

export default _component(() => {
  let placement = _state<FloatingPlacement | null>('bottom-start');
  let crossAxisFallback = _state(false);
  let stage = _state.raw<HTMLElement | null>(null);
  let size = _state({ width: 0, height: 0 });
  // 锚点的左上角（框里的坐标）
  let at = _state({ x: 120, y: 60 });
  let grab: { x: number; y: number } | null = null;

  useResizeObserver(
    () => stage,
    ([entry]) => (size = { width: entry!.contentRect.width, height: entry!.contentRect.height }),
  );

  const moveTo = (x: number, y: number) =>
    (at = {
      x: clamp(x, 0, Math.max(0, size.width - ANCHOR.width)),
      y: clamp(y, 0, Math.max(0, size.height - ANCHOR.height)),
    });

  const result = _derived(
    computePlacement({
      anchor: { left: at.x, top: at.y, ...ANCHOR },
      ...PANEL,
      viewport: { left: 0, top: 0, ...size },
      placement: placement ?? 'bottom-start',
      gap: 6 + ARROW * 0.7,
      rtl: false,
      padding: 8,
      crossAxisFallback,
      arrow: { size: ARROW, padding: ARROW },
    }),
  );

  function onPointerdown(event: PointerEvent) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    grab = { x: event.clientX - at.x, y: event.clientY - at.y };
  }
  function onPointermove(event: PointerEvent) {
    if (grab) moveTo(event.clientX - grab.x, event.clientY - grab.y);
  }
  function onKeydown(event: KeyboardEvent) {
    const step: Record<string, [number, number] | undefined> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    const delta = step[event.key];
    if (!delta) return;
    event.preventDefault();
    moveTo(at.x + delta[0], at.y + delta[1]);
  }

  return () => {
    const { x, y, side, align, arrowX, arrowY } = result;
    // 箭头在浮层朝着锚点的那条边上
    const arrow = {
      width: `${ARROW}px`,
      height: `${ARROW}px`,
      left: arrowX != null ? `${arrowX}px` : side === 'right' ? `${-ARROW / 2}px` : undefined,
      right: side === 'left' ? `${-ARROW / 2}px` : undefined,
      top: arrowY != null ? `${arrowY}px` : side === 'bottom' ? `${-ARROW / 2}px` : undefined,
      bottom: side === 'top' ? `${-ARROW / 2}px` : undefined,
    };
    return (
      <Flex direction="column" gap="sm">
        <Flex gap="md" align="center" wrap>
          <Select _value={placement} items={placements} size="sm" aria-label="想要的位置" />
          <Switch _value={crossAxisFallback} size="sm">
            上下都放不下时试左右（crossAxisFallback）
          </Switch>
        </Flex>
        <div ref={_toRef(stage)} {...css.attrs(styles.stage)}>
          <ButtonBase
            sx={styles.anchor}
            ripple={false}
            style={{
              left: `${at.x}px`,
              top: `${at.y}px`,
              width: `${ANCHOR.width}px`,
              height: `${ANCHOR.height}px`,
            }}
            aria-label="锚点：拖动，或用方向键移动"
            onPointerdown={onPointerdown}
            onPointermove={onPointermove}
            onPointerup={() => (grab = null)}
            onPointercancel={() => (grab = null)}
            onKeydown={onKeydown}
          >
            锚点
          </ButtonBase>
          <div
            {...css.attrs(styles.panel)}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${PANEL.width}px`,
              height: `${PANEL.height}px`,
            }}
            data-side={side}
          >
            {side}-{align}
            <span {...css.attrs(styles.arrow)} style={arrow} aria-hidden="true" />
          </div>
        </div>
        <Small tone="muted">
          结果：x {Math.round(x)}、y {Math.round(y)}，落在 {side} 侧
          {side === (placement ?? 'bottom-start').split('-')[0] ? '' : '（原来的一侧放不下，换了）'}
        </Small>
      </Flex>
    );
  };
});

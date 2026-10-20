/**
 * 拖动转动（Globe、ModelViewer 共用）：指针左右拖改 yaw、上下拖改 pitch（夹在 ±pitchLimit 内），
 * 松手后带着惯性慢慢回到自转；方向键也能转（nudge）。事件放在外层元素上，场景每帧调用 step 取用。
 *
 *   const orbit = createOrbit({ yaw: 0, pitch: 0.3 });
 *   <div {...orbit.handlers} />                  // 指针事件
 *   frame: ({ delta }) => { orbit.step(delta, speed); camera… orbit.yaw / orbit.pitch }
 */
import { shallowRef } from 'vue';

/** 松手后惯性转动的最快速度（弧度 / 秒） */
const MAX_SPIN = 3;
/** 拖动一像素转多少弧度 */
const PER_PIXEL = 0.006;

/** createOrbit 的选项 */
export interface OrbitOptions {
  /** 一开始的 yaw（弧度） */
  yaw: number;
  /** 一开始的 pitch（弧度） */
  pitch: number;
  /** pitch 的范围 ±pitchLimit（弧度），默认 1 */
  pitchLimit?: number;
}

/** 拖动转动的状态与事件 */
export interface Orbit {
  /** 当前的 yaw（弧度） */
  readonly yaw: number;
  /** 当前的 pitch（弧度） */
  readonly pitch: number;
  /** 正在拖动（响应式）：切换 grab / grabbing 光标 */
  readonly dragging: boolean;
  /** 放到外层元素上的指针事件 */
  readonly handlers: {
    onPointerdown: (event: PointerEvent) => void;
    onPointermove: (event: PointerEvent) => void;
    onPointerup: () => void;
    onPointercancel: () => void;
  };
  /** 直接转一下（键盘）：弧度 */
  nudge(yaw: number, pitch: number): void;
  /** 每帧调用：用掉拖动的量；没在拖时惯性回到 spin（弧度 / 秒）的自转。返回这一帧有没有变化 */
  step(delta: number, spin: number): boolean;
}

/** 拖动转动 */
export function createOrbit({ yaw, pitch, pitchLimit = 1 }: OrbitOptions): Orbit {
  const dragging = shallowRef(false);
  const pointer = { x: 0, y: 0, dx: 0, dy: 0 };
  let velocity = 0;
  const clampPitch = (value: number) => Math.max(-pitchLimit, Math.min(pitchLimit, value));

  const up = () => {
    dragging.value = false;
  };
  return {
    get yaw() {
      return yaw;
    },
    get pitch() {
      return pitch;
    },
    get dragging() {
      return dragging.value;
    },
    handlers: {
      onPointerdown(event) {
        if (event.button !== 0) return;
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        dragging.value = true;
      },
      onPointermove(event) {
        if (!dragging.value) return;
        pointer.dx += event.clientX - pointer.x;
        pointer.dy += event.clientY - pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      },
      onPointerup: up,
      onPointercancel: up,
    },
    nudge(byYaw, byPitch) {
      yaw += byYaw;
      pitch = clampPitch(pitch + byPitch);
    },
    step(delta, spin) {
      if (pointer.dx || pointer.dy) {
        const turn = pointer.dx * PER_PIXEL;
        yaw += turn;
        pitch = clampPitch(pitch + pointer.dy * PER_PIXEL);
        // 松手时的速度：几帧平滑一下，再封顶（一帧里拖了一大段时不至于疯转）
        const speed = delta > 0 ? turn / delta : 0;
        velocity = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, velocity * 0.5 + speed * 0.5));
        pointer.dx = 0;
        pointer.dy = 0;
        return true;
      }
      if (dragging.value) return false;
      // 松手后的惯性慢慢回到自转
      velocity += (spin - velocity) * Math.min(1, delta * 1.5);
      yaw += velocity * delta;
      return velocity !== 0;
    },
  };
}

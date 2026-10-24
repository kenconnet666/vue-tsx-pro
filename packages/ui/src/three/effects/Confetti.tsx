/**
 * 彩纸（庆祝）：trigger 每变一次放一批，彩纸从 origin 喷出，翻转着飘落后消失。参考 canvas-confetti 的 origin、angle、spread。
 *
 *   <Confetti trigger={paidCount} />                                   // 铺满视口，从中间偏下向上喷
 *   <Confetti trigger={n} origin={{ x: 0, y: 1 }} angle={60} />        // 从左下角斜着喷
 *   <div style="position: relative"><Confetti fullscreen={false} trigger={n} /></div>
 *
 * 只在彩纸还在飘的时候才有画布：不放的时候不占 WebGL 上下文。默认铺满视口、放在顶层（原生 popover，
 * 盖得住打开着的对话框），指针穿透；fullscreen 为 false 时铺满最近的定位父元素。
 * 颜色取主题的图表色板，换主题时跟着变；系统或主题要求减少动态效果时不放（onDone 照常调用）。画面是装饰，读屏跳过。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import { watch } from 'vue';
import { colors } from '../../config/theme/tokens';
import { toElement } from '../../utils/dom/element';
import { mergePartProps } from '../../utils/props';
import { EffectSurface, type EffectProps } from '../core/EffectSurface';
import type { ThreeCanvasProps } from '../core/ThreeCanvas';

/** 彩纸的默认色板：图表色板的前六个 */
export const CONFETTI_PALETTE: readonly string[] = [
  colors.chart1,
  colors.chart2,
  colors.chart3,
  colors.chart4,
  colors.chart5,
  colors.chart6,
];

/** 喷出的位置：相对区域的比例，x 从左到右、y 从上到下（0–1） */
export interface ConfettiOrigin {
  /** 从左（0）到右（1） */
  x: number;
  /** 从上（0）到下（1） */
  y: number;
}

/** 未声明的属性落到外层 div 上 */
export interface ConfettiProps extends Omit<EffectProps, 'children' | 'fallback' | 'paused'> {
  /** 每变一次放一批（挂载时的初始值不放）：写成计数、时间戳或任何会变的值 */
  trigger?: unknown;
  /**
   * 喷出的位置
   * @default { x: 0.5, y: 0.6 }
   */
  origin?: ConfettiOrigin;
  /**
   * 喷出的方向（度），90 是正上方，0 向右
   * @default 90
   */
  angle?: number;
  /**
   * 散开的角度（度）
   * @default 70
   */
  spread?: number;
  /**
   * 每批的数量
   * @default 160
   */
  count?: number;
  /**
   * 初速度的倍数
   * @default 1
   */
  velocity?: number;
  /**
   * 重力的倍数
   * @default 1
   */
  gravity?: number;
  /** 色板（token 或 CSS 颜色）；变了下一次放时生效 */
  palette?: readonly string[];
  /**
   * 铺满视口，放在顶层；false 时铺满最近的定位父元素
   * @default true
   */
  fullscreen?: boolean;
  /** 这几批彩纸都落完（或减少动态效果时没有放）后调用 */
  onDone?: () => void;
}

/** Confetti 的样式：root、fullscreen */
export const confettiStyles = css.create({
  root: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  // 原生 popover 的默认样式（居中、边框、底色）改成铺满视口的透明层
  fullscreen: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    maxWidth: 'none',
    maxHeight: 'none',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});

/** 同时在飘的彩纸上限 */
const MAX_PIECES = 900;
/** 空气阻力（每秒速度剩下 e^-DRAG）：喷出后很快慢下来，落得轻飘 */
const DRAG = 2.6;
/** 一片彩纸飘多久（秒），最后一段缩小消失 */
const LIFETIME = [3.2, 4.6] as const;
const SHRINK = 0.6;
/** 重力：每秒加速多少个区域高度 */
const GRAVITY = 1.1;

/** 一批：放的那一刻的参数 */
interface Burst {
  origin: ConfettiOrigin;
  angle: number;
  spread: number;
  count: number;
  velocity: number;
  gravity: number;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

/** 彩纸 */
export const Confetti = _component(
  ({
    trigger,
    origin = { x: 0.5, y: 0.6 },
    angle = 90,
    spread = 70,
    count = 160,
    velocity = 1,
    gravity = 1,
    palette = CONFETTI_PALETTE,
    fullscreen = true,
    onDone,
    ...rest
  }: ConfettiProps) => {
    // 还没放出去的批次：画布建好后在下一帧里放
    const pending: Burst[] = [];
    let active = _state(false);

    watch(
      () => trigger,
      () => {
        pending.push({ origin, angle, spread, count, velocity, gravity });
        active = true;
      },
    );

    function finish() {
      // 在帧回调里：等这一帧结束再卸载画布
      queueMicrotask(() => {
        if (pending.length) return;
        active = false;
        onDone?.();
      });
    }

    /** 顶层显示：卸载时元素随之移除，不用手动收起 */
    function showOnTop(element: unknown) {
      const root = toElement(element);
      if (!fullscreen || !root || !('showPopover' in root)) return;
      // 顶层里后进的在上面：同一刻打开的对话框（支付成功）会盖住彩纸，等这一帧过去再进顶层
      requestAnimationFrame(() => {
        if (root.isConnected && !root.matches(':popover-open')) root.showPopover();
      });
    }

    return () =>
      active && (
        <EffectSurface
          {...rest}
          {...{ ref: showOnTop }}
          sx={[confettiStyles.root, fullscreen && confettiStyles.fullscreen, rest.sx]}
          popover={fullscreen ? 'manual' : undefined}
          aria-hidden="true"
          // 没有 WebGL：什么也不画（不要默认的渐变铺满屏幕），直接收尾
          fallback={false}
          propsCanvas={mergePartProps<Partial<ThreeCanvasProps>>({}, rest.propsCanvas, {
            onStatusChange: (status) => {
              if (status !== 'fallback') return;
              pending.length = 0;
              finish();
            },
          })}
          sceneKey={palette.join(',')}
          setup={({ scene, size: area, still, themeColorList }) => {
            if (still) {
              pending.length = 0;
              finish();
              return;
            }
            const camera = new OrthographicCamera(0, 1, 1, 0, -500, 500);
            const tints = themeColorList(palette);

            const mesh = new InstancedMesh(
              new PlaneGeometry(1, 1),
              new MeshBasicMaterial({ side: DoubleSide }),
              MAX_PIECES,
            );
            mesh.frustumCulled = false;
            mesh.count = 0;
            scene.add(mesh);

            // 每片的状态：位置、速度、尺寸、翻转轴与角度、摆动、寿命、颜色
            const position = new Float32Array(MAX_PIECES * 2);
            const speed = new Float32Array(MAX_PIECES * 2);
            const shape = new Float32Array(MAX_PIECES * 2);
            const axis = new Float32Array(MAX_PIECES * 3);
            const turn = new Float32Array(MAX_PIECES * 2);
            const sway = new Float32Array(MAX_PIECES * 2);
            const life = new Float32Array(MAX_PIECES * 2);
            const fall = new Float32Array(MAX_PIECES);
            const tint = new Uint8Array(MAX_PIECES);
            let alive = 0;

            function launch(burst: Burst) {
              const x0 = burst.origin.x * area.width;
              const y0 = (1 - burst.origin.y) * area.height;
              // 初速度与重力都按区域高度（H）：大小不同的区域里看起来一样，最快的升到 0.9H 左右、最慢的 0.3H
              const base = area.height * 3.2 * burst.velocity;
              for (let n = 0; n < burst.count && alive < MAX_PIECES; n++, alive++) {
                const i = alive;
                const direction =
                  ((burst.angle + random(-burst.spread / 2, burst.spread / 2)) * Math.PI) / 180;
                const v = base * random(0.45, 1);
                position[i * 2] = x0;
                position[i * 2 + 1] = y0;
                speed[i * 2] = Math.cos(direction) * v;
                speed[i * 2 + 1] = Math.sin(direction) * v;
                const width = random(7, 12);
                shape[i * 2] = width;
                shape[i * 2 + 1] = width * random(0.45, 0.8);
                const a = new Vector3(random(-1, 1), random(-1, 1), random(-1, 1)).normalize();
                axis.set([a.x, a.y, a.z], i * 3);
                turn[i * 2] = random(0, Math.PI * 2);
                turn[i * 2 + 1] = random(6, 14) * (Math.random() < 0.5 ? -1 : 1);
                sway[i * 2] = random(0, Math.PI * 2);
                sway[i * 2 + 1] = random(20, 60);
                life[i * 2] = 0;
                life[i * 2 + 1] = random(...LIFETIME);
                fall[i] = burst.gravity;
                tint[i] = Math.floor(Math.random() * tints.length);
              }
            }

            /** 把第 to 片换成第 from 片（落完的那片用最后一片补上，活着的始终在前面） */
            function move(from: number, to: number) {
              for (const [array, size] of [
                [position, 2],
                [speed, 2],
                [shape, 2],
                [axis, 3],
                [turn, 2],
                [sway, 2],
                [life, 2],
              ] as const) {
                array.copyWithin(to * size, from * size, from * size + size);
              }
              fall[to] = fall[from]!;
              tint[to] = tint[from]!;
            }

            const matrix = new Matrix4();
            const rotation = new Quaternion();
            const scale = new Vector3();
            const at = new Vector3();
            const normal = new Vector3();
            const shade = new Color();

            return {
              resize: (next, context) => {
                camera.right = next.width;
                camera.top = next.height;
                camera.updateProjectionMatrix();
                context.camera = camera;
              },
              frame: ({ delta }) => {
                // 画布刚建好的第一帧可能还没量到尺寸：量到了再放
                while (pending.length && area.height > 0) launch(pending.shift()!);
                const damping = Math.exp(-DRAG * delta);
                for (let i = 0; i < alive; i++) {
                  life[i * 2]! += delta;
                  const age = life[i * 2]!;
                  const lifetime = life[i * 2 + 1]!;
                  if (age >= lifetime || position[i * 2 + 1]! < -40) {
                    move(--alive, i--);
                    continue;
                  }
                  speed[i * 2]! *= damping;
                  speed[i * 2 + 1] =
                    speed[i * 2 + 1]! * damping - area.height * GRAVITY * fall[i]! * delta;
                  // 左右摆动：像纸片在空气里飘
                  sway[i * 2]! += delta * 4;
                  position[i * 2]! +=
                    (speed[i * 2]! + Math.sin(sway[i * 2]!) * sway[i * 2 + 1]!) * delta;
                  position[i * 2 + 1]! += speed[i * 2 + 1]! * delta;
                  turn[i * 2]! += turn[i * 2 + 1]! * delta;

                  rotation.setFromAxisAngle(
                    at.set(axis[i * 3]!, axis[i * 3 + 1]!, axis[i * 3 + 2]!),
                    turn[i * 2]!,
                  );
                  const fade = Math.min(1, (lifetime - age) / SHRINK);
                  scale.set(shape[i * 2]! * fade, shape[i * 2 + 1]! * fade, 1);
                  matrix.compose(
                    at.set(position[i * 2]!, position[i * 2 + 1]!, 0),
                    rotation,
                    scale,
                  );
                  mesh.setMatrixAt(i, matrix);
                  // 翻到侧面时暗一些：正对屏幕最亮，看起来是在翻转的纸片
                  const facing = Math.abs(normal.set(0, 0, 1).applyQuaternion(rotation).z);
                  mesh.setColorAt(
                    i,
                    shade.copy(tints[tint[i]!]!).multiplyScalar(0.55 + 0.45 * facing),
                  );
                }
                mesh.count = alive;
                mesh.instanceMatrix.needsUpdate = true;
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
                if (alive === 0) finish();
              },
            };
          }}
        />
      );
  },
);

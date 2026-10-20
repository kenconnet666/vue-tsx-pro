/**
 * 点阵地球（div）：陆地画成一层细密的点，可以标注地点（markers，向外扩散的光圈），两地之间画弧线（arcs，光点沿弧线流动）；
 * 缓缓自转，可以拖动转动（松手后带惯性）。参考 GitHub 首页的地球、cobe。
 *
 *   <Globe markers={[{ lat: 31.23, lng: 121.47 }]} arcs={[{ from: [31.23, 121.47], to: [37.77, -122.42] }]} />
 *   <Globe center={{ lat: 30, lng: 110 }} rotationSpeed={0} sx={styles.globe} />
 *
 * 陆地来自 Natural Earth 1:110m 的世界地图（1° 的位图，见 land.ts）；点的疏密按画质档位。颜色跟随主题：
 * 陆地用次要文字色，标注、弧线与大气光晕用品牌色（可以单独给 color）。默认是正方形，尺寸由使用方决定。
 * 减少动态效果时停在一帧，不自转、弧线不流动。画面是装饰；要让读屏知道内容时给 propsCanvas 写 aria-label。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）、Content（div，有内容时才有）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Points,
  ShaderMaterial,
  PlaneGeometry,
  Vector3,
  type Color,
} from 'three';
import { colors } from '../../config/theme/tokens.stylex';
import { EffectSurface, type EffectProps } from '../core/EffectSurface';
import { createOrbit } from '../core/orbit';
import { LAND_BITS, LAND_HEIGHT, LAND_WIDTH } from './land';

/** 地图上的一个点：纬度（北正南负）、经度（东正西负），单位度 */
export interface GeoPoint {
  /** 纬度：北纬为正，-90 到 90 */
  lat: number;
  /** 经度：东经为正，-180 到 180 */
  lng: number;
}

/** 标注的地点 */
export interface GlobeMarker extends GeoPoint {
  /** 大小的倍数，默认 1 */
  size?: number;
  /** 颜色（token 或 CSS 颜色）；不写时用 markerColor */
  color?: string;
}

/** 两地之间的弧线：[纬度, 经度] */
export interface GlobeArc {
  /** 起点 [纬度, 经度] */
  from: readonly [number, number];
  /** 终点 [纬度, 经度] */
  to: readonly [number, number];
}

/** 未声明的属性落到外层 div 上 */
export interface GlobeProps extends EffectProps {
  /** 标注的地点 */
  markers?: readonly GlobeMarker[];
  /** 弧线 */
  arcs?: readonly GlobeArc[];
  /**
   * 一开始正对着的地方
   * @default { lat: 20, lng: 100 }
   */
  center?: GeoPoint;
  /**
   * 自转速度（度 / 秒，向东为正）；0 时不自转
   * @default 6
   */
  rotationSpeed?: number;
  /**
   * 可以拖动转动
   * @default true
   */
  draggable?: boolean;
  /**
   * 陆地的点有多密（1 约一万个点，按画质档位再缩放）
   * @default 1
   */
  density?: number;
  /** 陆地点的颜色，默认次要文字色 */
  landColor?: string;
  /** 标注与弧线的颜色，默认品牌色 */
  markerColor?: string;
  /**
   * 大气光晕
   * @default true
   */
  glow?: boolean;
}

/** Globe 的样式：root、draggable、dragging */
export const globeStyles = stylex.create({
  root: { aspectRatio: '1', width: '100%' },
  draggable: { cursor: 'grab', touchAction: 'pan-y' },
  dragging: { cursor: 'grabbing' },
});

const DEG = Math.PI / 180;
/** 地球的轮廓占画面短边的比例：外面留给大气光晕 */
const FIT = 0.8;
const FOV = 40;

/** 经纬度 → 球面上的点（半径 radius）：经度 0 朝向 +z（正对相机），北极朝 +y */
export function latLngToVector(lat: number, lng: number, radius = 1, target = new Vector3()) {
  const phi = lat * DEG;
  const theta = lng * DEG;
  return target.set(
    radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(theta),
  );
}

/** 陆地位图：某个经纬度是不是陆地 */
const landBits = (() => {
  let bytes: Uint8Array | undefined;
  return (lat: number, lng: number) => {
    bytes ??= Uint8Array.from(atob(LAND_BITS), (char) => char.charCodeAt(0));
    const row = Math.min(LAND_HEIGHT - 1, Math.max(0, Math.floor(90 - lat)));
    const column = (((Math.floor(lng + 180) % LAND_WIDTH) + LAND_WIDTH) % LAND_WIDTH) | 0;
    const index = row * LAND_WIDTH + column;
    return (bytes[index >> 3]! & (1 << (index & 7))) !== 0;
  };
})();

// 点：正面清楚、转到背面淡出；大小随透视缩放
const dotVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uScale;
attribute float aSize;
attribute float aPhase;
varying float vFacing;
varying float vPhase;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vFacing = dot(normalize(world.xyz), normalize(cameraPosition - world.xyz));
  vPhase = aPhase;
  vec4 view = viewMatrix * world;
  gl_PointSize = aSize * uScale * uPixelRatio / -view.z;
  gl_Position = projectionMatrix * view;
}
`;

const landFragment = /* glsl */ `
uniform vec3 uColor;
varying float vFacing;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.3, d) * smoothstep(-0.05, 0.35, vFacing) * 0.85;
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
  #include <premultiplied_alpha_fragment>
}
`;

// 标注：实心的点加一圈向外扩散、渐淡的光圈
const markerFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying float vFacing;
varying float vPhase;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = smoothstep(0.3, 0.2, d);
  float wave = fract(uTime * 0.6 + vPhase);
  float ring = smoothstep(0.08, 0.0, abs(d - wave)) * (1.0 - wave);
  float alpha = max(core, ring * 0.9) * smoothstep(-0.1, 0.25, vFacing);
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
  #include <premultiplied_alpha_fragment>
}
`;

// 弧线：整条淡淡的底色，加一段从起点流向终点的亮光
const arcVertex = /* glsl */ `
attribute float aT;
attribute float aPhase;
varying float vT;
varying float vPhase;
varying float vFacing;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vFacing = dot(normalize(world.xyz), normalize(cameraPosition - world.xyz));
  vT = aT;
  vPhase = aPhase;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const arcFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying float vT;
varying float vPhase;
varying float vFacing;
void main() {
  float head = fract(uTime * 0.35 + vPhase) * 1.4 - 0.2;
  float glow = exp(-pow((vT - head) * 7.0, 2.0));
  float alpha = (0.18 + 0.82 * glow) * smoothstep(-0.25, 0.2, vFacing);
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
  #include <premultiplied_alpha_fragment>
}
`;

// 大气：正对相机的一块方形，按到球心的距离画径向的光（单位是地球半径，uEdge 是轮廓所在的半径）：
// 球面里只有一层淡淡的雾，轮廓外一圈亮边向外淡出
const glowVertex = /* glsl */ `
varying vec2 vPosition;
void main() {
  vPosition = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uEdge;
uniform float uLimit;
varying vec2 vPosition;
void main() {
  float r = length(vPosition) / uEdge;
  float inner = smoothstep(0.55, 1.0, r) * 0.22;
  // 到画布边缘（短边方向在 uLimit 处）之前淡完，不留方形的边
  float outer = exp(-(r - 1.0) * 9.0) * smoothstep(uLimit, uLimit - 0.12, r);
  float intensity = r < 1.0 ? inner : outer * 0.75;
  // 先转色彩空间再乘强度（预乘）：反过来的话，sRGB 会把很淡的颜色提亮，方形的边缘就露出来了
  gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb, 1.0) * intensity;
}
`;

/** 透明叠加的着色器材质 */
const overlay = (params: ConstructorParameters<typeof ShaderMaterial>[0]) =>
  new ShaderMaterial({
    ...params,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
  });

/** 两地之间的大圆弧，抬离地面（越远抬得越高），采样成 segments 段 */
function arcPoints({ from, to }: GlobeArc, segments: number): Vector3[] {
  const a = latLngToVector(from[0], from[1]);
  const b = latLngToVector(to[0], to[1]);
  const angle = a.angleTo(b);
  const lift = 0.06 + angle * 0.22;
  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // 球面线性插值（slerp），再按 sin 抬高
    const point =
      angle < 1e-6
        ? a.clone()
        : a
            .clone()
            .multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle))
            .add(b.clone().multiplyScalar(Math.sin(t * angle) / Math.sin(angle)));
    points.push(point.normalize().multiplyScalar(1 + lift * Math.sin(Math.PI * t)));
  }
  return points;
}

/** 点阵地球 */
export const Globe = _component(
  ({
    markers = [],
    arcs = [],
    center = { lat: 20, lng: 100 },
    rotationSpeed = 6,
    draggable = true,
    density = 1,
    landColor = colors.textMuted,
    markerColor = colors.accent,
    glow = true,
    ...rest
  }: GlobeProps) => {
    // 朝向：一开始正对 center；拖动左右改 yaw、上下改 pitch，松手后带惯性回到自转
    const orbit = createOrbit({ yaw: -center.lng * DEG, pitch: center.lat * DEG });

    return () => (
      <EffectSurface
        {...rest}
        sx={[
          globeStyles.root,
          draggable && globeStyles.draggable,
          orbit.dragging && globeStyles.dragging,
          rest.sx,
        ]}
        {...(draggable ? orbit.handlers : {})}
        sceneKey={`${density}|${glow}|${JSON.stringify(markers)}|${JSON.stringify(arcs)}`}
        setup={({ scene, quality, still, themeColors }) => {
          const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
          const palette = themeColors({ land: landColor, marker: markerColor }) as {
            land: Color;
            marker: Color;
          };
          // 标注按颜色分组：同色的一次画完
          const byColor = new Map<string, GlobeMarker[]>();
          for (const marker of markers) {
            const color = marker.color ?? markerColor;
            byColor.set(color, [...(byColor.get(color) ?? []), marker]);
          }
          const markerTints = themeColors(
            Object.fromEntries([...byColor.keys()].map((color, index) => [index, color])),
          ) as Record<string, Color>;

          const globe = new Group();
          scene.add(globe);
          const uniforms = {
            uPixelRatio: { value: 1 },
            uScale: { value: 1 },
            uTime: { value: 0 },
          };

          // 陆地：斐波那契球面上均匀撒点，落在陆地上的留下
          const candidates = Math.round(24_000 * density * Math.min(1, quality.density));
          const land: number[] = [];
          const golden = Math.PI * (3 - Math.sqrt(5));
          const at = new Vector3();
          for (let i = 0; i < candidates; i++) {
            const y = 1 - (2 * (i + 0.5)) / candidates;
            const lat = Math.asin(y) / DEG;
            const lng = (((((i * golden) / DEG) % 360) + 360) % 360) - 180;
            if (!landBits(lat, lng)) continue;
            latLngToVector(lat, lng, 1, at);
            land.push(at.x, at.y, at.z);
          }
          const landGeometry = new BufferGeometry();
          landGeometry.setAttribute('position', new BufferAttribute(new Float32Array(land), 3));
          const landCount = land.length / 3;
          landGeometry.setAttribute(
            'aSize',
            new BufferAttribute(new Float32Array(landCount).fill(2.2), 1),
          );
          landGeometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(landCount), 1));
          globe.add(
            new Points(
              landGeometry,
              overlay({
                vertexShader: dotVertex,
                fragmentShader: landFragment,
                uniforms: { ...uniforms, uColor: { value: palette.land } },
              }),
            ),
          );

          // 标注：实心点加扩散的光圈
          [...byColor.values()].forEach((list, group) => {
            const positions = new Float32Array(list.length * 3);
            list.forEach((marker, i) => {
              latLngToVector(marker.lat, marker.lng, 1.005, at).toArray(positions, i * 3);
            });
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(positions, 3));
            geometry.setAttribute(
              'aSize',
              new BufferAttribute(
                Float32Array.from(list, (marker) => 22 * (marker.size ?? 1)),
                1,
              ),
            );
            geometry.setAttribute(
              'aPhase',
              new BufferAttribute(
                Float32Array.from(list, (_, i) => (i * 0.37) % 1),
                1,
              ),
            );
            globe.add(
              new Points(
                geometry,
                overlay({
                  vertexShader: dotVertex,
                  fragmentShader: markerFragment,
                  uniforms: { ...uniforms, uColor: { value: markerTints[group] } },
                }),
              ),
            );
          });

          // 弧线：所有弧线放在同一组线段里，一次画完
          if (arcs.length) {
            const SEGMENTS = 64;
            const positions: number[] = [];
            const ts: number[] = [];
            const phases: number[] = [];
            arcs.forEach((arc, index) => {
              const points = arcPoints(arc, SEGMENTS);
              const phase = (index * 0.29) % 1;
              for (let i = 0; i < SEGMENTS; i++) {
                positions.push(...points[i]!.toArray(), ...points[i + 1]!.toArray());
                ts.push(i / SEGMENTS, (i + 1) / SEGMENTS);
                phases.push(phase, phase);
              }
            });
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
            geometry.setAttribute('aT', new BufferAttribute(new Float32Array(ts), 1));
            geometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(phases), 1));
            globe.add(
              new LineSegments(
                geometry,
                overlay({
                  vertexShader: arcVertex,
                  fragmentShader: arcFragment,
                  uniforms: { uColor: { value: palette.marker }, uTime: uniforms.uTime },
                }),
              ),
            );
          }

          // 透视下球的轮廓比半径大一点：相机距离 d 时在 z = 0 平面上是 d / √(d² − 1)
          const edge = { value: 1 };
          if (glow) {
            // 不随地球转：相机在 z 轴上，xy 平面上的方形总是正对相机
            const atmosphere = new Mesh(
              new PlaneGeometry(3, 3),
              overlay({
                vertexShader: glowVertex,
                fragmentShader: glowFragment,
                uniforms: {
                  uColor: { value: palette.marker },
                  uEdge: edge,
                  uLimit: { value: 1 / FIT },
                },
              }),
            );
            atmosphere.renderOrder = -1;
            scene.add(atmosphere);
          }

          const apply = () => globe.rotation.set(orbit.pitch, orbit.yaw, 0, 'XYZ');
          apply();

          return {
            resize: (size, context) => {
              camera.aspect = size.width / Math.max(size.height, 1);
              // 轮廓的直径占短边的 FIT：相机距离 d 处的轮廓半径是 d / √(d² − 1)，
              // 要它等于 FIT · d · tan(fov / 2)，解出 d（宽比高窄时再拉远）
              const t = FIT * Math.tan((FOV * DEG) / 2);
              const fitHeight = Math.sqrt(1 + 1 / (t * t));
              camera.position.z = fitHeight * Math.max(1, 1 / camera.aspect);
              camera.updateProjectionMatrix();
              context.camera = camera;
              const d = camera.position.z;
              edge.value = d / Math.sqrt(d * d - 1);
              uniforms.uPixelRatio.value = size.pixelRatio;
              // 点的大小（CSS 像素）在 z = 相机距离处不变：/ -view.z 的透视缩放乘回来，再按画布大小缩放
              uniforms.uScale.value = (camera.position.z * Math.min(size.width, size.height)) / 360;
            },
            frame: ({ time, delta }) => {
              uniforms.uTime.value = time;
              if (still) return;
              orbit.step(delta, rotationSpeed * DEG);
              apply();
            },
          };
        }}
      />
    );
  },
);

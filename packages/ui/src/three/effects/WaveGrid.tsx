/**
 * 线框地形（div）：一张向远处延伸的网格随噪声起伏，像缓慢呼吸的山丘；指针所在的位置隆起。
 * 颜色按高度在色板里取（低处第一个颜色、高处最后一个），远处渐隐到透明。
 *
 *   <WaveGrid sx={styles.banner} />
 *   <WaveGrid variant="dots" palette={[colors.chart2, colors.accent]} />
 *
 * 背景透明；细分程度随画质档位变化。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）、Content（div）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import {
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { colors } from '../../config/theme/tokens.stylex';
import { EffectSurface, type EffectProps } from '../core/EffectSurface';
import { shaderChunks, THEME_PALETTE_SIZE } from '../core/shaders';

/** 线框地形的默认色板：低处青、高处品牌色 */
export const WAVE_GRID_PALETTE: readonly string[] = [colors.chart6, colors.accent, colors.chart5];

/** 网格的画法 */
export interface WaveGridVariants {
  /** 网格线 */
  grid: unknown;
  /** 只画交点 */
  dots: unknown;
}

/** 未声明的属性落到外层 div 上 */
export interface WaveGridProps extends EffectProps {
  /**
   * 画法：网格线或只画交点；变了会重建
   * @default 'grid'
   */
  variant?: keyof WaveGridVariants;
  /** 色板（token 或 CSS 颜色，2–6 个），按高度取色；变了会重建 */
  palette?: readonly string[];
  /**
   * 起伏的速度
   * @default 1
   */
  speed?: number;
  /**
   * 起伏的高度
   * @default 1
   */
  amplitude?: number;
  /**
   * 指针所在的位置隆起
   * @default true
   */
  interactive?: boolean;
}

/** 网格的大小（世界单位）与最高画质下每边的格数 */
const WIDTH = 16;
const DEPTH = 12;
const CELLS = 72;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform vec3 uPointer;
uniform float uPointSize;
varying float vHeight;
varying float vDepth;
${shaderChunks.simplexNoise}
${shaderChunks.fbm}
void main() {
  vec3 p = position;
  float wave = fbm(vec3(p.x * 0.18, p.y * 0.22 - uTime * 0.15, uTime * 0.05));
  float bump = exp(-distance(p.xy, uPointer.xy) * 0.6) * uPointer.z * 1.4;
  p.z = (wave * 1.6 + bump) * uAmplitude;
  vHeight = clamp(wave * 0.9 + 0.5 + bump * 0.4, 0.0, 1.0);
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vDepth = -view.z;
  gl_PointSize = uPointSize * (8.0 / vDepth);
  gl_Position = projectionMatrix * view;
}
`;

const fragmentShader = /* glsl */ `
varying float vHeight;
varying float vDepth;
${shaderChunks.themePalette}
void main() {
  float fade = 1.0 - smoothstep(9.0, 17.0, vDepth);
  gl_FragColor = vec4(themePalette(vHeight), fade * (0.35 + vHeight * 0.65));
  #include <colorspace_fragment>
  #include <premultiplied_alpha_fragment>
}
`;

/** 网格的顶点：dots 时是交点，grid 时是横竖两组线段 */
function gridGeometry(cells: number, variant: keyof WaveGridVariants) {
  const columns = Math.round(cells * (WIDTH / DEPTH));
  const at = (column: number, row: number) => [
    (column / columns - 0.5) * WIDTH,
    (row / cells - 0.5) * DEPTH,
    0,
  ];
  const vertices: number[] = [];
  for (let row = 0; row <= cells; row++) {
    for (let column = 0; column <= columns; column++) {
      if (variant === 'dots') vertices.push(...at(column, row));
      else {
        if (column < columns) vertices.push(...at(column, row), ...at(column + 1, row));
        if (row < cells) vertices.push(...at(column, row), ...at(column, row + 1));
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  return geometry;
}

/** 线框地形：随噪声起伏的网格，指针处隆起 */
export const WaveGrid = _component(
  ({
    variant = 'grid',
    palette = WAVE_GRID_PALETTE,
    speed = 1,
    amplitude = 1,
    interactive = true,
    ...rest
  }: WaveGridProps) => {
    return () => (
      <EffectSurface
        {...rest}
        sceneKey={`${variant}|${palette.join(',')}`}
        setup={({ scene, camera, quality, size, pointer, themeColors }) => {
          const sources = palette.slice(0, THEME_PALETTE_SIZE);
          const themed = themeColors(Object.fromEntries(sources.map((c, i) => [i, c])));
          const list = sources.map((_, index) => themed[index]!);
          while (list.length < THEME_PALETTE_SIZE) list.push(list.at(-1)!);
          const uniforms = {
            uTime: { value: 0 },
            uAmplitude: { value: amplitude },
            uPointer: { value: new Vector3() },
            uPointSize: { value: 2 },
            uColors: { value: list },
            uColorCount: { value: Math.max(1, sources.length) },
          };
          const material = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            transparent: true,
            premultipliedAlpha: true,
            depthWrite: false,
          });
          const geometry = gridGeometry(Math.round(CELLS * quality.density), variant);
          const mesh =
            variant === 'dots'
              ? new Points(geometry, material)
              : new LineSegments(geometry, material);
          mesh.rotation.x = -Math.PI * 0.42;
          mesh.position.y = -0.6;
          scene.add(mesh);
          camera.position.set(0, 1.4, 6.5);
          camera.lookAt(0, -0.4, 0);
          // 指针在网格平面上的落点：近似为按屏幕位置映射到网格的范围
          return {
            frame: ({ time }) => {
              uniforms.uTime.value = time * speed;
              uniforms.uAmplitude.value = amplitude;
              uniforms.uPointer.value.set(
                pointer.x * WIDTH * 0.35,
                (pointer.y + 0.3) * DEPTH * 0.45,
                interactive ? pointer.strength : 0,
              );
            },
            resize: (next) =>
              (uniforms.uPointSize.value = 2.2 * next.pixelRatio * (size.height / 400 || 1)),
          };
        }}
      />
    );
  },
);

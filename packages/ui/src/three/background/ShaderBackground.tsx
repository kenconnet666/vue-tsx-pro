/**
 * 着色器背景：写一个片段着色器函数，主题色、时间、尺寸、指针自动作为 uniform 传入，画满整块区域。
 * MeshGradient、AuroraBackground 都建在它上面。
 *
 *   <ShaderBackground
 *     sx={styles.hero}
 *     fragmentShader={`
 *       vec4 shade(vec2 uv) {
 *         float n = fbm(vec3(uv * 3.0, uTime * 0.2)) * 0.5 + 0.5;
 *         return vec4(themePalette(n), 1.0);
 *       }
 *     `}
 *   >
 *     <h1>内容叠在上面</h1>
 *   </ShaderBackground>
 *
 * 着色器只写 `vec4 shade(vec2 uv)`（uv 是 0–1，左下角为原点；返回不预乘的颜色与透明度），可以直接用：
 * - uTime（秒，已乘 speed）、uResolution（CSS 像素）、uPointer（xy 是 -1–1 的指针位置，z 是指针在区域内的程度 0–1）、
 *   uDark（暗色主题为 1）、uBackground（主题背景色）；
 * - palette 的颜色（uColors、uColorCount）与 themePalette(t)、snoise、fbm（shaderChunks）。
 * 颜色在线性空间里计算，输出时按渲染器的色彩空间转换。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3, type IUniform } from 'three';
import { useConfig } from '../../config/context';
import { colors } from '../../config/theme/tokens.stylex';
import { EffectSurface, type EffectProps } from '../core/EffectSurface';
import { shaderChunks, THEME_PALETTE_SIZE } from '../core/shaders';

/** 着色器背景的默认色板：品牌色加图表色板里的紫、粉、青 */
export const SHADER_PALETTE: readonly string[] = [
  colors.accent,
  colors.chart5,
  colors.chart4,
  colors.chart6,
];

/** 未声明的属性落到外层 div 上 */
export interface ShaderBackgroundProps extends EffectProps {
  /** 片段着色器：定义 `vec4 shade(vec2 uv)`，可用的 uniform 见文件开头；变了会重建 */
  fragmentShader: string;
  /** 额外的 uniform：改它们的 value 就能实时生效 */
  uniforms?: Record<string, IUniform>;
  /** 色板（token 或 CSS 颜色，最多 6 个），传给 uColors 与 themePalette；默认品牌色加图表色板；变了会重建 */
  palette?: readonly string[];
  /**
   * 时间流速：uTime = 秒数 × speed
   * @default 1
   */
  speed?: number;
  /**
   * 跟随指针（uPointer）；关掉时 uPointer.z 始终为 0
   * @default true
   */
  interactive?: boolean;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** 把使用方的 shade 函数包成完整的片段着色器 */
function fragment(source: string) {
  return /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uPointer;
uniform float uDark;
uniform vec3 uBackground;
varying vec2 vUv;
${shaderChunks.simplexNoise}
${shaderChunks.fbm}
${shaderChunks.themePalette}
${source}
void main() {
  gl_FragColor = shade(vUv);
  #include <colorspace_fragment>
  #include <premultiplied_alpha_fragment>
}
`;
}

/** 着色器背景：主题色、时间、指针自动传入的全屏片段着色器 */
export const ShaderBackground = _component(
  ({
    fragmentShader,
    uniforms,
    palette = SHADER_PALETTE,
    speed = 1,
    interactive = true,
    ...rest
  }: ShaderBackgroundProps) => {
    const config = useConfig();

    return () => (
      <EffectSurface
        {...rest}
        sceneKey={`${fragmentShader}|${palette.join(',')}`}
        setup={({ scene, size, pointer, themeColors }) => {
          const themed = themeColors({
            background: colors.background,
            ...Object.fromEntries(palette.slice(0, THEME_PALETTE_SIZE).map((c, i) => [i, c])),
          }) as Record<string, Color>;
          const list = palette.slice(0, THEME_PALETTE_SIZE).map((_, index) => themed[index]!);
          // uColors 的长度固定：不足的用最后一个补齐
          while (list.length < THEME_PALETTE_SIZE) list.push(list.at(-1) ?? themed.background!);
          const builtin = {
            uTime: { value: 0 },
            uResolution: { value: new Vector2(size.width, size.height) },
            uPointer: { value: new Vector3() },
            uDark: { value: 0 },
            uBackground: { value: themed.background },
            uColors: { value: list },
            uColorCount: { value: Math.max(1, Math.min(palette.length, THEME_PALETTE_SIZE)) },
          };
          const material = new ShaderMaterial({
            vertexShader,
            fragmentShader: fragment(fragmentShader),
            uniforms: { ...builtin, ...uniforms },
            transparent: true,
            premultipliedAlpha: true,
            depthTest: false,
            depthWrite: false,
          });
          const quad = new Mesh(new PlaneGeometry(2, 2), material);
          quad.frustumCulled = false;
          scene.add(quad);
          return {
            frame: ({ time }) => {
              builtin.uTime.value = time * speed;
              builtin.uPointer.value.set(pointer.x, pointer.y, interactive ? pointer.strength : 0);
              builtin.uDark.value = config.theme.colorScheme === 'dark' ? 1 : 0;
            },
            resize: (next) => builtin.uResolution.value.set(next.width, next.height),
          };
        }}
      />
    );
  },
);

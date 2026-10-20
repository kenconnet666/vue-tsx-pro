/**
 * 流动的网格渐变（div）：色板里的每个颜色是一团缓慢游走的光斑，彼此柔和地融合，再加一层噪声扭曲与细颗粒。
 * 适合首页标题区、登录页、卡片的封面。
 *
 *   <MeshGradient sx={styles.hero}>
 *     <h1>标题</h1>
 *   </MeshGradient>
 *
 * 默认色板是品牌色加图表色板里的几个颜色，切换主题、改品牌色时原地过渡；指针靠近时品牌色那一团被轻轻吸过去。
 * 画面是不透明的：上面的文字自己保证对比度（如加一层半透明的底）。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）、Content（div）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { ShaderBackground, SHADER_PALETTE } from './ShaderBackground';
import type { EffectProps } from '../core/EffectSurface';

/** 未声明的属性落到外层 div 上 */
export interface MeshGradientProps extends EffectProps {
  /** 色板（token 或 CSS 颜色，2–6 个），默认品牌色加图表色板 */
  palette?: readonly string[];
  /**
   * 流动速度
   * @default 1
   */
  speed?: number;
  /**
   * 噪声扭曲的程度（0 是圆润的光斑，1 起伏明显）
   * @default 0.6
   */
  distortion?: number;
  /**
   * 颗粒感（0 没有颗粒）
   * @default 0.04
   */
  grain?: number;
  /**
   * 指针靠近时品牌色被吸过去
   * @default true
   */
  interactive?: boolean;
}

const MESH_GRADIENT_SHADER = /* glsl */ `
uniform float uDistortion;
uniform float uGrain;

vec4 shade(vec2 uv) {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.12;
  p += uDistortion * 0.3 * vec2(snoise(vec3(p * 1.3, t)), snoise(vec3(p * 1.3 + 7.3, t)));
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < THEME_PALETTE_SIZE; i++) {
    if (i >= uColorCount) break;
    float fi = float(i);
    vec2 center = vec2(
      sin(t * (0.9 + fi * 0.23) + fi * 2.4) * 0.42 * aspect,
      cos(t * (0.7 + fi * 0.31) + fi * 1.7) * 0.38
    );
    // 品牌色（第一个）被指针吸过去，其余跟着动一点
    float pull = (i == 0 ? 0.35 : 0.08) * uPointer.z;
    center = mix(center, uPointer.xy * 0.5 * vec2(aspect, 1.0), pull);
    float d = distance(p, center);
    float weight = exp(-d * d * 5.0) + 0.002;
    sum += uColors[i] * weight;
    total += weight;
  }
  vec3 color = sum / total;
  float noise = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  return vec4(color + noise * uGrain, 1.0);
}
`;

/** 流动的网格渐变：主题色板的光斑缓慢游走、融合 */
export const MeshGradient = _component(
  ({
    palette = SHADER_PALETTE,
    speed = 1,
    distortion = 0.6,
    grain = 0.04,
    interactive = true,
    resolution = 0.5,
    ...rest
  }: MeshGradientProps) => {
    const uniforms = { uDistortion: { value: 0 }, uGrain: { value: 0 } };
    _effect.pre(() => {
      uniforms.uDistortion.value = distortion;
      uniforms.uGrain.value = grain;
    });
    return () => (
      <ShaderBackground
        {...rest}
        fragmentShader={MESH_GRADIENT_SHADER}
        uniforms={uniforms}
        palette={palette}
        speed={speed}
        interactive={interactive}
        resolution={resolution}
      />
    );
  },
);

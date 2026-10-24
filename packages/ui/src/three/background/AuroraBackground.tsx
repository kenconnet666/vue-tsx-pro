/**
 * 极光（div）：几层半透明的光幕在区域上方缓缓飘动，下缘清晰、向上渐隐，带细密的竖向光丝。
 * 背景是透明的，叠在页面底色上：暗色主题里像夜空的极光，亮色主题里是一层淡淡的彩色雾。
 *
 *   <AuroraBackground sx={styles.hero}>
 *     <h1>标题</h1>
 *   </AuroraBackground>
 *
 * 默认色板绿、青、品牌色、紫（取自图表色板，跟随主题）；指针左右移动时光幕跟着轻轻偏移。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）、Content（div）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { colors } from '../../config/theme/tokens';
import type { EffectProps } from '../core/EffectSurface';
import { ShaderBackground } from './ShaderBackground';

/** 极光的默认色板：绿、青、品牌色、紫 */
export const AURORA_PALETTE: readonly string[] = [
  colors.chart7,
  colors.chart2,
  colors.accent,
  colors.chart5,
];

/** 未声明的属性落到外层 div 上 */
export interface AuroraBackgroundProps extends EffectProps {
  /** 色板（token 或 CSS 颜色，2–6 个），默认绿、青、品牌色、紫 */
  palette?: readonly string[];
  /**
   * 飘动速度
   * @default 1
   */
  speed?: number;
  /**
   * 亮度（0–1.5）
   * @default 1
   */
  intensity?: number;
  /**
   * 光幕下缘在区域里的高度（0 底部，1 顶部）
   * @default 0.55
   */
  height?: number;
  /**
   * 跟随指针
   * @default true
   */
  interactive?: boolean;
}

const AURORA_SHADER = /* glsl */ `
uniform float uIntensity;
uniform float uHeight;

vec4 shade(vec2 uv) {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float x = uv.x * aspect + uPointer.x * 0.12 * uPointer.z;
  float t = uTime * 0.08;
  vec3 color = vec3(0.0);
  float alpha = 0.0;
  for (int band = 0; band < 3; band++) {
    float fb = float(band);
    float wave = fbm(vec3(x * (0.7 + fb * 0.25) + fb * 3.1, fb * 1.7, t * (1.0 + fb * 0.35)));
    float edge = uHeight + fb * 0.07 + wave * 0.2;
    float d = uv.y - edge;
    // 下缘清晰、向上指数渐隐
    float curtain = smoothstep(-0.025, 0.015, d) * exp(-max(d, 0.0) * (3.2 + fb * 1.6));
    float rays = 0.55 + 0.45 * snoise(vec3(x * 9.0 + fb * 11.0, t * 3.0, fb));
    float a = curtain * rays * (0.75 - fb * 0.18);
    color += themePalette(clamp(0.15 + fb * 0.3 + wave * 0.35, 0.0, 1.0)) * a;
    alpha += a;
  }
  // 暗色主题里光更亮，亮色主题里收敛成雾
  float strength = uIntensity * mix(0.55, 1.0, uDark);
  return vec4(color / max(alpha, 1e-4), clamp(alpha * strength, 0.0, 1.0));
}
`;

/** 极光：透明背景上缓缓飘动的几层光幕 */
export const AuroraBackground = _component(
  ({
    palette = AURORA_PALETTE,
    speed = 1,
    intensity = 1,
    height = 0.55,
    interactive = true,
    resolution = 0.5,
    ...rest
  }: AuroraBackgroundProps) => {
    const uniforms = { uIntensity: { value: 0 }, uHeight: { value: 0 } };
    _effect.pre(() => {
      uniforms.uIntensity.value = intensity;
      uniforms.uHeight.value = height;
    });
    return () => (
      <ShaderBackground
        {...rest}
        fragmentShader={AURORA_SHADER}
        uniforms={uniforms}
        palette={palette}
        speed={speed}
        interactive={interactive}
        resolution={resolution}
      />
    );
  },
);

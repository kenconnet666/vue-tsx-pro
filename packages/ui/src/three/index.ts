/**
 * 3D 与 WebGL 效果（子路径 `@vue-tsx-pro/ui/three`；three 是可选的 peer 依赖，用到才安装）：
 *
 *   import { ThreeCanvas, useThemeColors } from '@vue-tsx-pro/ui/three';
 *
 * 主入口不导入 three，没用到 3D 的应用不会打包它。不依赖 three 的效果（TiltCard、SpotlightCard、BorderBeam）在主入口。
 */
export { disposeMaterial, disposeObject } from './core/dispose';
export {
  activeThreeContexts,
  resolveThreeQuality,
  setMaxThreeContexts,
  type ResolvedThreeQuality,
  type ThreeQualities,
  type ThreeQuality,
} from './core/quality';
export {
  useThree,
  type ThreeContext,
  type ThreeController,
  type ThreeFrame,
  type ThreeOptions,
  type ThreeSceneHandle,
  type ThreeSize,
  type ThreeStatus,
} from './core/renderer';
export { shaderChunks, THEME_PALETTE_SIZE } from './core/shaders';
export {
  createThemeColorSet,
  readThemeColor,
  useThemeColors,
  type ThemeColorOptions,
  type ThemeColors,
  type ThemeColorSet,
  type ThemeColorSources,
} from './core/theme-colors';
export { ThreeCanvas, threeCanvasStyles, type ThreeCanvasProps } from './core/ThreeCanvas';
export {
  EffectSurface,
  effectSurfaceStyles,
  type EffectProps,
  type EffectSurfaceProps,
} from './core/EffectSurface';
export {
  AURORA_PALETTE,
  AuroraBackground,
  type AuroraBackgroundProps,
} from './background/AuroraBackground';
export { MeshGradient, type MeshGradientProps } from './background/MeshGradient';
export {
  SHADER_PALETTE,
  ShaderBackground,
  type ShaderBackgroundProps,
} from './background/ShaderBackground';
export {
  CONFETTI_PALETTE,
  Confetti,
  confettiStyles,
  type ConfettiOrigin,
  type ConfettiProps,
} from './effects/Confetti';
export { PARTICLE_PALETTE, ParticleField, type ParticleFieldProps } from './effects/ParticleField';
export {
  Globe,
  globeStyles,
  latLngToVector,
  type GeoPoint,
  type GlobeArc,
  type GlobeMarker,
  type GlobeProps,
} from './globe/Globe';
export {
  WAVE_GRID_PALETTE,
  WaveGrid,
  type WaveGridProps,
  type WaveGridVariants,
} from './effects/WaveGrid';

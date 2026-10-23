/**
 * 3D 与 WebGL 效果（子路径 `@vue-tsx-pro/ui/three`；three 是可选的 peer 依赖，用到才安装）：
 *
 *   import { ThreeCanvas, useThemeColors } from '@vue-tsx-pro/ui/three';
 *
 * 主入口不导入 three，没用到 3D 的应用不会打包它。不依赖 three 的效果（TiltCard、SpotlightCard、BorderBeam、Marquee）在 `@vue-tsx-pro/ui/effects`。
 */
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
  EffectSurface,
  effectSurfaceStyles,
  type EffectProps,
  type EffectSurfaceProps,
} from './core/EffectSurface';
export { ThreeCanvas, threeCanvasStyles, type ThreeCanvasProps } from './core/ThreeCanvas';
export { disposeMaterial, disposeObject } from './core/dispose';
export { createOrbit, type Orbit, type OrbitOptions } from './core/orbit';
export {
  acquireContext,
  activeThreeContexts,
  releaseContext,
  resolveThreeQuality,
  retryWaiting,
  setMaxThreeContexts,
  type ContextHolder,
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
export {
  Confetti,
  CONFETTI_PALETTE,
  confettiStyles,
  type ConfettiOrigin,
  type ConfettiProps,
} from './effects/Confetti';
export { PARTICLE_PALETTE, ParticleField, type ParticleFieldProps } from './effects/ParticleField';
export {
  WAVE_GRID_PALETTE,
  WaveGrid,
  type WaveGridProps,
  type WaveGridVariants,
} from './effects/WaveGrid';
export {
  Globe,
  globeStyles,
  latLngToVector,
  type GeoPoint,
  type GlobeArc,
  type GlobeMarker,
  type GlobeProps,
} from './globe/Globe';
export { LAND_BITS, LAND_HEIGHT, LAND_WIDTH } from './globe/land';
export {
  ModelViewer,
  modelViewerStyles,
  type ModelViewerProps,
  type ModelViewerStatuses,
} from './model/ModelViewer';

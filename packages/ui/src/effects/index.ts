/**
 * 视觉效果（子路径 `@vue-tsx-pro/ui/effects`）：倾斜卡片 TiltCard、聚光卡片 SpotlightCard、流光边框 BorderBeam、
 * 跑马灯 Marquee。官网、活动页、登录页的点缀，后台业务界面一般用不到，不放在主入口。
 *
 *   import { SpotlightCard, Marquee } from '@vue-tsx-pro/ui/effects';
 *
 * 不依赖 three；要 WebGL 的背景与 3D 效果在 `@vue-tsx-pro/ui/three`。都尊重“减少动态效果”。
 */
export {
  BorderBeam,
  borderBeamDynamicStyles,
  borderBeamStyles,
  type BorderBeamProps,
} from './BorderBeam';
export {
  Marquee,
  marqueeDynamicStyles,
  marqueeStyles,
  marqueeTrailStyles,
  type MarqueeDirections,
  type MarqueeProps,
} from './Marquee';
export {
  SpotlightCard,
  spotlightCardDynamicStyles,
  spotlightCardStyles,
  type SpotlightCardProps,
} from './SpotlightCard';
export { TiltCard, tiltCardDynamicStyles, tiltCardStyles, type TiltCardProps } from './TiltCard';

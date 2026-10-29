/**
 * 组件共用的档位：色调、尺寸、圆角。取值写成带注释的接口，`keyof` 出来的联合在补全与悬停里能看到每个取值的意思。
 */

/** 色调 */
export interface MobileTones {
  /** 品牌色：主要操作、选中 */
  accent: unknown;
  /** 中性：次要操作、普通标签 */
  neutral: unknown;
  /** 危险：删除、错误 */
  danger: unknown;
  /** 成功 */
  success: unknown;
  /** 警告 */
  warning: unknown;
  /** 信息 */
  info: unknown;
}
/** 色调 */
export type MobileTone = keyof MobileTones;

/** 控件的尺寸档位 */
export interface MobileSizes {
  /** 极小：行内的小按钮、标签（24px 高） */
  xs: unknown;
  /** 小：卡片里的按钮（32px 高） */
  sm: unknown;
  /** 中：页面里的常规控件（44px 高，触控目标的推荐尺寸） */
  md: unknown;
  /** 大：页面底部的主操作（50px 高） */
  lg: unknown;
}
/** 控件的尺寸档位 */
export type MobileSize = keyof MobileSizes;

/** 圆角 */
export interface MobileRadii {
  /** 直角 */
  none: unknown;
  /** 小圆角 */
  sm: unknown;
  /** 常规圆角 */
  md: unknown;
  /** 大圆角 */
  lg: unknown;
  /** 全圆：胶囊、圆形 */
  full: unknown;
}
/** 圆角 */
export type MobileRadius = keyof MobileRadii;
